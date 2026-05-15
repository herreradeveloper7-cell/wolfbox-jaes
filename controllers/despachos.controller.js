import { poolPromise, sql } from "../config/db.js";

const ESTADOS_DESPACHO = {
  ABIERTO: "abierto",
  CERRADO: "cerrado",
};

const normalizarEstadoDespacho = (estado) =>
  String(estado || "").trim().toLowerCase();

const getResponsable = (req) =>
  req.body?.responsable ||
  req.usuario?.nombre ||
  req.usuario?.email ||
  req.usuario?.id ||
  "Sistema";

const ensureDespachosSchema = async (pool) => {
  await pool.request().query(`
    IF OBJECT_ID('dbo.despachos', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.despachos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        codigo NVARCHAR(40) NOT NULL,
        nombre NVARCHAR(120) NULL,
        observaciones NVARCHAR(500) NULL,
        estado NVARCHAR(20) NOT NULL CONSTRAINT DF_despachos_estado DEFAULT 'abierto',
        creado_por NVARCHAR(120) NULL,
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_despachos_fecha DEFAULT SYSUTCDATETIME(),
        fecha_cierre DATETIME2 NULL,
        actualizado_en DATETIME2 NULL
      );
    END

    IF OBJECT_ID('dbo.despacho_paquetes', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.despacho_paquetes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        despacho_id INT NOT NULL,
        paquete_id INT NOT NULL,
        hawb NVARCHAR(50) NOT NULL,
        agregado_por NVARCHAR(120) NULL,
        fecha_agregado DATETIME2 NOT NULL CONSTRAINT DF_despacho_paquetes_fecha DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_despacho_paquetes_despachos
          FOREIGN KEY (despacho_id) REFERENCES dbo.despachos(id) ON DELETE CASCADE
      );
    END

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = 'UX_despacho_paquetes_hawb'
        AND object_id = OBJECT_ID('dbo.despacho_paquetes')
    )
    BEGIN
      CREATE UNIQUE INDEX UX_despacho_paquetes_hawb
      ON dbo.despacho_paquetes(hawb);
    END
  `);
};

const obtenerDespachoAbierto = async (request, id) => {
  const despacho = await request()
    .input("id", sql.Int, id)
    .query(`
      SELECT id, codigo, nombre, observaciones, estado
      FROM despachos
      WHERE id = @id
    `);

  if (!despacho.recordset.length) {
    return {
      ok: false,
      status: 404,
      mensaje: "Despacho no encontrado.",
    };
  }

  const data = despacho.recordset[0];

  if (normalizarEstadoDespacho(data.estado) === ESTADOS_DESPACHO.CERRADO) {
    return {
      ok: false,
      status: 400,
      mensaje: "El despacho esta cerrado. No permite modificaciones.",
    };
  }

  return { ok: true, despacho: data };
};

const registrarEstadoOperativo = async ({
  request,
  hawb,
  estadoNombre,
  observaciones,
  responsable,
}) => {
  const estado = await request()
    .input("estado", sql.NVarChar, estadoNombre)
    .query(`
      SELECT TOP 1 id
      FROM estados_catalogo
      WHERE LOWER(nombre) = LOWER(@estado)
    `);

  if (!estado.recordset.length) {
    return;
  }

  const estadoId = estado.recordset[0].id;

  await request()
    .input("hawb", sql.NVarChar, hawb)
    .input("estado_id", sql.Int, estadoId)
    .input("observaciones", sql.NVarChar, observaciones)
    .input("responsable", sql.NVarChar, responsable)
    .query(`
      INSERT INTO historial_estados
        (hawb, estado_id, observaciones, responsable)
      VALUES
        (@hawb, @estado_id, @observaciones, @responsable)
    `);

  await request()
    .input("hawb", sql.NVarChar, hawb)
    .input("estado_id", sql.Int, estadoId)
    .query(`
      UPDATE paquetes
      SET estado_id = @estado_id
      WHERE hawb = @hawb
    `);
};

export const listarDespachos = async (req, res) => {
  try {
    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    const result = await pool.request().query(`
      SELECT
        d.id,
        d.codigo,
        d.nombre,
        d.observaciones,
        d.estado,
        d.creado_por,
        CONVERT(varchar, d.fecha_creacion, 120) AS fecha_creacion,
        CONVERT(varchar, d.fecha_cierre, 120) AS fecha_cierre,
        COUNT(dp.id) AS cantidad_hawbs,
        ISNULL(SUM(CAST(p.peso AS DECIMAL(10,2))), 0) AS peso_total
      FROM despachos d
      LEFT JOIN despacho_paquetes dp ON dp.despacho_id = d.id
      LEFT JOIN paquetes p ON p.id = dp.paquete_id
      GROUP BY
        d.id, d.codigo, d.nombre, d.observaciones, d.estado, d.creado_por,
        d.fecha_creacion, d.fecha_cierre
      ORDER BY d.fecha_creacion DESC
    `);

    res.json({ ok: true, despachos: result.recordset });
  } catch (error) {
    console.error("Error listando despachos:", error);
    res.status(500).json({ ok: false, mensaje: "Error listando despachos." });
  }
};

export const crearDespacho = async (req, res) => {
  try {
    const { nombre, observaciones } = req.body;
    const responsable = getResponsable(req);
    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    const codigo = `DESP-${Date.now()}`;

    const result = await pool
      .request()
      .input("codigo", sql.NVarChar, codigo)
      .input("nombre", sql.NVarChar, nombre || codigo)
      .input("observaciones", sql.NVarChar, observaciones || null)
      .input("creado_por", sql.NVarChar, responsable)
      .query(`
        INSERT INTO despachos (codigo, nombre, observaciones, creado_por)
        OUTPUT INSERTED.id, INSERTED.codigo, INSERTED.nombre, INSERTED.estado
        VALUES (@codigo, @nombre, @observaciones, @creado_por)
      `);

    res.status(201).json({
      ok: true,
      mensaje: "Despacho creado correctamente.",
      despacho: result.recordset[0],
    });
  } catch (error) {
    console.error("Error creando despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error creando despacho." });
  }
};

export const obtenerDetalleDespacho = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    const despacho = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          id,
          codigo,
          nombre,
          observaciones,
          estado,
          creado_por,
          CONVERT(varchar, fecha_creacion, 120) AS fecha_creacion,
          CONVERT(varchar, fecha_cierre, 120) AS fecha_cierre
        FROM despachos
        WHERE id = @id
      `);

    if (!despacho.recordset.length) {
      return res.status(404).json({ ok: false, mensaje: "Despacho no encontrado." });
    }

    const paquetes = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          dp.id AS despacho_paquete_id,
          dp.hawb,
          CONVERT(varchar, dp.fecha_agregado, 120) AS fecha_agregado,
          dp.agregado_por,
          p.id AS paquete_id,
          p.tracking,
          p.contenido,
          p.tienda,
          p.peso,
          p.solicitud_id,
          p.hawb_padre,
          ec.nombre AS estado_actual,
          c.codigo_referencia,
          CASE
            WHEN LOWER(ISNULL(c.tipo_cliente, '')) = 'personal' THEN
              RTRIM(
                ISNULL(c.primer_nombre, '') + ' ' +
                ISNULL(c.segundo_nombre + ' ', '') +
                ISNULL(c.primer_apellido, '') + ' ' +
                ISNULL(c.segundo_apellido, '')
              )
            ELSE ISNULL(c.nombre_empresa, 'Sin nombre')
          END AS cliente
        FROM despacho_paquetes dp
        INNER JOIN paquetes p ON p.id = dp.paquete_id
        LEFT JOIN estados_catalogo ec ON ec.id = p.estado_id
        LEFT JOIN clientes c ON c.id = p.cliente_id
        WHERE dp.despacho_id = @id
        ORDER BY dp.fecha_agregado DESC
      `);

    res.json({
      ok: true,
      despacho: despacho.recordset[0],
      paquetes: paquetes.recordset,
    });
  } catch (error) {
    console.error("Error consultando despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error consultando despacho." });
  }
};

export const editarDespacho = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const { nombre, observaciones } = req.body;
    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const validacion = await obtenerDespachoAbierto(request, id);
    if (!validacion.ok) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(validacion.status).json({ ok: false, mensaje: validacion.mensaje });
    }

    await request()
      .input("id", sql.Int, id)
      .input("nombre", sql.NVarChar, nombre || null)
      .input("observaciones", sql.NVarChar, observaciones || null)
      .query(`
        UPDATE despachos
        SET nombre = @nombre,
            observaciones = @observaciones,
            actualizado_en = SYSUTCDATETIME()
        WHERE id = @id
      `);

    await transaction.commit();
    transactionStarted = false;

    res.json({ ok: true, mensaje: "Despacho actualizado correctamente." });
  } catch (error) {
    if (transactionStarted) await transaction.rollback();
    console.error("Error editando despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error editando despacho." });
  }
};

export const cambiarEstadoDespacho = async (req, res) => {
  try {
    const { id } = req.params;
    const estado = normalizarEstadoDespacho(req.body.estado);

    if (!Object.values(ESTADOS_DESPACHO).includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: "Estado de despacho invalido." });
    }

    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("estado", sql.NVarChar, estado)
      .query(`
        UPDATE despachos
        SET estado = @estado,
            fecha_cierre = CASE WHEN @estado = 'cerrado' THEN SYSUTCDATETIME() ELSE NULL END,
            actualizado_en = SYSUTCDATETIME()
        OUTPUT INSERTED.id, INSERTED.codigo, INSERTED.estado
        WHERE id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ ok: false, mensaje: "Despacho no encontrado." });
    }

    res.json({
      ok: true,
      mensaje: estado === ESTADOS_DESPACHO.CERRADO
        ? "Despacho cerrado correctamente."
        : "Despacho abierto correctamente.",
      despacho: result.recordset[0],
    });
  } catch (error) {
    console.error("Error cambiando estado de despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error cambiando estado de despacho." });
  }
};

export const eliminarDespacho = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const validacion = await obtenerDespachoAbierto(request, id);
    if (!validacion.ok) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(validacion.status).json({ ok: false, mensaje: validacion.mensaje });
    }

    await request()
      .input("id", sql.Int, id)
      .query("DELETE FROM despachos WHERE id = @id");

    await transaction.commit();
    transactionStarted = false;

    res.json({ ok: true, mensaje: "Despacho eliminado correctamente." });
  } catch (error) {
    if (transactionStarted) await transaction.rollback();
    console.error("Error eliminando despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error eliminando despacho." });
  }
};

export const agregarHawbADespacho = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const { id } = req.params;
    const hawb = String(req.body.hawb || "").trim();
    const responsable = getResponsable(req);

    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const validacion = await obtenerDespachoAbierto(request, id);
    if (!validacion.ok) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(validacion.status).json({ ok: false, mensaje: validacion.mensaje });
    }

    const paquete = await request()
      .input("hawb", sql.NVarChar, hawb)
      .query(`
        SELECT
          p.id,
          p.hawb,
          p.solicitud_id,
          p.hawb_padre,
          dp.despacho_id AS despacho_existente,
          CASE WHEN EXISTS (
            SELECT 1
            FROM historial_estados h
            INNER JOIN estados_catalogo ec ON ec.id = h.estado_id
            WHERE h.hawb = p.hawb
              AND LOWER(ec.nombre) = 'desbloqueado'
          ) THEN 1 ELSE 0 END AS tiene_desbloqueado
        FROM paquetes p
        LEFT JOIN despacho_paquetes dp ON dp.hawb = p.hawb
        WHERE p.hawb = @hawb
      `);

    if (!paquete.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({ ok: false, mensaje: "HAWB no encontrado." });
    }

    const data = paquete.recordset[0];

    if (data.despacho_existente) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: `El HAWB ${hawb} ya esta agregado a un despacho.`,
      });
    }

    if (data.hawb_padre) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: `El HAWB ${hawb} pertenece a una agrupacion. Agregue el HAWB padre ${data.hawb_padre}.`,
      });
    }

    if (!data.solicitud_id) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: `El HAWB ${hawb} no tiene solicitud de envio creada.`,
      });
    }

    if (!data.tiene_desbloqueado) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: `El HAWB ${hawb} no tiene estado Desbloqueado en su historial.`,
      });
    }

    await request()
      .input("despacho_id", sql.Int, id)
      .input("paquete_id", sql.Int, data.id)
      .input("hawb", sql.NVarChar, data.hawb)
      .input("agregado_por", sql.NVarChar, responsable)
      .query(`
        INSERT INTO despacho_paquetes
          (despacho_id, paquete_id, hawb, agregado_por)
        VALUES
          (@despacho_id, @paquete_id, @hawb, @agregado_por)
      `);

    await registrarEstadoOperativo({
      request,
      hawb: data.hawb,
      estadoNombre: "Planilla de despacho",
      observaciones: `Agregado al despacho ${validacion.despacho.codigo}`,
      responsable,
    });

    await transaction.commit();
    transactionStarted = false;

    res.status(201).json({
      ok: true,
      mensaje: "HAWB agregado al despacho correctamente.",
      hawb: data.hawb,
    });
  } catch (error) {
    if (transactionStarted) await transaction.rollback();

    if (error?.number === 2601 || error?.number === 2627) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este HAWB ya esta agregado a un despacho.",
      });
    }

    console.error("Error agregando HAWB a despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error agregando HAWB a despacho." });
  }
};

export const quitarHawbDeDespacho = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const { id, hawb } = req.params;
    const responsable = getResponsable(req);
    const pool = await poolPromise;
    await ensureDespachosSchema(pool);

    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const validacion = await obtenerDespachoAbierto(request, id);
    if (!validacion.ok) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(validacion.status).json({ ok: false, mensaje: validacion.mensaje });
    }

    const existe = await request()
      .input("despacho_id", sql.Int, id)
      .input("hawb", sql.NVarChar, hawb)
      .query(`
        SELECT id
        FROM despacho_paquetes
        WHERE despacho_id = @despacho_id
          AND hawb = @hawb
      `);

    if (!existe.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({
        ok: false,
        mensaje: "El HAWB no esta asociado a este despacho.",
      });
    }

    await request()
      .input("despacho_id", sql.Int, id)
      .input("hawb", sql.NVarChar, hawb)
      .query(`
        DELETE FROM despacho_paquetes
        WHERE despacho_id = @despacho_id
          AND hawb = @hawb
      `);

    await registrarEstadoOperativo({
      request,
      hawb,
      estadoNombre: "Se retira del despacho",
      observaciones: `Retirado del despacho ${validacion.despacho.codigo}`,
      responsable,
    });

    await transaction.commit();
    transactionStarted = false;

    res.json({ ok: true, mensaje: "HAWB retirado del despacho correctamente." });
  } catch (error) {
    if (transactionStarted) await transaction.rollback();
    console.error("Error retirando HAWB de despacho:", error);
    res.status(500).json({ ok: false, mensaje: "Error retirando HAWB de despacho." });
  }
};
