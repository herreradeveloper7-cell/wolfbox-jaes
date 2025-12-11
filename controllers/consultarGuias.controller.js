import { poolPromise, sql } from "../config/db.js";

export const buscarGuias = async (req, res) => {
  const {
    guia,
    referencia,
    fechaDesde,
    fechaHasta,
    servicio,
    paisDestino,
    usuario,
    oficina,
    notificacion,
    tienda,
    cliente,
    pesoInicio,
    pesoFin
  } = req.body;

  try {
    const pool = await poolPromise;
    let query = `
      SELECT 
        id,
        ISNULL(hawb, numero_guia) AS guia,
        tracking,
        contenido,
        fecha_registro AS fecha,
        ubicacion,
        estado AS estado,
        p.peso AS pesoLb,
        (p.peso * 0.453592) AS pesoKg,
        declaracion_valor
      FROM paquetes p
      WHERE 1=1

    `;

    if (guia) query += ` AND (numero_guia LIKE '%${guia}%' OR hawb LIKE '%${guia}%')`;
    if (referencia) query += ` AND codigo_referencia LIKE '%${referencia}%'`;
    if (fechaDesde) query += ` AND fecha_registro >= '${fechaDesde} 00:00:00'`;
    if (fechaHasta) query += ` AND fecha_registro <= '${fechaHasta} 23:59:59'`;
    if (tienda) query += ` AND tienda LIKE '%${tienda}%'`;
    if (oficina) query += ` AND oficina LIKE '%${oficina}%'`;
    if (cliente) query += ` AND codigo_referencia LIKE '%${cliente}%'`;
    if (pesoInicio) query += ` AND peso >= ${pesoInicio}`;
    if (pesoFin) query += ` AND peso <= ${pesoFin}`;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al buscar guías:", error);
    res.status(500).json({ message: "Error al buscar guías" });
  }
};
