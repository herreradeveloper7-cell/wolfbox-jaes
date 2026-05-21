import { poolPromise, sql } from "../config/db.js";
import { buildConciliacionQuery } from "../utils/conciliacion.helpers.js";
import { crearNotificacionUsuarios } from "../utils/notificaciones.service.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const eliminarArchivoComprobante = (rutaRelativa) => {
  if (!rutaRelativa || !String(rutaRelativa).startsWith("/uploads/comprobantes/")) {
    return;
  }

  const filePath = path.join(__dirname, "..", rutaRelativa);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const buscarConciliacion = async (req, res) => {
  try {

    const { fechaInicio, fechaFin, cliente, solicitud } = req.query;

    const pool = await poolPromise;
    const request = pool.request();

    const { query, inputs } = buildConciliacionQuery({
      fechaInicio,
      fechaFin,
      cliente,
      solicitud,
    });

    inputs.forEach(({ name, type, value }) => {
      request.input(name, sql[type], value);
    });

    const result = await request.query(query);

    res.json(result.recordset);

  } catch (error) {
    console.error("Error conciliación:", error);
    res.status(500).json({ error: "Error consultando conciliación" });
  }
};

export const autorizarSolicitud = async (req, res) => {

  const { id } = req.params;
  const { responsable } = req.body;

  try {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    request.input("id", sql.Int, id);
    request.input("responsable", sql.VarChar, responsable);

    // id estado desbloqueado
    const estado = await request.query(`
      SELECT id 
      FROM estados_catalogo
      WHERE nombre = 'Desbloqueado'
    `);

    const estadoId = estado.recordset[0].id;

    // actualizar paquete
    await request.query(`
      UPDATE paquetes
      SET estado_id = ${estadoId}
      WHERE solicitud_id = @id
      AND hawb_padre IS NULL
    `);

    // insertar historial
    await request.query(`
      INSERT INTO historial_estados
      (
        hawb,
        estado_id,
        fecha,
        responsable,
        observaciones
      )
      SELECT
        hawb,
        ${estadoId},
        GETDATE(),
        @responsable,
        'Pago autorizado'
      FROM paquetes
      WHERE solicitud_id = @id
      AND hawb_padre IS NULL
    `);

    // actualizar solicitud
    await request.query(`
      UPDATE solicitudes
      SET estado = 'Autorizado'
      WHERE id = @id
    `);

    await transaction.commit();

    res.json({
      message: "Solicitud autorizada correctamente"
    });

  } catch (error) {

    console.error("❌ Error autorizando:", error);

    res.status(500).json({
      message: "Error al autorizar solicitud"
    });

  }

};

export const quitarAutorizacionSolicitud = async (req, res) => {

  const { id } = req.params;
  const { responsable } = req.body;

  try {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    request.input("id", sql.Int, id);

    // obtener id estado facturado pendiente
    const estado = await request.query(`
      SELECT id
      FROM estados_catalogo
      WHERE LOWER(nombre) = 'facturado pendiente de pago'
    `);

    const estadoId = estado.recordset[0].id;

    // actualizar paquete
    await request.query(`
      UPDATE paquetes
      SET estado_id = ${estadoId}
      WHERE solicitud_id = @id
      AND hawb_padre IS NULL
    `);

    // eliminar ultimo desbloqueado del historial
    await request.query(`
    DELETE FROM historial_estados
    WHERE id IN (
        SELECT TOP 1 id
        FROM historial_estados
        WHERE hawb IN (
            SELECT hawb
            FROM paquetes
            WHERE solicitud_id = @id
            AND hawb_padre IS NULL
        )
        AND estado_id = (
            SELECT id
            FROM estados_catalogo
            WHERE nombre = 'Desbloqueado'
        )
        ORDER BY fecha DESC
    )
    `);

    // actualizar solicitud
    await request.query(`
      UPDATE solicitudes
      SET estado = 'Pendiente'
      WHERE id = @id
    `);

    await transaction.commit();

    res.json({
      message: "Autorización removida correctamente"
    });

  } catch (error) {

    console.error("❌ Error quitando autorización:", error);

    res.status(500).json({
      message: "Error al quitar la autorización"
    });

  }

};

export const subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        mensaje: "No se recibió archivo"
      });
    }

    const pool = await poolPromise;

    const existente = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT comprobante_pago_url, comprobante
        FROM solicitudes
        WHERE id = @id
      `);

    if (!existente.recordset.length) {
      eliminarArchivoComprobante(`/uploads/comprobantes/${req.file.filename}`);
      return res.status(404).json({ mensaje: "Solicitud no encontrada." });
    }

    const comprobanteActual =
      existente.recordset[0].comprobante_pago_url || existente.recordset[0].comprobante;

    if (comprobanteActual) {
      const rutaAnterior = String(comprobanteActual).replace(/^https?:\/\/[^/]+/i, "");
      eliminarArchivoComprobante(rutaAnterior);
    }

    const rutaArchivo = `/uploads/comprobantes/${req.file.filename}`;
    const request = pool.request();

    request.input("id", sql.Int, id);
    request.input("comprobante", sql.VarChar, rutaArchivo);

    await request.query(`
      UPDATE solicitudes
      SET comprobante_pago_url = @comprobante,
          comprobante = @comprobante
      WHERE id = @id
    `);

    const detalle = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT TOP 1
          s.id,
          c.codigo_referencia,
          LTRIM(RTRIM(
            CASE
              WHEN LOWER(ISNULL(c.tipo_cliente, '')) = 'empresarial'
                THEN ISNULL(NULLIF(c.nombre_empresa, ''), CONCAT(c.primer_nombre, ' ', c.primer_apellido))
              ELSE CONCAT(
                ISNULL(c.primer_nombre, ''), ' ',
                ISNULL(c.segundo_nombre, ''), ' ',
                ISNULL(c.primer_apellido, ''), ' ',
                ISNULL(c.segundo_apellido, '')
              )
            END
          )) AS nombre_cliente
        FROM solicitudes s
        LEFT JOIN clientes c ON c.id = s.cliente_id
        WHERE s.id = @id
      `);

    const solicitud = detalle.recordset[0];
    const cliente = solicitud?.nombre_cliente || solicitud?.codigo_referencia || "cliente";
    const accion = comprobanteActual ? "reemplazo" : "cargo";

    crearNotificacionUsuarios({
      tipo: "success",
      titulo: comprobanteActual ? "Comprobante reemplazado" : "Comprobante cargado",
      mensaje: `Se ${accion} el comprobante de pago de la solicitud #${id} para ${cliente}.`,
      entidadTipo: "solicitud",
      entidadId: Number(id),
      url: "/conciliacion-pagos",
    }).catch((error) => {
      console.error("Error creando notificacion de comprobante:", error);
    });

    res.json({
      ok: true,
      url: rutaArchivo
    });

  } catch (error) {
    console.error("❌ Error subiendo comprobante:", error);

    res.status(500).json({
      mensaje: "Error al subir comprobante"
    });
  }
};

export const descargarComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT comprobante_pago_url, comprobante
        FROM solicitudes
        WHERE id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada." });
    }

    const comprobante =
      result.recordset[0].comprobante_pago_url || result.recordset[0].comprobante;

    if (!comprobante) {
      return res.status(404).json({ mensaje: "La solicitud no tiene comprobante cargado." });
    }

    const rutaRelativa = String(comprobante).replace(/^https?:\/\/[^/]+/i, "");

    if (!rutaRelativa.startsWith("/uploads/comprobantes/")) {
      return res.status(400).json({ mensaje: "Ruta de comprobante no valida." });
    }

    const filePath = path.join(__dirname, "..", rutaRelativa);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ mensaje: "No se encontro el archivo del comprobante." });
    }

    return res.download(filePath);
  } catch (error) {
    console.error("Error descargando comprobante:", error);
    return res.status(500).json({ mensaje: "Error descargando comprobante." });
  }
};
