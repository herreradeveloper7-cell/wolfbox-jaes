import crypto from "crypto";
import { sql } from "../config/db.js";

export const ACCESS_TOKEN_EXPIRES_IN = "15m";
const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_NORMAL_MS = 8 * 60 * 60 * 1000;
const REFRESH_PERSISTENTE_MS = 30 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = "wolfbox_refresh";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generarRefreshToken = () => crypto.randomBytes(48).toString("base64url");

const obtenerCookie = (req, nombre) => {
  const cookies = String(req.headers?.cookie || "").split(";");
  for (const cookie of cookies) {
    const [clave, ...partes] = cookie.trim().split("=");
    if (clave === nombre) return decodeURIComponent(partes.join("="));
  }
  return null;
};

const obtenerSameSiteCookie = () => {
  const valor = String(process.env.REFRESH_COOKIE_SAME_SITE || "lax").toLowerCase();
  return ["lax", "strict", "none"].includes(valor) ? valor : "lax";
};

const opcionesCookie = ({ mantenerSesion = false, eliminar = false } = {}) => {
  const sameSite = obtenerSameSiteCookie();

  return ({
  httpOnly: true,
  secure: sameSite === "none" || process.env.NODE_ENV === "production",
  sameSite,
  path: "/api/auth",
  ...(eliminar
    ? { expires: new Date(0) }
    : mantenerSesion
      ? { maxAge: REFRESH_PERSISTENTE_MS }
      : {}),
  });
};

export const establecerRefreshCookie = (res, token, mantenerSesion) => {
  res.cookie(REFRESH_COOKIE_NAME, token, opcionesCookie({ mantenerSesion }));
};

export const eliminarRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, opcionesCookie({ eliminar: true }));
};

export const leerRefreshCookie = (req) => obtenerCookie(req, REFRESH_COOKIE_NAME);

export const crearSesion = async (pool, req, { tipoCuenta, cuentaId, mantenerSesion }) => {
  const id = crypto.randomUUID();
  const refreshToken = generarRefreshToken();
  const duracion = mantenerSesion ? REFRESH_PERSISTENTE_MS : REFRESH_NORMAL_MS;
  const expiraEn = new Date(Date.now() + duracion);

  await pool
    .request()
    .input("id", sql.UniqueIdentifier, id)
    .input("tipo_cuenta", sql.NVarChar(20), tipoCuenta)
    .input("cuenta_id", sql.Int, Number(cuentaId))
    .input("refresh_token_hash", sql.Char(64), hashToken(refreshToken))
    .input("expira_en", sql.DateTime2, expiraEn)
    .input("ip_creacion", sql.NVarChar(64), req.ip || null)
    .input("user_agent", sql.NVarChar(500), req.get?.("user-agent") || null)
    .query(`
      INSERT INTO sesiones_autenticacion (
        id, tipo_cuenta, cuenta_id, refresh_token_hash, expira_en,
        ip_creacion, user_agent
      ) VALUES (
        @id, @tipo_cuenta, @cuenta_id, @refresh_token_hash, @expira_en,
        @ip_creacion, @user_agent
      )
    `);

  return { id, refreshToken, mantenerSesion, expiraEn };
};

export const rotarSesion = async (pool, refreshToken) => {
  if (!refreshToken) return null;

  const nuevoToken = generarRefreshToken();
  const result = await pool
    .request()
    .input("refresh_actual", sql.Char(64), hashToken(refreshToken))
    .input("refresh_nuevo", sql.Char(64), hashToken(nuevoToken))
    .query(`
      UPDATE sesiones_autenticacion
      SET refresh_token_hash = @refresh_nuevo,
          ultima_actividad_en = SYSUTCDATETIME()
      OUTPUT
        INSERTED.id,
        INSERTED.tipo_cuenta,
        INSERTED.cuenta_id,
        INSERTED.expira_en
      WHERE refresh_token_hash = @refresh_actual
        AND revocada_en IS NULL
        AND expira_en > SYSUTCDATETIME()
    `);

  const sesion = result.recordset[0];
  return sesion ? { ...sesion, refreshToken: nuevoToken } : null;
};

export const revocarSesionPorRefresh = async (pool, refreshToken, motivo = "logout") => {
  if (!refreshToken) return;
  await pool
    .request()
    .input("refresh_token_hash", sql.Char(64), hashToken(refreshToken))
    .input("motivo", sql.NVarChar(100), motivo)
    .query(`
      UPDATE sesiones_autenticacion
      SET revocada_en = COALESCE(revocada_en, SYSUTCDATETIME()),
          motivo_revocacion = COALESCE(motivo_revocacion, @motivo)
      WHERE refresh_token_hash = @refresh_token_hash
    `);
};

export const revocarSesionesCuenta = async (pool, tipoCuenta, cuentaId, motivo) => {
  await pool
    .request()
    .input("tipo_cuenta", sql.NVarChar(20), tipoCuenta)
    .input("cuenta_id", sql.Int, Number(cuentaId))
    .input("motivo", sql.NVarChar(100), motivo)
    .query(`
      UPDATE sesiones_autenticacion
      SET revocada_en = COALESCE(revocada_en, SYSUTCDATETIME()),
          motivo_revocacion = COALESCE(motivo_revocacion, @motivo)
      WHERE tipo_cuenta = @tipo_cuenta
        AND cuenta_id = @cuenta_id
        AND revocada_en IS NULL
    `);
};

export const ACCESS_TOKEN_TTL_SECONDS = ACCESS_TOKEN_MAX_AGE_SECONDS;
