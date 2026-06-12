import { poolPromise, sql } from "../config/db.js";

const asegurarTablaPrealertas = async (pool) => {
  await pool.request().query(`
    IF OBJECT_ID('dbo.prealertas', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.prealertas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        cliente_id INT NOT NULL,
        tracking NVARCHAR(100) NOT NULL,
        peso_lbs DECIMAL(10,2) NOT NULL,
        contenido NVARCHAR(255) NOT NULL,
        valor_declarado DECIMAL(12,2) NOT NULL,
        valor_asegurado DECIMAL(12,2) NOT NULL,
        observaciones NVARCHAR(500) NULL,
        estado NVARCHAR(50) NOT NULL CONSTRAINT DF_prealertas_estado DEFAULT 'Prealertado',
        fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_prealertas_fecha DEFAULT SYSUTCDATETIME()
      );

      CREATE INDEX IX_prealertas_cliente_fecha
        ON dbo.prealertas (cliente_id, fecha_creacion DESC);
    END
  `);
};

const puedeConsultarCliente = (req, clienteId) =>
  ["admin", "usuario"].includes(req.usuario?.tipo) ||
  Number(req.usuario?.id) === Number(clienteId);

export const listarPrealertas = async (req, res) => {
  try {
    const esCliente = req.usuario?.tipo === "cliente";
    const clienteId = esCliente ? req.usuario.id : req.query.cliente_id;
    const pagina = Math.max(Number(req.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(Number(req.query.limite) || (esCliente ? 1000 : 10), 1), 100);
    const offset = (pagina - 1) * limite;

    const pool = await poolPromise;
    await asegurarTablaPrealertas(pool);

    const request = pool.request()
      .input("offset", sql.Int, offset)
      .input("limite", sql.Int, limite);
    const filtros = [];

    if (clienteId) {
      filtros.push("p.cliente_id = @cliente_id");
      request.input("cliente_id", sql.Int, clienteId);
    }

    if (!esCliente && req.query.tracking) {
      filtros.push("p.tracking LIKE @tracking");
      request.input("tracking", sql.NVarChar(120), `%${req.query.tracking}%`);
    }

    if (!esCliente && req.query.contenido) {
      filtros.push("p.contenido LIKE @contenido");
      request.input("contenido", sql.NVarChar(275), `%${req.query.contenido}%`);
    }

    if (!esCliente && req.query.cliente) {
      filtros.push(`(
        c.codigo_referencia LIKE @cliente
        OR c.nombre_empresa LIKE @cliente
        OR c.primer_nombre LIKE @cliente
        OR c.segundo_nombre LIKE @cliente
        OR c.primer_apellido LIKE @cliente
        OR c.segundo_apellido LIKE @cliente
      )`);
      request.input("cliente", sql.NVarChar(170), `%${req.query.cliente}%`);
    }

    if (!esCliente && req.query.fecha_desde) {
      filtros.push("CONVERT(date, p.fecha_creacion) >= @fecha_desde");
      request.input("fecha_desde", sql.Date, req.query.fecha_desde);
    }

    if (!esCliente && req.query.fecha_hasta) {
      filtros.push("CONVERT(date, p.fecha_creacion) <= @fecha_hasta");
      request.input("fecha_hasta", sql.Date, req.query.fecha_hasta);
    }

    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
    const result = await request.query(`
        SELECT COUNT_BIG(1) AS total
        FROM prealertas p
        INNER JOIN clientes c ON c.id = p.cliente_id
        ${where};

        SELECT
          p.id,
          p.cliente_id,
          p.tracking,
          p.peso_lbs,
          p.contenido,
          p.valor_declarado,
          p.valor_asegurado,
          p.observaciones,
          p.estado,
          p.fecha_creacion,
          c.codigo_referencia,
          ISNULL(
            NULLIF(LTRIM(RTRIM(CONCAT(
              ISNULL(c.primer_nombre, ''), ' ',
              ISNULL(c.segundo_nombre, ''), ' ',
              ISNULL(c.primer_apellido, ''), ' ',
              ISNULL(c.segundo_apellido, '')
            ))), ''),
            c.nombre_empresa
          ) AS cliente_nombre
        FROM prealertas p
        INNER JOIN clientes c ON c.id = p.cliente_id
        ${where}
        ORDER BY p.fecha_creacion DESC, p.id DESC
        OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
      `);

    const total = Number(result.recordsets[0]?.[0]?.total || 0);

    return res.json({
      ok: true,
      prealertas: result.recordsets[1] || [],
      paginacion: {
        pagina,
        limite,
        total,
        total_paginas: Math.max(Math.ceil(total / limite), 1),
      },
    });
  } catch (error) {
    console.error("Error listando prealertas:", error);
    return res.status(500).json({ ok: false, mensaje: "Error listando prealertas" });
  }
};

export const crearPrealerta = async (req, res) => {
  try {
    const clienteId = req.usuario?.tipo === "cliente"
      ? req.usuario.id
      : req.body.cliente_id;

    if (!clienteId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Cliente requerido para crear prealerta",
      });
    }

    if (!puedeConsultarCliente(req, clienteId)) {
      return res.status(403).json({
        ok: false,
        mensaje: "No puedes crear prealertas para otro cliente",
      });
    }

    const {
      tracking,
      peso_lbs,
      contenido,
      valor_declarado,
      valor_asegurado,
      observaciones,
    } = req.body;

    const pool = await poolPromise;
    await asegurarTablaPrealertas(pool);

    const result = await pool.request()
      .input("cliente_id", sql.Int, clienteId)
      .input("tracking", sql.NVarChar(100), tracking)
      .input("peso_lbs", sql.Decimal(10, 2), peso_lbs)
      .input("contenido", sql.NVarChar(255), contenido)
      .input("valor_declarado", sql.Decimal(12, 2), valor_declarado)
      .input("valor_asegurado", sql.Decimal(12, 2), valor_asegurado)
      .input("observaciones", sql.NVarChar(500), observaciones || null)
      .query(`
        INSERT INTO prealertas (
          cliente_id,
          tracking,
          peso_lbs,
          contenido,
          valor_declarado,
          valor_asegurado,
          observaciones
        )
        OUTPUT INSERTED.*
        SELECT
          @cliente_id,
          @tracking,
          @peso_lbs,
          @contenido,
          @valor_declarado,
          @valor_asegurado,
          @observaciones
        FROM clientes
        WHERE id = @cliente_id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({
        ok: false,
        mensaje: "El cliente seleccionado no existe",
      });
    }

    return res.status(201).json({
      ok: true,
      mensaje: "Prealerta creada correctamente",
      prealerta: result.recordset[0],
    });
  } catch (error) {
    console.error("Error creando prealerta:", error);
    return res.status(500).json({ ok: false, mensaje: "Error creando prealerta" });
  }
};
