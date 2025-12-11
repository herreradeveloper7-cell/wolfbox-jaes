import { poolPromise, sql } from "../config/db.js";

/* ============================================================
   1. LISTAR SERVICIOS
============================================================ */
export const obtenerServicios = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        id,
        codigo,
        nombre,
        tipo,
        descripcion,
        tarifa_fija_1lb,
        tarifa_fija_2a5,
        tarifa_fija_6a10,
        tarifa_por_libra_extra,
        tarifa_por_libra_cc,
        porcentaje_seguro
      FROM servicios
      ORDER BY nombre
    `);

    res.json({ ok: true, servicios: result.recordset });
  } catch (err) {
    console.error("❌ Error obteniendo servicios:", err);
    res.status(500).json({ ok: false, mensaje: "Error al obtener servicios" });
  }
};


/* ============================================================
   2. CREAR SERVICIO
============================================================ */
export const crearServicio = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      tipo,
      descripcion,
      tarifa_fija_1lb,
      tarifa_fija_2a5,
      tarifa_fija_6a10,
      tarifa_por_libra_extra,
      tarifa_por_libra_cc,
      porcentaje_seguro
    } = req.body;

    if (!codigo || !nombre || !tipo) {
      return res.status(400).json({
        ok: false,
        mensaje: "Código, nombre y tipo son obligatorios."
      });
    }

    const pool = await poolPromise;

    await pool.request()
      .input("codigo", sql.VarChar, codigo)
      .input("nombre", sql.VarChar, nombre)
      .input("tipo", sql.VarChar, tipo)
      .input("descripcion", sql.VarChar, descripcion || "")
      .input("tarifa_fija_1lb", sql.Decimal(10,2), tarifa_fija_1lb || 0)
      .input("tarifa_fija_2a5", sql.Decimal(10,2), tarifa_fija_2a5 || 0)
      .input("tarifa_fija_6a10", sql.Decimal(10,2), tarifa_fija_6a10 || 0)
      .input("tarifa_por_libra_extra", sql.Decimal(10,2), tarifa_por_libra_extra || 0)
      .input("tarifa_por_libra_cc", sql.Decimal(10,2), tarifa_por_libra_cc || 0)
      .input("porcentaje_seguro", sql.Decimal(5,2), porcentaje_seguro || 0)
      .query(`
        INSERT INTO servicios (
          codigo, nombre, tipo, descripcion,
          tarifa_fija_1lb, tarifa_fija_2a5, tarifa_fija_6a10,
          tarifa_por_libra_extra, tarifa_por_libra_cc, porcentaje_seguro
        )
        VALUES (
          @codigo, @nombre, @tipo, @descripcion,
          @tarifa_fija_1lb, @tarifa_fija_2a5, @tarifa_fija_6a10,
          @tarifa_por_libra_extra, @tarifa_por_libra_cc, @porcentaje_seguro
        )
      `);

    res.json({
      ok: true,
      mensaje: "Servicio creado correctamente."
    });

  } catch (err) {
    console.error("❌ Error creando servicio:", err);
    res.status(500).json({ ok: false, mensaje: "Error al crear servicio" });
  }
};


/* ============================================================
   3. ACTUALIZAR SERVICIO
============================================================ */
export const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      codigo,
      nombre,
      tipo,
      descripcion,
      tarifa_fija_1lb,
      tarifa_fija_2a5,
      tarifa_fija_6a10,
      tarifa_por_libra_extra,
      tarifa_por_libra_cc,
      porcentaje_seguro
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.Int, id)
      .input("codigo", sql.VarChar, codigo)
      .input("nombre", sql.VarChar, nombre)
      .input("tipo", sql.VarChar, tipo)
      .input("descripcion", sql.VarChar, descripcion || "")
      .input("tarifa_fija_1lb", sql.Decimal(10,2), tarifa_fija_1lb || 0)
      .input("tarifa_fija_2a5", sql.Decimal(10,2), tarifa_fija_2a5 || 0)
      .input("tarifa_fija_6a10", sql.Decimal(10,2), tarifa_fija_6a10 || 0)
      .input("tarifa_por_libra_extra", sql.Decimal(10,2), tarifa_por_libra_extra || 0)
      .input("tarifa_por_libra_cc", sql.Decimal(10,2), tarifa_por_libra_cc || 0)
      .input("porcentaje_seguro", sql.Decimal(5,2), porcentaje_seguro || 0)
      .query(`
        UPDATE servicios
        SET
          codigo = @codigo,
          nombre = @nombre,
          tipo = @tipo,
          descripcion = @descripcion,
          tarifa_fija_1lb = @tarifa_fija_1lb,
          tarifa_fija_2a5 = @tarifa_fija_2a5,
          tarifa_fija_6a10 = @tarifa_fija_6a10,
          tarifa_por_libra_extra = @tarifa_por_libra_extra,
          tarifa_por_libra_cc = @tarifa_por_libra_cc,
          porcentaje_seguro = @porcentaje_seguro
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Servicio actualizado correctamente." });

  } catch (err) {
    console.error("❌ Error actualizando servicio:", err);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar servicio" });
  }
};


/* ============================================================
   4. ELIMINAR SERVICIO
============================================================ */
export const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    // Verificar si está siendo usado por algún paquete
    const usados = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT TOP 1 id FROM paquetes WHERE servicio_id = @id`);

    if (usados.recordset.length > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este servicio no se puede eliminar porque ya tiene paquetes asociados."
      });
    }

    await pool.request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM servicios WHERE id = @id`);

    res.json({ ok: true, mensaje: "Servicio eliminado correctamente." });

  } catch (err) {
    console.error("❌ Error eliminando servicio:", err);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar servicio" });
  }
};

/* ============================================================
   5. OBTENER SERVICIO POR ID (Necesario para Solicitar Despachos)
============================================================ */
/* ============================================================
   OBTENER SERVICIO POR ID
============================================================ */
export const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          id,
          codigo,
          nombre,
          tipo,
          descripcion,
          tarifa_fija_1lb,
          tarifa_fija_2a5,
          tarifa_fija_6a10,
          tarifa_por_libra_extra,
          tarifa_por_libra_cc,
          porcentaje_seguro
        FROM servicios
        WHERE id = @id
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ ok: false, mensaje: "Servicio no encontrado" });
    }

    return res.json({ ok: true, servicio: result.recordset[0] });

  } catch (error) {
    console.error("❌ Error obteniendo servicio por ID:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener servicio" });
  }
};
