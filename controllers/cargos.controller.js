import { poolPromise, sql } from "../config/db.js";

/* ======================================================
   🔹 1. OBTENER CARGOS DE UNA SOLICITUD
====================================================== */
export const obtenerCargosPorSolicitud = async (req, res) => {
  try {
    const { solicitud_id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("solicitud_id", sql.Int, solicitud_id)
      .query(`
        SELECT 
          id, solicitud_id, tipo_cargo, valor_usd, valor_cop, creado_en
        FROM cargos_adicionales
        WHERE solicitud_id = @solicitud_id
        ORDER BY creado_en ASC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener cargos:", error);
    res.status(500).json({ mensaje: "Error interno al obtener cargos" });
  }
};

/* ======================================================
   🔹 2. CREAR CARGO ADICIONAL
====================================================== */
export const crearCargoAdicional = async (req, res) => {
  try {
    const { solicitud_id, tipo_cargo, valor_usd, valor_cop } = req.body;

    if (!solicitud_id || !tipo_cargo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos incompletos para crear el cargo."
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("solicitud_id", sql.Int, solicitud_id)
      .input("tipo_cargo", sql.VarChar(100), tipo_cargo)
      .input("valor_usd", sql.Decimal(10,2), valor_usd || 0)
      .input("valor_cop", sql.Decimal(18,2), valor_cop || 0)
      .query(`
        INSERT INTO cargos_adicionales (solicitud_id, tipo_cargo, valor_usd, valor_cop)
        OUTPUT INSERTED.*
        VALUES (@solicitud_id, @tipo_cargo, @valor_usd, @valor_cop)
      `);

    res.status(201).json({
      ok: true,
      cargo: result.recordset[0],
      mensaje: "Cargo adicional agregado."
    });

  } catch (error) {
    console.error("❌ Error al crear cargo adicional:", error);
    res.status(500).json({ mensaje: "Error interno al crear cargo" });
  }
};

/* ======================================================
   🔹 3. ELIMINAR CARGO ADICIONAL
====================================================== */
export const eliminarCargoAdicional = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM cargos_adicionales WHERE id = @id`);

    res.json({ ok: true, mensaje: "Cargo eliminado correctamente." });

  } catch (error) {
    console.error("❌ Error al eliminar cargo:", error);
    res.status(500).json({ mensaje: "Error interno al eliminar cargo" });
  }
};
