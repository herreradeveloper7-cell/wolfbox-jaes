import { poolPromise, sql } from "../config/db.js";

const CLAVES_SENSIBLES = /password|contrasena|contraseña|token|secret|secreto|authorization|cookie|api.?key|connection.?string|buffer|archivo|^codigo$|codigo.*mfa|codigo.*recuperacion/i;

export const redactarParaAuditoria = (valor, profundidad = 0) => {
  if (valor === null || valor === undefined) return valor ?? null;
  if (profundidad > 5) return "[PROFUNDIDAD_LIMITADA]";
  if (Buffer.isBuffer(valor)) return "[BUFFER_REDACTADO]";
  if (typeof valor === "string") return valor.length > 2000 ? `${valor.slice(0, 2000)}…` : valor;
  if (["number", "boolean"].includes(typeof valor)) return valor;
  if (Array.isArray(valor)) {
    return valor.slice(0, 50).map((item) => redactarParaAuditoria(item, profundidad + 1));
  }
  if (typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([clave, contenido]) => [
      clave,
      CLAVES_SENSIBLES.test(clave)
        ? "[REDACTADO]"
        : redactarParaAuditoria(contenido, profundidad + 1),
    ]));
  }
  return String(valor);
};

const jsonSeguro = (valor) => {
  if (valor === null || valor === undefined) return null;
  const texto = JSON.stringify(redactarParaAuditoria(valor));
  return texto.length <= 32000
    ? texto
    : JSON.stringify({ truncado: true, longitud_original: texto.length });
};

export const registrarEventoAuditoria = async (evento) => {
  const pool = await poolPromise;
  await pool.request()
    .input("request_id", sql.NVarChar(100), evento.requestId)
    .input("actor_tipo", sql.NVarChar(30), evento.actorTipo || "anonimo")
    .input("actor_id", sql.Int, evento.actorId || null)
    .input("actor_rol", sql.NVarChar(50), evento.actorRol || null)
    .input("accion", sql.NVarChar(80), evento.accion)
    .input("recurso", sql.NVarChar(80), evento.recurso)
    .input("recurso_id", sql.NVarChar(150), evento.recursoId || null)
    .input("metodo", sql.NVarChar(10), evento.metodo)
    .input("ruta", sql.NVarChar(500), evento.ruta)
    .input("datos_antes", sql.NVarChar(sql.MAX), jsonSeguro(evento.antes))
    .input("datos_despues", sql.NVarChar(sql.MAX), jsonSeguro(evento.despues))
    .input("cambios_solicitados", sql.NVarChar(sql.MAX), jsonSeguro(evento.cambios))
    .input("resultado", sql.NVarChar(20), evento.resultado)
    .input("status_http", sql.Int, evento.statusHttp)
    .input("codigo_error", sql.NVarChar(100), evento.codigoError || null)
    .input("ip", sql.NVarChar(64), evento.ip || null)
    .input("user_agent", sql.NVarChar(500), evento.userAgent || null)
    .query(`
      INSERT INTO dbo.auditoria_eventos (
        request_id, actor_tipo, actor_id, actor_rol, accion, recurso, recurso_id,
        metodo, ruta, datos_antes, datos_despues, cambios_solicitados,
        resultado, status_http, codigo_error, ip, user_agent
      ) VALUES (
        @request_id, @actor_tipo, @actor_id, @actor_rol, @accion, @recurso, @recurso_id,
        @metodo, @ruta, @datos_antes, @datos_despues, @cambios_solicitados,
        @resultado, @status_http, @codigo_error, @ip, @user_agent
      )
    `);
};
