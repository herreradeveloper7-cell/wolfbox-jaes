export const buildConciliacionQuery = ({ fechaInicio, fechaFin, cliente, solicitud } = {}) => {
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

      CASE
        WHEN ISNULL(s.valor_estimado_usd, 0) > 0
          THEN CAST(s.valor_moneda_local AS DECIMAL(18, 4)) / CAST(s.valor_estimado_usd AS DECIMAL(18, 4))
        ELSE 0
      END AS trm,

      s.estado AS estado_paquete,
      s.comprobante

  FROM solicitudes s

  INNER JOIN clientes c 
      ON c.id = s.cliente_id

  WHERE 1=1
    `;

  const inputs = [];

  if (fechaInicio) {
    query += ` AND CAST(s.fecha AS DATE) >= @fechaInicio`;
    inputs.push({ name: "fechaInicio", type: "Date", value: fechaInicio });
  }

  if (fechaFin) {
    query += ` AND CAST(s.fecha AS DATE) <= @fechaFin`;
    inputs.push({ name: "fechaFin", type: "Date", value: fechaFin });
  }

  if (cliente) {
    query += `
        AND (
            c.codigo_referencia LIKE @cliente
            OR c.primer_nombre LIKE @cliente
            OR c.primer_apellido LIKE @cliente
        )
      `;
    inputs.push({ name: "cliente", type: "VarChar", value: `%${cliente}%` });
  }

  if (solicitud) {
    query += ` AND s.id = @solicitud`;
    inputs.push({ name: "solicitud", type: "Int", value: solicitud });
  }

  query += ` ORDER BY s.fecha DESC`;

  return { query, inputs };
};
