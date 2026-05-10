import { poolPromise, sql } from "../../config/db.js";

export const obtenerCiudadesPorRegion = async (req, res) => {
  try {
    const { region_id } = req.params;

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("region_id", sql.Int, region_id)
      .query(`
        SELECT
          id,
          region_id,
          nombre,
          activo
        FROM ciudades
        WHERE region_id = @region_id
          AND activo = 1
        ORDER BY nombre ASC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo ciudades:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error interno al obtener ciudades",
    });
  }
};