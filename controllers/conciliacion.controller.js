import { poolPromise, sql } from "../config/db.js";

export const buscarConciliacion = async (req, res) => {
  try {

    const { fechaInicio, fechaFin, cliente, solicitud } = req.query;

    const pool = await poolPromise;
    const request = pool.request();

    let query = `
    SELECT 
      s.id AS solicitud_id,
      s.fecha,
      c.codigo_referencia,

      CONCAT(
        c.primer_nombre,' ',
        ISNULL(c.segundo_nombre,''),' ',
        c.primer_apellido,' ',
        ISNULL(c.segundo_apellido,'')
      ) AS nombre_cliente,

      s.valor_estimado_usd AS totalUSD,
      s.valor_moneda_local AS totalCOP,

      trm.valor AS trm,

      s.estado AS estado_paquete,
      s.comprobante

  FROM solicitudes s

  INNER JOIN clientes c 
      ON c.id = s.cliente_id

  CROSS JOIN (
      SELECT TOP 1 valor 
      FROM trm 
      ORDER BY fecha DESC
  ) trm

  WHERE 1=1
    `;

    if (fechaInicio) {
      query += ` AND CAST(s.fecha AS DATE) >= @fechaInicio`;
      request.input("fechaInicio", sql.Date, fechaInicio);
    }

    if (fechaFin) {
      query += ` AND CAST(s.fecha AS DATE) <= @fechaFin`;
      request.input("fechaFin", sql.Date, fechaFin);
    }

    if (cliente) {
      query += `
        AND (
            c.codigo_referencia LIKE @cliente
            OR c.primer_nombre LIKE @cliente
            OR c.primer_apellido LIKE @cliente
        )
      `;
      request.input("cliente", sql.VarChar, `%${cliente}%`);
    }

    if (solicitud) {
      query += ` AND s.id = @solicitud`;
      request.input("solicitud", sql.Int, solicitud);
    }

    query += ` ORDER BY s.fecha DESC`;

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