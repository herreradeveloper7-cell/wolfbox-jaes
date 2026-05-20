import { poolPromise, sql } from "../config/db.js";
import { enviarEmailDesdePlantilla } from "../utils/email.service.js";

let tablaVerificada = false;

const asegurarTablaPlantillas = async (pool) => {
  if (tablaVerificada) return;

  await pool.request().query(`
    IF OBJECT_ID('dbo.plantillas_comunicacion', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.plantillas_comunicacion (
        id INT IDENTITY(1,1) PRIMARY KEY,
        clave_evento NVARCHAR(120) NULL,
        nombre NVARCHAR(150) NOT NULL,
        email_remitente NVARCHAR(180) NOT NULL,
        asunto NVARCHAR(250) NOT NULL,
        cuerpo NVARCHAR(MAX) NOT NULL,
        activo BIT NOT NULL DEFAULT 1,
        creado_por NVARCHAR(150) NULL,
        fecha_creacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        fecha_actualizacion DATETIME2 NULL
      );
    END;

    IF COL_LENGTH('dbo.plantillas_comunicacion', 'clave_evento') IS NULL
      ALTER TABLE dbo.plantillas_comunicacion ADD clave_evento NVARCHAR(120) NULL;
  `);

  tablaVerificada = true;
};

const obtenerResponsable = (req) =>
  req.usuario?.nombre || req.usuario?.email || req.usuario?.id || "Sistema";

const validarPayload = ({ nombre, email_remitente, asunto, cuerpo }) => {
  if (
    !String(nombre || "").trim() ||
    !String(email_remitente || "").trim() ||
    !String(asunto || "").trim() ||
    !String(cuerpo || "").trim()
  ) {
    return "Nombre, email remitente, asunto y cuerpo son requeridos.";
  }

  return null;
};

export const listarPlantillasComunicacion = async (req, res) => {
  try {
    const incluirInactivas = ["1", "true", "si"].includes(
      String(req.query.incluir_inactivas || "").toLowerCase()
    );

    const pool = await poolPromise;
    await asegurarTablaPlantillas(pool);

    const where = incluirInactivas ? "" : "WHERE activo = 1";
    const result = await pool.request().query(`
      SELECT
        id,
        clave_evento,
        nombre,
        email_remitente,
        asunto,
        cuerpo,
        activo,
        creado_por,
        fecha_creacion,
        fecha_actualizacion
      FROM plantillas_comunicacion
      ${where}
      ORDER BY fecha_creacion DESC, id DESC
    `);

    res.json({ ok: true, plantillas: result.recordset });
  } catch (error) {
    console.error("Error listando plantillas de comunicacion:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error listando plantillas de comunicacion.",
    });
  }
};

export const crearPlantillaComunicacion = async (req, res) => {
  try {
    const { clave_evento, nombre, email_remitente, asunto, cuerpo, activo = 1 } = req.body;
    const errorValidacion = validarPayload({ nombre, email_remitente, asunto, cuerpo });

    if (errorValidacion) {
      return res.status(400).json({ ok: false, mensaje: errorValidacion });
    }

    const pool = await poolPromise;
    await asegurarTablaPlantillas(pool);

    await pool
      .request()
      .input("nombre", sql.NVarChar(150), String(nombre).trim())
      .input("clave_evento", sql.NVarChar(120), clave_evento || null)
      .input("email_remitente", sql.NVarChar(180), String(email_remitente).trim())
      .input("asunto", sql.NVarChar(250), String(asunto).trim())
      .input("cuerpo", sql.NVarChar(sql.MAX), String(cuerpo).trim())
      .input("activo", sql.Bit, activo ? 1 : 0)
      .input("creado_por", sql.NVarChar(150), String(obtenerResponsable(req)))
      .query(`
        INSERT INTO plantillas_comunicacion (
          clave_evento, nombre, email_remitente, asunto, cuerpo, activo, creado_por
        )
        VALUES (
          @clave_evento, @nombre, @email_remitente, @asunto, @cuerpo, @activo, @creado_por
        )
      `);

    res.json({ ok: true, mensaje: "Plantilla creada correctamente." });
  } catch (error) {
    console.error("Error creando plantilla de comunicacion:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error creando plantilla de comunicacion.",
    });
  }
};

export const actualizarPlantillaComunicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { clave_evento, nombre, email_remitente, asunto, cuerpo, activo = 1 } = req.body;
    const errorValidacion = validarPayload({ nombre, email_remitente, asunto, cuerpo });

    if (!Number(id) || errorValidacion) {
      return res.status(400).json({
        ok: false,
        mensaje: errorValidacion || "Plantilla no valida.",
      });
    }

    const pool = await poolPromise;
    await asegurarTablaPlantillas(pool);

    await pool
      .request()
      .input("id", sql.Int, Number(id))
      .input("clave_evento", sql.NVarChar(120), clave_evento || null)
      .input("nombre", sql.NVarChar(150), String(nombre).trim())
      .input("email_remitente", sql.NVarChar(180), String(email_remitente).trim())
      .input("asunto", sql.NVarChar(250), String(asunto).trim())
      .input("cuerpo", sql.NVarChar(sql.MAX), String(cuerpo).trim())
      .input("activo", sql.Bit, activo ? 1 : 0)
      .query(`
        UPDATE plantillas_comunicacion
        SET
          nombre = @nombre,
          clave_evento = @clave_evento,
          email_remitente = @email_remitente,
          asunto = @asunto,
          cuerpo = @cuerpo,
          activo = @activo,
          fecha_actualizacion = SYSUTCDATETIME()
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Plantilla actualizada correctamente." });
  } catch (error) {
    console.error("Error actualizando plantilla de comunicacion:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error actualizando plantilla de comunicacion.",
    });
  }
};

export const inhabilitarPlantillaComunicacion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number(id)) {
      return res.status(400).json({ ok: false, mensaje: "Plantilla no valida." });
    }

    const pool = await poolPromise;
    await asegurarTablaPlantillas(pool);

    await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        UPDATE plantillas_comunicacion
        SET activo = 0,
            fecha_actualizacion = SYSUTCDATETIME()
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Plantilla inhabilitada correctamente." });
  } catch (error) {
    console.error("Error inhabilitando plantilla de comunicacion:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error inhabilitando plantilla de comunicacion.",
    });
  }
};

export const enviarPruebaPlantillaComunicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { destinatario, variables = {} } = req.body;

    if (!Number(id) || !String(destinatario || "").trim()) {
      return res.status(400).json({
        ok: false,
        mensaje: "Plantilla y destinatario son requeridos.",
      });
    }

    const pool = await poolPromise;
    await asegurarTablaPlantillas(pool);

    const result = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        SELECT TOP 1
          id,
          clave_evento,
          nombre,
          email_remitente,
          asunto,
          cuerpo,
          activo
        FROM plantillas_comunicacion
        WHERE id = @id
      `);

    const plantilla = result.recordset[0];

    if (!plantilla) {
      return res.status(404).json({
        ok: false,
        mensaje: "Plantilla no encontrada.",
      });
    }

    if (Number(plantilla.activo) !== 1) {
      return res.status(400).json({
        ok: false,
        mensaje: "La plantilla esta inhabilitada.",
      });
    }

    const data = await enviarEmailDesdePlantilla({
      plantilla,
      destinatarios: [{ email: String(destinatario).trim() }],
      variables: {
        cliente_nombre: "Cliente de prueba",
        codigo_casillero: "TEST123",
        tracking: "TRACKING-TEST",
        hawb: "HAWB-TEST",
        fecha: new Date().toLocaleDateString("es-CO"),
        total: "$0",
        solicitud_id: "1080",
        total_cop: "$150.735,90",
        total_usd: "$40.10",
        whatsapp_servicio: "+57 302 8600369",
        banco_titular: "JAES CARGO INTERNACIONAL",
        banco_nombre: "Davivienda",
        banco_cuenta: "1089 0062 3159",
        banco_nit: "901.935.143-6",
        banco_llave: "@9019351436",
        ...variables,
      },
      evento: "prueba_plantilla",
    });

    res.json({
      ok: true,
      mensaje: "Correo de prueba enviado correctamente.",
      proveedor: "brevo",
      data,
    });
  } catch (error) {
    console.error("Error enviando prueba de plantilla:", error);
    res.status(500).json({
      ok: false,
      mensaje: error.message || "Error enviando prueba de plantilla.",
    });
  }
};

export const listarLogsEmail = async (req, res) => {
  try {
    const {
      estado = "",
      evento = "",
      destinatario = "",
      fecha_desde = "",
      fecha_hasta = "",
      limite = 100,
    } = req.query;

    const pool = await poolPromise;
    const request = pool.request();
    const filtros = [];

    if (estado) {
      filtros.push("el.estado = @estado");
      request.input("estado", sql.NVarChar(30), String(estado));
    }

    if (evento) {
      filtros.push("el.evento = @evento");
      request.input("evento", sql.NVarChar(120), String(evento));
    }

    if (destinatario) {
      filtros.push("el.destinatario LIKE @destinatario");
      request.input("destinatario", sql.NVarChar(180), `%${destinatario}%`);
    }

    if (fecha_desde) {
      filtros.push("CAST(el.fecha_envio AS DATE) >= @fecha_desde");
      request.input("fecha_desde", sql.Date, fecha_desde);
    }

    if (fecha_hasta) {
      filtros.push("CAST(el.fecha_envio AS DATE) <= @fecha_hasta");
      request.input("fecha_hasta", sql.Date, fecha_hasta);
    }

    const top = Math.min(Math.max(Number(limite) || 100, 1), 500);
    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const result = await request.query(`
      IF OBJECT_ID('dbo.email_logs', 'U') IS NULL
      BEGIN
        SELECT TOP 0
          CAST(NULL AS INT) AS id,
          CAST(NULL AS INT) AS plantilla_id,
          CAST(NULL AS NVARCHAR(150)) AS plantilla_nombre,
          CAST(NULL AS NVARCHAR(120)) AS evento,
          CAST(NULL AS NVARCHAR(180)) AS destinatario,
          CAST(NULL AS NVARCHAR(250)) AS asunto,
          CAST(NULL AS NVARCHAR(80)) AS proveedor,
          CAST(NULL AS NVARCHAR(30)) AS estado,
          CAST(NULL AS NVARCHAR(180)) AS message_id,
          CAST(NULL AS NVARCHAR(MAX)) AS error,
          CAST(NULL AS DATETIME2) AS fecha_envio;
      END
      ELSE
      BEGIN
        SELECT TOP (${top})
          el.id,
          el.plantilla_id,
          pc.nombre AS plantilla_nombre,
          el.evento,
          el.destinatario,
          el.asunto,
          el.proveedor,
          el.estado,
          el.message_id,
          el.error,
          el.fecha_envio
        FROM email_logs el
        LEFT JOIN plantillas_comunicacion pc ON pc.id = el.plantilla_id
        ${where}
        ORDER BY el.fecha_envio DESC, el.id DESC;
      END
    `);

    res.json({ ok: true, logs: result.recordset });
  } catch (error) {
    console.error("Error listando logs de email:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error listando logs de email.",
    });
  }
};
