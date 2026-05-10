import { poolPromise } from "../../config/db.js";

export const obtenerOficinas = async (req, res) => {
  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, nombre
      FROM oficinas
      ORDER BY nombre
    `);

    res.json(result.recordset);

  } catch (error) {

    console.error("❌ Error obteniendo oficinas:", error);

    res.status(500).json({
      mensaje: "Error obteniendo oficinas"
    });

  }
};