import { poolPromise, sql } from "../config/db.js";

export const getUltimoTRM = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 1 valor, fecha_actualizacion
      FROM trm
      ORDER BY fecha_actualizacion DESC
    `);

    res.json(result.recordset[0] || null);

  } catch (e) {
    res.status(500).json({ ok:false, msg:"Error obteniendo TRM" });
  }
};

export const crearTRM = async (req, res) => {
  try {
    const { valor } = req.body;

    if(!valor) return res.status(400).json({ ok:false, msg:"TRM requerido" });

    const pool = await poolPromise;
    await pool.request()
      .input("valor", sql.Decimal(10,4), valor)
      .query(`INSERT INTO trm(valor) VALUES(@valor)`);

    res.json({ ok:true, msg:"TRM creado" });

  } catch (error) {
    res.status(500).json({ ok:false, msg:"Error creando TRM" });
  }
};
