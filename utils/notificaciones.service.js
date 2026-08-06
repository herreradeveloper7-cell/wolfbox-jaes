import { poolPromise, sql } from "../config/db.js";

export const crearNotificacionUsuarios = async ({
  tipo = "info",
  titulo,
  mensaje,
  entidadTipo = null,
  entidadId = null,
  url = null,
}) => {
  if (!titulo || !mensaje) return;

  const pool = await poolPromise;

  const usuarios = await pool.request().query(`
    SELECT id
    FROM usuarios
    WHERE tipo_usuario IN ('admin', 'usuario')
      AND LOWER(ISNULL(estado, 'activo')) = 'activo'
  `);

  for (const usuario of usuarios.recordset) {
    await pool
      .request()
      .input("usuario_id", sql.Int, usuario.id)
      .input("tipo", sql.NVarChar(60), tipo)
      .input("titulo", sql.NVarChar(180), titulo)
      .input("mensaje", sql.NVarChar(600), mensaje)
      .input("entidad_tipo", sql.NVarChar(80), entidadTipo)
      .input("entidad_id", sql.Int, entidadId)
      .input("url", sql.NVarChar(250), url)
      .query(`
        INSERT INTO notificaciones (
          usuario_id,
          tipo,
          titulo,
          mensaje,
          entidad_tipo,
          entidad_id,
          url
        )
        VALUES (
          @usuario_id,
          @tipo,
          @titulo,
          @mensaje,
          @entidad_tipo,
          @entidad_id,
          @url
        )
      `);
  }
};
