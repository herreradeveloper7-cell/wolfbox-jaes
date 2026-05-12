import { poolPromise, sql } from "../config/db.js";
import { buildConciliacionQuery } from "../utils/conciliacion.helpers.js";

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

    const rutaArchivo = `http://localhost:3000/uploads/comprobantes/${req.file.filename}`;

    const pool = await poolPromise;
    const request = pool.request();

    request.input("id", sql.Int, id);
    request.input("comprobante", sql.VarChar, rutaArchivo);

    await request.query(`
      UPDATE solicitudes
      SET comprobante = @comprobante
      WHERE id = @id
    `);

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
