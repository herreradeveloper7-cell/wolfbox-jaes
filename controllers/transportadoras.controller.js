import { poolPromise, sql } from "../config/db.js";

export const listarTransportadoras = async (req, res) => {
  try {
    const oficinaId = Number(req.query.oficina_id || 0);

    if (!oficinaId) {
      return res.status(400).json({
        ok: false,
        mensaje: "oficina_id es requerido.",
      });
    }

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("oficina_id", sql.Int, oficinaId)
      .query(`
        SELECT
          id,
          oficina_id,
          nombre,
          nit,
          contacto,
          telefono,
          email,
          activo
        FROM transportadoras
        WHERE oficina_id = @oficina_id
          AND ISNULL(activo, 1) = 1
        ORDER BY nombre
      `);

    res.json({ ok: true, transportadoras: result.recordset });
  } catch (error) {
    console.error("Error listando transportadoras:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error listando transportadoras.",
    });
  }
};
