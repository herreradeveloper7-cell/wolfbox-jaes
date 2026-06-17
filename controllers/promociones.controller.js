import { poolPromise, sql } from "../config/db.js";
import {
  azureStorageDisponible,
  crearUrlTemporalLectura,
  eliminarArchivoPrivado,
  nombreSeguroArchivo,
  subirArchivoPrivado,
} from "../utils/storage.service.js";

let cacheActivas = { expiresAt: 0, data: null };

const invalidarCache = () => {
  cacheActivas = { expiresAt: 0, data: null };
};

const asegurarTabla = async (pool) => {
  await pool.request().query(`
    IF OBJECT_ID('dbo.promociones_tiendas', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.promociones_tiendas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tienda NVARCHAR(120) NOT NULL,
        titulo NVARCHAR(180) NOT NULL,
        descripcion NVARCHAR(600) NOT NULL,
        categoria NVARCHAR(100) NULL,
        evento NVARCHAR(100) NULL,
        url_destino NVARCHAR(1000) NOT NULL,
        imagen_blob NVARCHAR(500) NULL,
        imagen_url NVARCHAR(1000) NULL,
        fecha_inicio DATETIME2 NOT NULL,
        fecha_fin DATETIME2 NOT NULL,
        publicada BIT NOT NULL CONSTRAINT DF_promociones_publicada DEFAULT 0,
        destacada BIT NOT NULL CONSTRAINT DF_promociones_destacada DEFAULT 0,
        orden INT NOT NULL CONSTRAINT DF_promociones_orden DEFAULT 0,
        creado_por INT NULL,
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_promociones_fecha DEFAULT SYSUTCDATETIME(),
        fecha_actualizacion DATETIME2 NOT NULL CONSTRAINT DF_promociones_actualizacion DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_promociones_fechas CHECK (fecha_fin > fecha_inicio)
      );

      CREATE INDEX IX_promociones_vigencia
        ON dbo.promociones_tiendas (publicada, fecha_inicio, fecha_fin, destacada, orden);
    END
  `);
};

const estadoSql = `CASE
  WHEN publicada = 0 THEN 'Borrador'
  WHEN fecha_inicio > SYSUTCDATETIME() THEN 'Programada'
  WHEN fecha_fin < SYSUTCDATETIME() THEN 'Finalizada'
  ELSE 'Activa'
END`;

const agregarUrlsImagen = async (promociones) => Promise.all(promociones.map(async (promocion) => ({
  ...promocion,
  imagen: promocion.imagen_blob
    ? await crearUrlTemporalLectura(promocion.imagen_blob)
    : promocion.imagen_url,
})));

const guardarImagen = async (file) => {
  if (!file) return null;
  const esJpeg = file.buffer.length >= 3
    && file.buffer[0] === 0xff
    && file.buffer[1] === 0xd8
    && file.buffer[2] === 0xff;
  const esWebp = file.buffer.length >= 12
    && file.buffer.toString("ascii", 0, 4) === "RIFF"
    && file.buffer.toString("ascii", 8, 12) === "WEBP";

  if (!esJpeg && !esWebp) {
    const error = new Error("El archivo no es una imagen JPG, JPEG o WEBP válida.");
    error.status = 400;
    throw error;
  }
  if (!azureStorageDisponible()) {
    const error = new Error("Azure Storage debe estar configurado para subir imágenes de promociones.");
    error.status = 503;
    throw error;
  }

  const seguro = nombreSeguroArchivo(file.originalname || "promocion.webp");
  const blobName = `promociones/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${seguro}`;
  await subirArchivoPrivado({ buffer: file.buffer, blobName, contentType: file.mimetype });
  return blobName;
};

export const listarPromocionesAdmin = async (req, res) => {
  try {
    const pagina = Math.max(Number(req.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(Number(req.query.limite) || 10, 1), 100);
    const offset = (pagina - 1) * limite;
    const pool = await poolPromise;
    await asegurarTabla(pool);
    const request = pool.request().input("offset", sql.Int, offset).input("limite", sql.Int, limite);
    const filtros = [];

    if (req.query.busqueda) {
      filtros.push("(tienda LIKE @busqueda OR titulo LIKE @busqueda OR categoria LIKE @busqueda OR evento LIKE @busqueda)");
      request.input("busqueda", sql.NVarChar(220), `%${req.query.busqueda}%`);
    }
    if (req.query.estado && req.query.estado !== "Todos") {
      filtros.push(`${estadoSql} = @estado`);
      request.input("estado", sql.NVarChar(30), req.query.estado);
    }
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
    const result = await request.query(`
      SELECT COUNT_BIG(1) total FROM promociones_tiendas ${where};
      SELECT *, ${estadoSql} AS estado
      FROM promociones_tiendas
      ${where}
      ORDER BY destacada DESC, orden ASC, fecha_inicio DESC, id DESC
      OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY;
    `);
    const total = Number(result.recordsets[0]?.[0]?.total || 0);
    const promociones = await agregarUrlsImagen(result.recordsets[1] || []);
    return res.json({ ok: true, promociones, paginacion: { pagina, limite, total, total_paginas: Math.max(Math.ceil(total / limite), 1) } });
  } catch (error) {
    console.error("Error listando promociones:", error);
    return res.status(500).json({ ok: false, mensaje: "Error listando promociones" });
  }
};

export const listarPromocionesActivas = async (_req, res) => {
  try {
    if (cacheActivas.data && cacheActivas.expiresAt > Date.now()) {
      res.set("Cache-Control", "private, max-age=60");
      return res.json(cacheActivas.data);
    }
    const pool = await poolPromise;
    await asegurarTabla(pool);
    const result = await pool.request().query(`
      SELECT TOP 6 id, tienda, titulo, descripcion, categoria, evento, url_destino,
        imagen_blob, imagen_url, fecha_inicio, fecha_fin, destacada
      FROM promociones_tiendas
      WHERE publicada = 1
        AND fecha_inicio <= SYSUTCDATETIME()
        AND fecha_fin >= SYSUTCDATETIME()
      ORDER BY destacada DESC, orden ASC, fecha_inicio DESC, id DESC
    `);
    const data = { ok: true, promociones: await agregarUrlsImagen(result.recordset) };
    cacheActivas = { data, expiresAt: Date.now() + 60_000 };
    res.set("Cache-Control", "private, max-age=60");
    return res.json(data);
  } catch (error) {
    console.error("Error cargando promociones activas:", error);
    return res.status(500).json({ ok: false, mensaje: "Error cargando promociones" });
  }
};

export const crearPromocion = async (req, res) => {
  let imagenBlob = null;
  try {
    imagenBlob = await guardarImagen(req.file);
    const pool = await poolPromise;
    await asegurarTabla(pool);
    const result = await pool.request()
      .input("tienda", sql.NVarChar(120), req.body.tienda)
      .input("titulo", sql.NVarChar(180), req.body.titulo)
      .input("descripcion", sql.NVarChar(600), req.body.descripcion)
      .input("categoria", sql.NVarChar(100), req.body.categoria || null)
      .input("evento", sql.NVarChar(100), req.body.evento || null)
      .input("url_destino", sql.NVarChar(1000), req.body.url_destino)
      .input("imagen_blob", sql.NVarChar(500), imagenBlob)
      .input("imagen_url", sql.NVarChar(1000), null)
      .input("fecha_inicio", sql.DateTime2, new Date(req.body.fecha_inicio))
      .input("fecha_fin", sql.DateTime2, new Date(req.body.fecha_fin))
      .input("publicada", sql.Bit, true)
      .input("destacada", sql.Bit, false)
      .input("orden", sql.Int, Number(req.body.orden) || 0)
      .input("creado_por", sql.Int, req.usuario.id)
      .query(`
        INSERT INTO promociones_tiendas
          (tienda, titulo, descripcion, categoria, evento, url_destino, imagen_blob, imagen_url,
           fecha_inicio, fecha_fin, publicada, destacada, orden, creado_por)
        OUTPUT INSERTED.*
        VALUES
          (@tienda, @titulo, @descripcion, @categoria, @evento, @url_destino, @imagen_blob, @imagen_url,
           @fecha_inicio, @fecha_fin, @publicada, @destacada, @orden, @creado_por)
      `);
    invalidarCache();
    return res.status(201).json({ ok: true, mensaje: "Promoción creada correctamente", promocion: result.recordset[0] });
  } catch (error) {
    if (imagenBlob) await eliminarArchivoPrivado(imagenBlob).catch(() => {});
    console.error("Error creando promoción:", error);
    return res.status(error.status || 500).json({ ok: false, mensaje: error.message || "Error creando promoción" });
  }
};

export const actualizarPromocion = async (req, res) => {
  let nuevoBlob = null;
  try {
    const pool = await poolPromise;
    await asegurarTabla(pool);
    const actual = await pool.request().input("id", sql.Int, req.params.id)
      .query("SELECT TOP 1 imagen_blob, imagen_url FROM promociones_tiendas WHERE id = @id");
    if (!actual.recordset.length) return res.status(404).json({ ok: false, mensaje: "Promoción no encontrada" });

    nuevoBlob = await guardarImagen(req.file);
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("tienda", sql.NVarChar(120), req.body.tienda)
      .input("titulo", sql.NVarChar(180), req.body.titulo)
      .input("descripcion", sql.NVarChar(600), req.body.descripcion)
      .input("categoria", sql.NVarChar(100), req.body.categoria || null)
      .input("evento", sql.NVarChar(100), req.body.evento || null)
      .input("url_destino", sql.NVarChar(1000), req.body.url_destino)
      .input("imagen_blob", sql.NVarChar(500), nuevoBlob || actual.recordset[0].imagen_blob)
      .input("imagen_url", sql.NVarChar(1000), nuevoBlob ? null : actual.recordset[0].imagen_url)
      .input("fecha_inicio", sql.DateTime2, new Date(req.body.fecha_inicio))
      .input("fecha_fin", sql.DateTime2, new Date(req.body.fecha_fin))
      .input("publicada", sql.Bit, true)
      .input("destacada", sql.Bit, false)
      .input("orden", sql.Int, Number(req.body.orden) || 0)
      .query(`UPDATE promociones_tiendas SET tienda=@tienda, titulo=@titulo, descripcion=@descripcion,
        categoria=@categoria, evento=@evento, url_destino=@url_destino, imagen_blob=@imagen_blob,
        imagen_url=@imagen_url, fecha_inicio=@fecha_inicio, fecha_fin=@fecha_fin, publicada=@publicada,
        destacada=@destacada, orden=@orden, fecha_actualizacion=SYSUTCDATETIME() WHERE id=@id`);
    if (nuevoBlob && actual.recordset[0].imagen_blob) await eliminarArchivoPrivado(actual.recordset[0].imagen_blob);
    invalidarCache();
    return res.json({ ok: true, mensaje: "Promoción actualizada correctamente" });
  } catch (error) {
    if (nuevoBlob) await eliminarArchivoPrivado(nuevoBlob).catch(() => {});
    console.error("Error actualizando promoción:", error);
    return res.status(error.status || 500).json({ ok: false, mensaje: error.message || "Error actualizando promoción" });
  }
};

export const eliminarPromocion = async (req, res) => {
  try {
    const pool = await poolPromise;
    await asegurarTabla(pool);
    const result = await pool.request().input("id", sql.Int, req.params.id)
      .query("DELETE FROM promociones_tiendas OUTPUT DELETED.imagen_blob WHERE id = @id");
    if (!result.recordset.length) return res.status(404).json({ ok: false, mensaje: "Promoción no encontrada" });
    await eliminarArchivoPrivado(result.recordset[0].imagen_blob);
    invalidarCache();
    return res.json({ ok: true, mensaje: "Promoción eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminando promoción:", error);
    return res.status(500).json({ ok: false, mensaje: "Error eliminando promoción" });
  }
};
