import { createClient } from "redis";
import { RedisStore } from "rate-limit-redis";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const redisUrl = String(process.env.REDIS_URL || "").trim();
let redisClient = null;

if (redisUrl) {
  const client = createClient({ url: redisUrl });
  client.on("error", (error) => {
    console.error("[rate-limit] Redis no disponible:", error.message);
  });

  try {
    await client.connect();
    redisClient = client;
    console.log("Rate limiting distribuido conectado a Redis");
  } catch (error) {
    console.error("[rate-limit] No fue posible conectar a Redis:", error.message);
  }
} else if (process.env.NODE_ENV === "production") {
  console.warn("[rate-limit] REDIS_URL no configurada; usando memoria local temporalmente");
}

const numeroPositivo = (nombre, valorPorDefecto) => {
  const valor = Number(process.env[nombre]);
  return Number.isFinite(valor) && valor > 0 ? Math.floor(valor) : valorPorDefecto;
};

const claveIp = (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown");
const claveCuentaOIp = (req) =>
  req.usuario?.id && req.usuario?.tipo
    ? `${req.usuario.tipo}:${req.usuario.id}`
    : `ip:${claveIp(req)}`;

const crearStore = (prefijo) =>
  redisClient
    ? new RedisStore({
        prefix: `wolfbox:rl:${prefijo}:`,
        sendCommand: (...args) => redisClient.sendCommand(args),
      })
    : undefined;

const crearLimitador = ({ nombre, windowMs, limit, keyGenerator = claveIp, mensaje }) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator,
    store: crearStore(nombre),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: true,
    message: {
      ok: false,
      codigo: "RATE_LIMIT_EXCEEDED",
      mensaje,
      message: mensaje,
    },
  });

export const limiteGeneralApi = crearLimitador({
  nombre: "api-general",
  windowMs: 5 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_API_5M", 600),
  mensaje: "Demasiadas solicitudes. Espera unos minutos antes de continuar.",
});

export const limiteLogin = crearLimitador({
  nombre: "login",
  windowMs: 15 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_LOGIN_15M", 10),
  mensaje: "Demasiados intentos de inicio de sesión. Espera unos minutos.",
});

export const limiteRenovacionSesion = crearLimitador({
  nombre: "refresh",
  windowMs: 15 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_REFRESH_15M", 120),
  mensaje: "Demasiadas renovaciones de sesión. Inicia sesión nuevamente.",
});

export const limiteRecuperacionPassword = crearLimitador({
  nombre: "password-reset",
  windowMs: 60 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_PASSWORD_RESET_1H", 5),
  mensaje: "Demasiadas solicitudes de recuperación. Intenta más tarde.",
});

export const limiteRegistroPublico = crearLimitador({
  nombre: "registro-publico",
  windowMs: 60 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_REGISTRO_1H", 15),
  mensaje: "Se alcanzó el límite de registros. Intenta más tarde.",
});

export const limiteTrackingPublico = crearLimitador({
  nombre: "tracking-publico",
  windowMs: 15 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_TRACKING_15M", 30),
  mensaje: "Demasiadas consultas de tracking. Intenta nuevamente en unos minutos.",
});

export const limiteBusqueda = crearLimitador({
  nombre: "busqueda",
  windowMs: 5 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_BUSQUEDA_5M", 120),
  keyGenerator: claveCuentaOIp,
  mensaje: "Se alcanzó el límite de búsquedas. Espera unos minutos.",
});

export const limiteReportes = crearLimitador({
  nombre: "reportes",
  windowMs: 10 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_REPORTES_10M", 20),
  keyGenerator: claveCuentaOIp,
  mensaje: "Se alcanzó el límite de reportes o exportaciones. Intenta más tarde.",
});

export const limitePdf = crearLimitador({
  nombre: "pdf",
  windowMs: 10 * 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_PDF_10M", 30),
  keyGenerator: claveCuentaOIp,
  mensaje: "Se alcanzó el límite de generación de documentos. Intenta más tarde.",
});

export const limiteHealthDb = crearLimitador({
  nombre: "health-db",
  windowMs: 60 * 1000,
  limit: numeroPositivo("RATE_LIMIT_HEALTH_DB_1M", 10),
  mensaje: "Demasiadas comprobaciones de base de datos.",
});

export const rateLimitUsaRedis = () => Boolean(redisClient?.isReady);
