import { poolPromise, sql } from "../config/db.js";
import { asegurarTablaNotificaciones } from "../utils/notificaciones.service.js";

const obtenerUsuarioId = (req) => Number(req.usuario?.id || 0);

export const listarNotificaciones = async (req, res) => {
  try {
    const usuarioId = obtenerUsuarioId(req);

    if (!usuarioId) {
      return res.status(400).json({ ok: false, mensaje: "Usuario no identificado." });
    }

    const pool = await poolPromise;
    await asegurarTablaNotificaciones(pool);

    const result = await pool
      .request()
      .input("usuario_id", sql.Int, usuarioId)
      .query(`
        SELECT TOP 30
          id,
          tipo,
          titulo,
          mensaje,
          entidad_tipo,
          entidad_id,
          url,
          leida,
          fecha_creacion,
          fecha_lectura
        FROM notificaciones
        WHERE usuario_id = @usuario_id
          AND archivada = 0
        ORDER BY fecha_creacion DESC
      `);

    const conteo = await pool
      .request()
      .input("usuario_id", sql.Int, usuarioId)
      .query(`
        SELECT COUNT(1) AS no_leidas
        FROM notificaciones
        WHERE usuario_id = @usuario_id
          AND archivada = 0
          AND leida = 0
      `);

    return res.json({
      ok: true,
      no_leidas: conteo.recordset[0]?.no_leidas || 0,
      notificaciones: result.recordset,
    });
  } catch (error) {
    console.error("Error listando notificaciones:", error);
    return res.status(500).json({ ok: false, mensaje: "Error consultando notificaciones." });
  }
};

export const marcarNotificacionLeida = async (req, res) => {
  try {
    const usuarioId = obtenerUsuarioId(req);
    const id = Number(req.params.id);

    if (!usuarioId || !id) {
      return res.status(400).json({ ok: false, mensaje: "Notificacion no valida." });
    }

    const pool = await poolPromise;
    await asegurarTablaNotificaciones(pool);

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("usuario_id", sql.Int, usuarioId)
      .query(`
        UPDATE notificaciones
        SET leida = 1,
            fecha_lectura = COALESCE(fecha_lectura, SYSUTCDATETIME())
        WHERE id = @id
          AND usuario_id = @usuario_id
      `);

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error marcando notificacion:", error);
    return res.status(500).json({ ok: false, mensaje: "Error actualizando notificacion." });
  }
};

export const marcarTodasLeidas = async (req, res) => {
  try {
    const usuarioId = obtenerUsuarioId(req);

    if (!usuarioId) {
      return res.status(400).json({ ok: false, mensaje: "Usuario no identificado." });
    }

    const pool = await poolPromise;
    await asegurarTablaNotificaciones(pool);

    await pool
      .request()
      .input("usuario_id", sql.Int, usuarioId)
      .query(`
        UPDATE notificaciones
        SET leida = 1,
            fecha_lectura = COALESCE(fecha_lectura, SYSUTCDATETIME())
        WHERE usuario_id = @usuario_id
          AND archivada = 0
          AND leida = 0
      `);

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error marcando todas las notificaciones:", error);
    return res.status(500).json({ ok: false, mensaje: "Error actualizando notificaciones." });
  }
};

export const archivarNotificacion = async (req, res) => {
  try {
    const usuarioId = obtenerUsuarioId(req);
    const id = Number(req.params.id);

    if (!usuarioId || !id) {
      return res.status(400).json({ ok: false, mensaje: "Notificacion no valida." });
    }

    const pool = await poolPromise;
    await asegurarTablaNotificaciones(pool);

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("usuario_id", sql.Int, usuarioId)
      .query(`
        UPDATE notificaciones
        SET archivada = 1,
            leida = 1,
            fecha_lectura = COALESCE(fecha_lectura, SYSUTCDATETIME())
        WHERE id = @id
          AND usuario_id = @usuario_id
      `);

    return res.json({ ok: true });
  } catch (error) {
    console.error("Error archivando notificacion:", error);
    return res.status(500).json({ ok: false, mensaje: "Error archivando notificacion." });
  }
};
