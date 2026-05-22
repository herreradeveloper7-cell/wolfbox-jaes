import { poolPromise, sql } from "../config/db.js";

export const obtenerResumenUsuario = async (req, res) => {
  try {
    const { periodo = "todos" } = req.query;
    const diasPorPeriodo = {
      "7d": 7,
      "15d": 15,
      "1m": 30,
      "1y": 365,
    };
    const dias = diasPorPeriodo[periodo];
    const pool = await poolPromise;
    const request = pool.request();
    const filtroPaquetes = dias
      ? "AND p.fecha_registro >= DATEADD(day, -@dias, CAST(GETDATE() AS date))"
      : "";
    const filtroSolicitudes = dias
      ? "AND s.fecha >= DATEADD(day, -@dias, CAST(GETDATE() AS date))"
      : "";

    if (dias) {
      request.input("dias", sql.Int, dias);
    }

    const result = await request.query(`
      SELECT
        (
          SELECT COUNT(*)
          FROM paquetes p
          INNER JOIN estados_catalogo e ON e.id = p.estado_id
          WHERE LOWER(LTRIM(RTRIM(e.nombre))) = 'digitado'
          ${filtroPaquetes}
        ) AS paquetesDigitados,

        (
          SELECT COUNT(DISTINCT s.id)
          FROM solicitudes s
          WHERE EXISTS (
            SELECT 1
            FROM paquetes p
            WHERE p.solicitud_id = s.id
              AND p.hawb_padre IS NULL
              AND ISNULL(p.agrupado_bit, 0) = 0
              AND ISNULL(p.hawb, '') NOT LIKE '%G'
          )
          ${filtroSolicitudes}
          AND NOT EXISTS (
            SELECT 1
            FROM paquetes p
            WHERE p.solicitud_id = s.id
              AND (
                p.hawb_padre IS NOT NULL
                OR ISNULL(p.hawb, '') LIKE '%G'
                OR ISNULL(p.agrupado_bit, 0) = 1
              )
          )
        ) AS solicitudesSinAgrupar,

        (
          SELECT COUNT(DISTINCT s.id)
          FROM solicitudes s
          INNER JOIN paquetes p ON p.solicitud_id = s.id
          WHERE (
            p.hawb_padre IS NOT NULL
            OR ISNULL(p.hawb, '') LIKE '%G'
            OR ISNULL(p.agrupado_bit, 0) = 1
          )
          ${filtroSolicitudes}
        ) AS solicitudesAgrupadas,

        (
          SELECT COUNT(DISTINCT p.cliente_id)
          FROM paquetes p
          INNER JOIN estados_catalogo e ON e.id = p.estado_id
          WHERE LOWER(LTRIM(RTRIM(e.nombre))) = 'digitado'
          ${filtroPaquetes}
        ) AS clientesConPaquetesDigitados
    `);

    const resumen = result.recordset[0] || {};

    return res.json({
      ok: true,
      resumen: {
        paquetesDigitados: Number(resumen.paquetesDigitados || 0),
        solicitudesSinAgrupar: Number(resumen.solicitudesSinAgrupar || 0),
        solicitudesAgrupadas: Number(resumen.solicitudesAgrupadas || 0),
        clientesConPaquetesDigitados: Number(resumen.clientesConPaquetesDigitados || 0),
      },
    });
  } catch (error) {
    console.error("Error obteniendo resumen dashboard:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo resumen del dashboard",
    });
  }
};
