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
    const clienteId = req.usuario?.tipo === "cliente"
      ? req.usuario.id
      : req.query.cliente_id;

    if (!clienteId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Cliente requerido para consultar prealertas",
      });
    }

    if (!puedeConsultarCliente(req, clienteId)) {
      return res.status(403).json({
        ok: false,
        mensaje: "No puedes consultar prealertas de otro cliente",
      });
    }

    const pool = await poolPromise;
    await asegurarTablaPrealertas(pool);

    const result = await pool.request()
      .input("cliente_id", sql.Int, clienteId)
      .query(`
        SELECT
          id,
          cliente_id,
          tracking,
          peso_lbs,
          contenido,
          valor_declarado,
          valor_asegurado,
          observaciones,
          estado,
          fecha_creacion
        FROM prealertas
        WHERE cliente_id = @cliente_id
        ORDER BY fecha_creacion DESC
      `);

    return res.json({ ok: true, prealertas: result.recordset });
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
        VALUES (
          @cliente_id,
          @tracking,
          @peso_lbs,
          @contenido,
          @valor_declarado,
          @valor_asegurado,
          @observaciones
        )
      `);

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
