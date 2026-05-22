import { poolPromise, sql } from "../config/db.js";

let tablaNotificacionesLista = false;

export const asegurarTablaNotificaciones = async (pool) => {
  if (tablaNotificacionesLista) return;

  await pool.request().query(`
    IF OBJECT_ID('dbo.notificaciones', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.notificaciones (
        id INT IDENTITY(1,1) PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo NVARCHAR(60) NOT NULL DEFAULT 'info',
        titulo NVARCHAR(180) NOT NULL,
        mensaje NVARCHAR(600) NOT NULL,
        entidad_tipo NVARCHAR(80) NULL,
        entidad_id INT NULL,
        url NVARCHAR(250) NULL,
        leida BIT NOT NULL DEFAULT 0,
        archivada BIT NOT NULL DEFAULT 0,
        fecha_creacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        fecha_lectura DATETIME2 NULL
      );

      CREATE INDEX IX_notificaciones_usuario_fecha
        ON dbo.notificaciones (usuario_id, archivada, fecha_creacion DESC);
    END;
  `);

  tablaNotificacionesLista = true;
};

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
  await asegurarTablaNotificaciones(pool);

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
