import { poolPromise, sql } from "../config/db.js";
import { firmarToken } from "../middleware/auth.middleware.js";
import { buildUsuarioLoginResponse, buildUsuarioTokenPayload } from "../utils/auth.helpers.js";
import { ACCESS_TOKEN_EXPIRES_IN, crearSesion, establecerRefreshCookie } from "../utils/session.service.js";
import {
  cifrarSecretoMfa,
  consumirCodigoRecuperacion,
  crearUriOtp,
  descifrarSecretoMfa,
  generarCodigosRecuperacion,
  generarSecretoMfa,
  verificarTotp,
} from "../utils/mfa.service.js";

const obtenerUsuario = async (pool, id) => {
  const result = await pool.request().input("id", sql.Int, Number(id)).query(`
    SELECT TOP 1 * FROM usuarios WHERE id = @id AND estado = 'activo' AND tipo_usuario = 'admin'
  `);
  const usuario = result.recordset[0];
  if (!usuario) return null;
  const permisos = await pool.request().input("usuario_id", sql.Int, usuario.id)
    .query("SELECT permiso FROM permisos_usuario WHERE usuario_id = @usuario_id");
  usuario.permisos = permisos.recordset.map((item) => item.permiso);
  return usuario;
};

const completarLogin = async (req, res, pool, usuario, mantenerSesion, extra = {}) => {
  const sesion = await crearSesion(pool, req, { tipoCuenta: "usuario", cuentaId: usuario.id, mantenerSesion });
  const token = firmarToken({ ...buildUsuarioTokenPayload(usuario), sid: sesion.id }, ACCESS_TOKEN_EXPIRES_IN);
  establecerRefreshCookie(res, sesion.refreshToken, mantenerSesion);
  return res.json({ ok: true, token, usuario: buildUsuarioLoginResponse(usuario), ...extra });
};

export const prepararMfa = async (req, res) => {
  if (req.desafioMfa.mfa_scope !== "setup") return res.status(403).json({ ok: false, mensaje: "Operación MFA no autorizada." });
  try {
    const pool = await poolPromise;
    const usuario = await obtenerUsuario(pool, req.desafioMfa.id);
    if (!usuario || usuario.mfa_habilitado) return res.status(409).json({ ok: false, mensaje: "MFA ya está configurado o el usuario no está disponible." });
    const secreto = usuario.mfa_secreto_cifrado ? descifrarSecretoMfa(usuario.mfa_secreto_cifrado) : generarSecretoMfa();
    if (!usuario.mfa_secreto_cifrado) {
      await pool.request().input("id", sql.Int, usuario.id).input("secreto", sql.NVarChar(500), cifrarSecretoMfa(secreto))
        .query("UPDATE usuarios SET mfa_secreto_cifrado = @secreto WHERE id = @id AND mfa_habilitado = 0");
    }
    return res.json({ ok: true, secreto, uri: crearUriOtp({ secreto, email: usuario.correo }) });
  } catch (error) {
    console.error("Error preparando MFA:", error.message);
    return res.status(500).json({ ok: false, mensaje: "No fue posible preparar MFA. Verifica la configuración del servidor." });
  }
};

export const confirmarMfa = async (req, res) => {
  if (req.desafioMfa.mfa_scope !== "setup") return res.status(403).json({ ok: false, mensaje: "Operación MFA no autorizada." });
  try {
    const pool = await poolPromise;
    const usuario = await obtenerUsuario(pool, req.desafioMfa.id);
    if (!usuario?.mfa_secreto_cifrado || usuario.mfa_habilitado) return res.status(409).json({ ok: false, mensaje: "La configuración MFA no está disponible." });
    const secreto = descifrarSecretoMfa(usuario.mfa_secreto_cifrado);
    if (!verificarTotp(secreto, req.body.codigo)) return res.status(400).json({ ok: false, campo: "codigo", mensaje: "El código de autenticación no es válido." });
    const recuperacion = generarCodigosRecuperacion();
    await pool.request().input("id", sql.Int, usuario.id).input("hashes", sql.NVarChar(sql.MAX), JSON.stringify(recuperacion.hashes)).query(`
      UPDATE usuarios SET mfa_habilitado = 1, mfa_confirmado_en = SYSUTCDATETIME(), mfa_codigos_recuperacion_hash = @hashes WHERE id = @id AND mfa_habilitado = 0
    `);
    usuario.mfa_habilitado = true;
    return completarLogin(req, res, pool, usuario, Boolean(req.desafioMfa.mantenerSesion), { codigos_recuperacion: recuperacion.codigos });
  } catch (error) {
    console.error("Error confirmando MFA:", error.message);
    return res.status(500).json({ ok: false, mensaje: "No fue posible confirmar MFA." });
  }
};

export const verificarLoginMfa = async (req, res) => {
  if (req.desafioMfa.mfa_scope !== "login") return res.status(403).json({ ok: false, mensaje: "Operación MFA no autorizada." });
  try {
    const pool = await poolPromise;
    const usuario = await obtenerUsuario(pool, req.desafioMfa.id);
    if (!usuario?.mfa_habilitado || !usuario.mfa_secreto_cifrado) return res.status(403).json({ ok: false, mensaje: "MFA no está habilitado." });
    const codigo = String(req.body.codigo || "").trim();
    let valido = /^\d{6}$/.test(codigo) && verificarTotp(descifrarSecretoMfa(usuario.mfa_secreto_cifrado), codigo);
    if (!valido) {
      const hashesActualizados = consumirCodigoRecuperacion(codigo, usuario.mfa_codigos_recuperacion_hash);
      if (hashesActualizados !== null) {
        valido = true;
        await pool.request().input("id", sql.Int, usuario.id).input("hashes", sql.NVarChar(sql.MAX), hashesActualizados)
          .query("UPDATE usuarios SET mfa_codigos_recuperacion_hash = @hashes WHERE id = @id");
      }
    }
    if (!valido) return res.status(401).json({ ok: false, campo: "codigo", mensaje: "Código MFA o de recuperación incorrecto." });
    return completarLogin(req, res, pool, usuario, Boolean(req.desafioMfa.mantenerSesion));
  } catch (error) {
    console.error("Error verificando MFA:", error.message);
    return res.status(500).json({ ok: false, mensaje: "No fue posible verificar MFA." });
  }
};
