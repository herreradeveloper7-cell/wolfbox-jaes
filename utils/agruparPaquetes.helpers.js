const ESTADO_LISTO_AGRUPAR = "Llega bodega Bogota";

const buildBaseCte = ({ fechaInicio, fechaFin } = {}) => {
  let query = `
    WITH PuntoControlSeleccionado AS (
      SELECT id
      FROM puntos_control
      WHERE id = @puntoControl
        AND (@oficina IS NULL OR oficina_id = @oficina)
    ),
    UltimoEstado AS (
      SELECT hawb, estado_id, punto_control, fecha
      FROM (
        SELECT
          h.hawb,
          h.estado_id,
          h.punto_control,
          h.fecha,
          ROW_NUMBER() OVER (
            PARTITION BY h.hawb
            ORDER BY h.fecha DESC, h.id DESC
          ) AS rn
        FROM historial_estados h
      ) ranked
      WHERE rn = 1
    ),
    PaquetesSolicitud AS (
      SELECT
        s.id AS solicitud_id,
        s.fecha,
        s.estado,
        c.primer_nombre,
        c.primer_apellido,
        c.codigo_referencia,
        p.id AS paquete_id,
        p.hawb,
        ec.nombre AS estado_actual,
        ec.punto_control_id
      FROM solicitudes s
      INNER JOIN paquetes p
        ON p.solicitud_id = s.id
      INNER JOIN clientes c
        ON c.id = s.cliente_id
      LEFT JOIN UltimoEstado ue
        ON ue.hawb = p.hawb
      LEFT JOIN estados_catalogo ec
        ON ec.id = ue.estado_id
      WHERE ISNULL(p.agrupado_bit, 0) = 0
        AND p.hawb_padre IS NULL
        AND ISNULL(p.hawb, '') NOT LIKE '%G'
  `;

  const inputs = [
    { name: "puntoControl", type: "Int", value: null },
    { name: "oficina", type: "Int", value: null },
  ];

  if (fechaInicio) {
    query += ` AND CAST(s.fecha AS DATE) >= @fechaInicio`;
    inputs.push({ name: "fechaInicio", type: "Date", value: fechaInicio });
  }

  if (fechaFin) {
    query += ` AND CAST(s.fecha AS DATE) <= @fechaFin`;
    inputs.push({ name: "fechaFin", type: "Date", value: fechaFin });
  }

  query += `
    ),
    SolicitudesCandidatas AS (
      SELECT solicitud_id
      FROM PaquetesSolicitud
      GROUP BY solicitud_id
      HAVING COUNT(paquete_id) >= 2
        AND SUM(
          CASE
            WHEN LTRIM(RTRIM(estado_actual)) COLLATE Latin1_General_CI_AI = N'${ESTADO_LISTO_AGRUPAR}'
             AND punto_control_id IN (SELECT id FROM PuntoControlSeleccionado)
            THEN 1
            ELSE 0
          END
        ) = COUNT(paquete_id)
    )
  `;

  return { query, inputs };
};

export const buildSolicitudesAgrupablesQueries = ({
  page = 1,
  limit = 10,
  fechaInicio,
  fechaFin,
  puntoControl,
  oficina,
} = {}) => {
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.max(Number(limit) || 10, 1);
  const offset = (pageNumber - 1) * limitNumber;
  const base = buildBaseCte({ fechaInicio, fechaFin });

  const sharedInputs = base.inputs.map((input) => {
    if (input.name === "puntoControl") {
      return { ...input, value: Number(puntoControl) };
    }

    if (input.name === "oficina") {
      return { ...input, value: oficina ? Number(oficina) : null };
    }

    return input;
  });

  const dataQuery = `
    ${base.query}
    SELECT
      ps.solicitud_id AS id,
      CONVERT(varchar, ps.fecha, 23) AS fecha,
      ps.estado,
      CONCAT(ps.primer_nombre, ' ', ps.primer_apellido) AS cliente_nombre,
      ps.codigo_referencia,
      COUNT(ps.paquete_id) AS cantidadPaquetes,
      STRING_AGG(ps.hawb, ', ') AS hawbs
    FROM PaquetesSolicitud ps
    INNER JOIN SolicitudesCandidatas sc
      ON sc.solicitud_id = ps.solicitud_id
    GROUP BY
      ps.solicitud_id,
      ps.fecha,
      ps.estado,
      ps.primer_nombre,
      ps.primer_apellido,
      ps.codigo_referencia
    ORDER BY ps.fecha DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const totalQuery = `
    ${base.query}
    SELECT COUNT(*) AS total
    FROM SolicitudesCandidatas
  `;

  return {
    dataQuery,
    totalQuery,
    dataInputs: [
      ...sharedInputs,
      { name: "offset", type: "Int", value: offset },
      { name: "limit", type: "Int", value: limitNumber },
    ],
    totalInputs: sharedInputs,
    pageNumber,
    limitNumber,
  };
};
