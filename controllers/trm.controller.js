import { poolPromise, sql } from "../config/db.js";

export const listarTRM = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM trm ORDER BY fecha DESC
    `);

    res.json(result.recordset);
  } catch (err) {
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
    const creada = await pool.request()
      .input("fecha", sql.Date, fecha)
      .input("valor", sql.Decimal(18,4), valor)
      .query(`
        INSERT INTO trm (fecha, valor)
        OUTPUT INSERTED.id, INSERTED.fecha, INSERTED.valor
        VALUES (@fecha, @valor)
      `);

    res.locals.auditoria = {
      accion: "crear_trm",
      recurso: "trm",
      recursoId: String(creada.recordset[0]?.id || ""),
      despues: creada.recordset[0] || null,
    };

    res.json({ ok:true, msg:"TRM creado exitosamente" });
  } catch (err) {
    res.status(500).json({ ok:false, msg:"Error creando TRM" });
  }
};


export const editarTRM = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, valor } = req.body;

    const pool = await poolPromise;
    const actualizado = await pool.request()
      .input("id", sql.Int, id)
      .input("fecha", sql.Date, fecha)
      .input("valor", sql.Decimal(18,4), valor)
      .query(`
        SELECT id, fecha, valor FROM trm WHERE id = @id;
        UPDATE trm
        SET fecha=@fecha, valor=@valor
        OUTPUT INSERTED.id, INSERTED.fecha, INSERTED.valor
        WHERE id=@id
      `);

    const antes = actualizado.recordsets?.[0]?.[0] || null;
    const despues = actualizado.recordsets?.[1]?.[0] || null;
    res.locals.auditoria = {
      accion: "editar_trm",
      recurso: "trm",
      recursoId: String(id),
      antes,
      despues,
    };

    res.json({ ok:true, msg:"TRM actualizado correctamente" });
  } catch (err) {
    res.status(500).json({ ok:false, msg:"Error editando TRM" });
  }
};

export const eliminarTRM = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const eliminado = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM trm OUTPUT DELETED.id, DELETED.fecha, DELETED.valor WHERE id=@id");

    res.locals.auditoria = {
      accion: "eliminar_trm",
      recurso: "trm",
      recursoId: String(id),
      antes: eliminado.recordset[0] || null,
      despues: null,
    };

    return res.json({ ok: true, mensaje: "TRM eliminado correctamente" });

  } catch (error) {
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


