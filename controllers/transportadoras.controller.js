import { poolPromise, sql } from "../config/db.js";

export const listarTransportadoras = async (req, res) => {
  try {
    const oficinaId = Number(req.query.oficina_id || 0);
    const incluirInactivas = ["1", "true", "si"].includes(
      String(req.query.incluir_inactivas || "").toLowerCase()
    );

    const filtros = [];

    const pool = await poolPromise;
    const request = pool.request();

    if (oficinaId) {
      filtros.push("t.oficina_id = @oficina_id");
      request.input("oficina_id", sql.Int, oficinaId);
    }

    if (!incluirInactivas) {
      filtros.push("ISNULL(t.activo, 1) = 1");
    }

    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const result = await request
      .query(`
        SELECT
          t.id,
          t.oficina_id,
          o.nombre AS oficina,
          t.nombre,
          t.nit,
          t.contacto,
          t.telefono,
          t.email,
          ISNULL(t.activo, 1) AS activo
        FROM transportadoras t
        LEFT JOIN oficinas o ON o.id = t.oficina_id
        ${where}
        ORDER BY o.nombre, t.nombre
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

export const crearTransportadora = async (req, res) => {
  try {
    const {
      oficina_id,
      nombre,
      nit,
      contacto,
      telefono,
      email,
      activo = 1,
    } = req.body;

    if (!Number(oficina_id) || !String(nombre || "").trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: "Oficina y nombre son requeridos.",
      });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("oficina_id", sql.Int, Number(oficina_id))
      .input("nombre", sql.NVarChar(150), String(nombre).trim())
      .input("nit", sql.NVarChar(50), nit || null)
      .input("contacto", sql.NVarChar(120), contacto || null)
      .input("telefono", sql.NVarChar(50), telefono || null)
      .input("email", sql.NVarChar(120), email || null)
      .input("activo", sql.Bit, activo ? 1 : 0)
      .query(`
        INSERT INTO transportadoras (
          oficina_id, nombre, nit, contacto, telefono, email, activo
        )
        VALUES (
          @oficina_id, @nombre, @nit, @contacto, @telefono, @email, @activo
        )
      `);

    res.json({ ok: true, mensaje: "Transportadora creada correctamente." });
  } catch (error) {
    console.error("Error creando transportadora:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error creando transportadora.",
    });
  }
};

export const actualizarTransportadora = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      oficina_id,
      nombre,
      nit,
      contacto,
      telefono,
      email,
      activo = 1,
    } = req.body;

    if (!Number(id) || !Number(oficina_id) || !String(nombre || "").trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: "Oficina y nombre son requeridos.",
      });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, Number(id))
      .input("oficina_id", sql.Int, Number(oficina_id))
      .input("nombre", sql.NVarChar(150), String(nombre).trim())
      .input("nit", sql.NVarChar(50), nit || null)
      .input("contacto", sql.NVarChar(120), contacto || null)
      .input("telefono", sql.NVarChar(50), telefono || null)
      .input("email", sql.NVarChar(120), email || null)
      .input("activo", sql.Bit, activo ? 1 : 0)
      .query(`
        UPDATE transportadoras
        SET
          oficina_id = @oficina_id,
          nombre = @nombre,
          nit = @nit,
          contacto = @contacto,
          telefono = @telefono,
          email = @email,
          activo = @activo
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Transportadora actualizada correctamente." });
  } catch (error) {
    console.error("Error actualizando transportadora:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error actualizando transportadora.",
    });
  }
};

export const inhabilitarTransportadora = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Transportadora no valida.",
      });
    }

    const pool = await poolPromise;
    await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        UPDATE transportadoras
        SET activo = 0
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Transportadora inhabilitada correctamente." });
  } catch (error) {
    console.error("Error inhabilitando transportadora:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error inhabilitando transportadora.",
    });
  }
};
