import { poolPromise, sql } from "../config/db.js";

const BREVO_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

let logsTableReady = false;

const asegurarTablaLogs = async (pool) => {
  if (logsTableReady) return;

  await pool.request().query(`
    IF OBJECT_ID('dbo.email_logs', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.email_logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        plantilla_id INT NULL,
        evento NVARCHAR(120) NULL,
        destinatario NVARCHAR(180) NOT NULL,
        asunto NVARCHAR(250) NOT NULL,
        proveedor NVARCHAR(80) NOT NULL DEFAULT 'brevo',
        estado NVARCHAR(30) NOT NULL,
        message_id NVARCHAR(180) NULL,
        error NVARCHAR(MAX) NULL,
        fecha_envio DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;
  `);

  logsTableReady = true;
};

const guardarLogEmail = async ({
  plantillaId = null,
  evento = null,
  destinatario,
  asunto,
  proveedor = "brevo",
  estado,
  messageId = null,
  error = null,
}) => {
  try {
    const pool = await poolPromise;
    await asegurarTablaLogs(pool);

    await pool
      .request()
      .input("plantilla_id", sql.Int, plantillaId)
      .input("evento", sql.NVarChar(120), evento)
      .input("destinatario", sql.NVarChar(180), destinatario)
      .input("asunto", sql.NVarChar(250), asunto)
      .input("proveedor", sql.NVarChar(80), proveedor)
      .input("estado", sql.NVarChar(30), estado)
      .input("message_id", sql.NVarChar(180), messageId)
      .input("error", sql.NVarChar(sql.MAX), error)
      .query(`
        INSERT INTO email_logs (
          plantilla_id, evento, destinatario, asunto, proveedor, estado,
          message_id, error
        )
        VALUES (
          @plantilla_id, @evento, @destinatario, @asunto, @proveedor, @estado,
          @message_id, @error
        )
      `);
  } catch (logError) {
    console.error("Error guardando log de email:", logError);
  }
};

export const renderizarTexto = (texto = "", variables = {}) => {
  return String(texto).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, key) => {
    const valor = variables[key];
    return valor === undefined || valor === null ? match : String(valor);
  });
};

const escaparHtml = (valor = "") =>
  String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const convertirTextoAHtml = (contenido = "") => {
  if (/<[a-z][\s\S]*>/i.test(contenido)) {
    return contenido;
  }

  return escaparHtml(contenido)
    .split(/\n{2,}/)
    .map((parrafo) => `<p>${parrafo.replace(/\n/g, "<br />")}</p>`)
    .join("");
};

const normalizarDestinatarios = (destinatarios) => {
  const lista = Array.isArray(destinatarios) ? destinatarios : [destinatarios];

  return lista
    .map((item) => {
      if (typeof item === "string") return { email: item };
      return item;
    })
    .filter((item) => item?.email);
};

export const enviarEmailBrevo = async ({
  destinatarios,
  asunto,
  htmlContent,
  textContent,
  remitenteEmail,
  remitenteNombre,
  replyTo,
  plantillaId = null,
  evento = null,
}) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = remitenteEmail || process.env.BREVO_DEFAULT_SENDER_EMAIL;
  const senderName = remitenteNombre || process.env.BREVO_DEFAULT_SENDER_NAME || "JAES Cargo";
  const to = normalizarDestinatarios(destinatarios);

  if (!apiKey) {
    throw new Error("BREVO_API_KEY no esta configurada.");
  }

  if (!senderEmail) {
    throw new Error("BREVO_DEFAULT_SENDER_EMAIL no esta configurado.");
  }

  if (!to.length) {
    throw new Error("Debes indicar al menos un destinatario valido.");
  }

  const payload = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to,
    subject: asunto,
    htmlContent,
    textContent,
  };

  if (replyTo?.email) {
    payload.replyTo = replyTo;
  }

  const response = await fetch(BREVO_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detalle = data?.message || data?.error || JSON.stringify(data);
    const error = new Error(`Brevo rechazo el envio: ${detalle}`);

    for (const destinatario of to) {
      await guardarLogEmail({
        plantillaId,
        evento,
        destinatario: destinatario.email,
        asunto,
        estado: "fallido",
        error: detalle,
      });
    }

    throw error;
  }

  for (const destinatario of to) {
    await guardarLogEmail({
      plantillaId,
      evento,
      destinatario: destinatario.email,
      asunto,
      estado: "enviado",
      messageId: data?.messageId || null,
    });
  }

  return data;
};

export const enviarEmailDesdePlantilla = async ({
  plantilla,
  destinatarios,
  variables = {},
  remitenteNombre,
  replyTo,
  evento = null,
}) => {
  const asunto = renderizarTexto(plantilla.asunto, variables);
  const cuerpo = renderizarTexto(plantilla.cuerpo, variables);

  return enviarEmailBrevo({
    destinatarios,
    asunto,
    htmlContent: convertirTextoAHtml(cuerpo),
    textContent: cuerpo,
    remitenteEmail: plantilla.email_remitente,
    remitenteNombre,
    replyTo,
    plantillaId: plantilla.id,
    evento,
  });
};

export const obtenerPlantillaEmailPorEvento = async (claveEvento) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("clave_evento", sql.NVarChar(120), claveEvento)
      .query(`
        IF OBJECT_ID('dbo.plantillas_comunicacion', 'U') IS NULL
        BEGIN
          SELECT TOP 0
            CAST(NULL AS INT) AS id,
            CAST(NULL AS NVARCHAR(180)) AS email_remitente,
            CAST(NULL AS NVARCHAR(250)) AS asunto,
            CAST(NULL AS NVARCHAR(MAX)) AS cuerpo;
        END
        ELSE
        BEGIN
          SELECT TOP 1
            id,
            email_remitente,
            asunto,
            cuerpo
          FROM plantillas_comunicacion
          WHERE clave_evento = @clave_evento
            AND activo = 1
          ORDER BY fecha_actualizacion DESC, fecha_creacion DESC, id DESC;
        END
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error obteniendo plantilla de email por evento:", error);
    return null;
  }
};
