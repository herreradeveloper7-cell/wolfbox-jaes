import { poolPromise, sql } from "../../config/db.js";

export const obtenerPaises = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        id,
        nombre,
        codigo_iso,
        activo
      FROM paises
      WHERE activo = 1
      ORDER BY nombre ASC
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo países:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error interno al obtener países",
    });
  }
};