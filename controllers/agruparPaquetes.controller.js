import { poolPromise, sql } from "../config/db.js";

export const obtenerPuntosControl = async (req, res) => {
  try {
    const { oficina_id } = req.query;

    if (!oficina_id) {
      return res.json([]);
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("oficina_id", sql.Int, Number(oficina_id))
      .query(`
        SELECT id, nombre, orden
        FROM puntos_control
        WHERE activo = 1
          AND oficina_id = @oficina_id
        ORDER BY orden
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo puntos de control:", error);
    res.status(500).json({ mensaje: "Error obteniendo puntos de control" });
  }
};

export const obtenerOficinas = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, nombre
      FROM oficinas
      WHERE activo = 1
      ORDER BY nombre
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo oficinas:", error);
    res.status(500).json({ mensaje: "Error obteniendo oficinas" });
  }
};

export const obtenerSolicitudesAgrupables = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const pool = await poolPromise;

    const data = await pool.request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limitNumber)
      .query(`
        WITH UltimoEstado AS (
          SELECT 
            h.hawb,
            h.estado_id,
            h.punto_control,
            h.fecha
          FROM historial_estados h
          INNER JOIN (
            SELECT hawb, MAX(fecha) AS fecha_max
            FROM historial_estados
            GROUP BY hawb
          ) x
            ON h.hawb = x.hawb
           AND h.fecha = x.fecha_max
        )

        SELECT
          s.id,
          CONVERT(varchar, s.fecha, 23) AS fecha,
          s.estado,

          c.primer_nombre + ' ' + c.primer_apellido AS cliente_nombre,
          c.codigo_referencia,

          COUNT(p.id) AS cantidadPaquetes,
          STRING_AGG(p.hawb, ', ') AS hawbs

        FROM solicitudes s
        INNER JOIN paquetes p 
          ON p.solicitud_id = s.id

        INNER JOIN clientes c 
          ON c.id = s.cliente_id

        INNER JOIN UltimoEstado ue 
          ON ue.hawb = p.hawb

        INNER JOIN estados_catalogo ec
          ON ec.id = ue.estado_id

        WHERE
          ec.nombre = 'Llega bodega Bogotá'
          AND ue.punto_control = 'Casilleros bodega'
          AND ISNULL(p.agrupado_bit, 0) = 0

        GROUP BY
          s.id,
          s.fecha,
          s.estado,
          c.primer_nombre,
          c.primer_apellido,
          c.codigo_referencia

        ORDER BY s.fecha DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);

    const total = await pool.request().query(`
      WITH UltimoEstado AS (
        SELECT 
          h.hawb,
          h.estado_id,
          h.punto_control,
          h.fecha
        FROM historial_estados h
        INNER JOIN (
          SELECT hawb, MAX(fecha) AS fecha_max
          FROM historial_estados
          GROUP BY hawb
        ) x
          ON h.hawb = x.hawb
         AND h.fecha = x.fecha_max
      )

      SELECT COUNT(DISTINCT s.id) AS total

      FROM solicitudes s
      INNER JOIN paquetes p 
        ON p.solicitud_id = s.id

      INNER JOIN clientes c 
        ON c.id = s.cliente_id

      INNER JOIN UltimoEstado ue 
        ON ue.hawb = p.hawb

      INNER JOIN estados_catalogo ec
        ON ec.id = ue.estado_id

      WHERE
        ec.nombre = 'Llega bodega Bogotá'
        AND ue.punto_control = 'Casilleros bodega'
        AND ISNULL(p.agrupado_bit, 0) = 0
    `);

    res.json({
      data: data.recordset,
      total: total.recordset[0].total
    });

  } catch (error) {
    console.error("❌ Error agrupando solicitudes:", error);
    res.status(500).json({
      mensaje: "Error obteniendo solicitudes agrupables"
    });
  }
};


export const obtenerDetalleSolicitudAgrupar = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const solicitudRes = await pool.request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT
          s.id,
          CONVERT(varchar, s.fecha, 23) AS fecha,
          s.estado,
          c.primer_nombre + ' ' + c.primer_apellido AS cliente_nombre,
          c.codigo_referencia
        FROM solicitudes s
        INNER JOIN clientes c ON c.id = s.cliente_id
        WHERE s.id = @id
      `);

    if (solicitudRes.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const paquetesRes = await pool.request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT
          p.id,
          p.hawb,
          p.peso,
          p.contenido
        FROM paquetes p
        WHERE p.solicitud_id = @id
          AND ISNULL(p.agrupado_bit, 0) = 0
      `);

    res.json({
      solicitud: solicitudRes.recordset[0],
      paquetes: paquetesRes.recordset
    });

  } catch (error) {
    console.error("❌ Error obteniendo detalle de solicitud:", error);
    res.status(500).json({ mensaje: "Error obteniendo detalle de la solicitud" });
  }
};



