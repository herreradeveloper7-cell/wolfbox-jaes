import { poolPromise, sql } from "../../config/db.js";

export const obtenerRegionesPorPais = async (req, res) => {
  try {
    const { pais_id } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("pais_id", sql.Int, pais_id)
      .query(`
        SELECT
          id,
          pais_id,
          nombre,
          tipo_region,
          codigo,
          activo
        FROM regiones
        WHERE pais_id = @pais_id
          AND activo = 1
        ORDER BY nombre ASC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo regiones:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error interno al obtener regiones",
    });
  }
};