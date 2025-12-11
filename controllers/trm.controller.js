import { poolPromise, sql } from "../config/db.js";

export const listarTRM = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM trm ORDER BY fecha DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.log("error listarTRM:", err);
    res.status(500).json({ ok:false, msg:"Error listando TRM" });
  }
};

export const crearTRM = async (req, res) => {
  try {
    let { fecha, valor } = req.body;

    if (!valor) {
      return res.status(400).json({ ok:false, msg:"Valor TRM requerido" });
    }

    if (!fecha) fecha = new Date(); 

    const pool = await poolPromise;
    await pool.request()
      .input("fecha", sql.Date, fecha)
      .input("valor", sql.Decimal(18,4), valor)
      .query(`
        INSERT INTO trm (fecha, valor)
        VALUES (@fecha, @valor)
      `);

    res.json({ ok:true, msg:"TRM creado exitosamente" });
  } catch (err) {
    console.log("error crearTRM:", err);
    res.status(500).json({ ok:false, msg:"Error creando TRM" });
  }
};


export const editarTRM = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, valor } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("fecha", sql.Date, fecha)
      .input("valor", sql.Decimal(18,4), valor)
      .query(`
        UPDATE trm
        SET fecha=@fecha, valor=@valor
        WHERE id=@id
      `);

    res.json({ ok:true, msg:"TRM actualizado correctamente" });
  } catch (err) {
    console.log("error editarTRM:", err);
    res.status(500).json({ ok:false, msg:"Error editando TRM" });
  }
};

export const eliminarTRM = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM trm WHERE id=@id");

    return res.json({ ok: true, mensaje: "TRM eliminado correctamente" });

  } catch (error) {
    console.log("❌ Error eliminando TRM:", error);
    return res.status(500).json({ ok: false, mensaje: "Error eliminando TRM" });
  }
};


export const obtenerTRMActual = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT TOP 1 *
      FROM trm
      ORDER BY fecha DESC
    `);

    res.json(result.recordset[0] || null);
  } catch (err) {
    res.status(500).json({ ok:false, msg:"Error obteniendo TRM actual" });
  }
};


