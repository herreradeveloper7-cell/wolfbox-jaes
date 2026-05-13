import { poolPromise, sql } from "../config/db.js";
import { buildSolicitudesAgrupablesQueries } from "../utils/agruparPaquetes.helpers.js";

const SQL_TYPES = {
  Date: sql.Date,
  Int: sql.Int,
};

const applyInputs = (request, inputs) => {
  inputs.forEach(({ name, type, value }) => {
    request.input(name, SQL_TYPES[type], value);
  });

  return request;
};

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

    return res.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo puntos de control:", error);
    return res.status(500).json({ mensaje: "Error obteniendo puntos de control" });
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

    return res.json(result.recordset);
  } catch (error) {
    console.error("Error obteniendo oficinas:", error);
    return res.status(500).json({ mensaje: "Error obteniendo oficinas" });
  }
};

export const obtenerSolicitudesAgrupables = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      fechaInicio,
      fechaFin,
      puntoControl,
      oficina,
    } = req.query;

    const puntoControlId = Number(puntoControl);

    if (!puntoControl || Number.isNaN(puntoControlId) || puntoControlId <= 0) {
      return res.status(400).json({
        mensaje: "Debe seleccionar un punto de control valido",
      });
    }

    const pool = await poolPromise;
    const {
      dataQuery,
      totalQuery,
      dataInputs,
      totalInputs,
      pageNumber,
      limitNumber,
    } = buildSolicitudesAgrupablesQueries({
      page,
      limit,
      fechaInicio,
      fechaFin,
      puntoControl: puntoControlId,
      oficina,
    });

    const data = await applyInputs(pool.request(), dataInputs).query(dataQuery);
    const total = await applyInputs(pool.request(), totalInputs).query(totalQuery);
    const totalRegistros = total.recordset[0]?.total || 0;

    return res.json({
      data: data.recordset,
      total: totalRegistros,
      totalPages: Math.max(Math.ceil(totalRegistros / limitNumber), 1),
      page: pageNumber,
    });
  } catch (error) {
    console.error("Error agrupando solicitudes:", error);
    return res.status(500).json({
      mensaje: "Error obteniendo solicitudes agrupables",
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
          AND p.hawb_padre IS NULL
          AND ISNULL(p.hawb, '') NOT LIKE '%G'
      `);

    return res.json({
      solicitud: solicitudRes.recordset[0],
      paquetes: paquetesRes.recordset,
    });
  } catch (error) {
    console.error("Error obteniendo detalle de solicitud:", error);
    return res.status(500).json({ mensaje: "Error obteniendo detalle de la solicitud" });
  }
};
