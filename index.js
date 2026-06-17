import "./env.js";
import express from 'express';
import cors from 'cors';
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import fs from "fs";
import path from "path";
import authRoutes from './routes/auth.routes.js';
import paquetesRoutes from './routes/paquetes.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import guiasRoutes from "./routes/guias.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import destinatariosRoutes from "./routes/destinatarios.routes.js";
import configRoutes from "./routes/config.routes.js";
import trmRoutes from "./routes/trm.routes.js";
import cargosRoutes from "./routes/catalogos/cargos.routes.js";
import serviciosRoutes from "./routes/catalogos/servicios.routes.js";
import agrupacionesRoutes from "./routes/agruparPaquetes.routes.js";
import conciliacionRoutes from "./routes/conciliacion.routes.js";
import despachosRoutes from "./routes/despachos.routes.js";
import transportadorasRoutes from "./routes/transportadoras.routes.js";
import plantillasComunicacionRoutes from "./routes/plantillasComunicacion.routes.js";
import notificacionesRoutes from "./routes/notificaciones.routes.js";
import prealertasRoutes from "./routes/prealertas.routes.js";
import promocionesRoutes from "./routes/promociones.routes.js";
import oficinasRoutes from "./routes/catalogos/oficinas.routes.js";
import paisesRoutes from "./routes/catalogos/paises.routes.js";
import regionesRoutes from "./routes/catalogos/regiones.routes.js";
import ciudadesRoutes from "./routes/catalogos/ciudades.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import { iniciarDbKeepAlive, poolPromise } from "./config/db.js";

const app = express();
iniciarDbKeepAlive();
const APP_VERSION =
  process.env.RAILWAY_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT_SHA ||
  process.env.APP_VERSION ||
  "local";

const uploadsPath = path.resolve("uploads/comprobantes");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  const startedAt = Date.now();
  const slowRequestMs = Number(process.env.SLOW_REQUEST_MS) || 2500;
  res.setHeader("X-Wolfbox-Version", APP_VERSION);

  res.on("finish", () => {
    const elapsed = Date.now() - startedAt;

    if (elapsed >= slowRequestMs) {
      console.warn(
        `[slow-request] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsed}ms`
      );
    }
  });

  next();
});

app.get('/', (req, res) => {
  res.send('Servidor backend funcionando 🎉');
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "wolfbox-api" });
});

app.get("/version", (req, res) => {
  res.json({
    ok: true,
    service: "wolfbox-api",
    version: APP_VERSION,
    deployedAt: process.env.RAILWAY_DEPLOYMENT_ID || null,
    environment: process.env.RAILWAY_ENVIRONMENT_NAME || process.env.NODE_ENV || null,
  });
});

app.get("/health/db", async (req, res) => {
  try {
    const startedAt = Date.now();
    const pool = await poolPromise;
    await pool.request().query("SELECT 1 AS ok");
    res.json({ ok: true, db: "connected", latency_ms: Date.now() - startedAt });
  } catch (error) {
    console.error("Health DB failed:", error);
    res.status(503).json({ ok: false, db: "unavailable" });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: "Demasiados intentos. Espera unos minutos antes de volver a intentar.",
  },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use("/api/guias", guiasRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/destinatarios", destinatariosRoutes);
app.use("/api/config", configRoutes);
app.use("/api/trm", trmRoutes);
app.use("/api/cargos", cargosRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/agrupaciones", agrupacionesRoutes);
app.use("/api/conciliacion", conciliacionRoutes);
app.use("/api/despachos", despachosRoutes);
app.use("/api/transportadoras", transportadorasRoutes);
app.use("/api/plantillas-comunicacion", plantillasComunicacionRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/prealertas", prealertasRoutes);
app.use("/api/promociones", promocionesRoutes);
app.use("/api/oficinas", oficinasRoutes);
app.use("/api/catalogos/paises", paisesRoutes);
app.use("/api/catalogos/regiones", regionesRoutes);
app.use("/api/catalogos/ciudades", ciudadesRoutes);
app.use("/api/dashboard", dashboardRoutes);

const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || "https://api.wolfbox.app";

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en ${PUBLIC_URL}`);
});
