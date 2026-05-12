import "./env.js";
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
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
import oficinasRoutes from "./routes/catalogos/oficinas.routes.js";
import paisesRoutes from "./routes/catalogos/paises.routes.js";
import regionesRoutes from "./routes/catalogos/regiones.routes.js";
import ciudadesRoutes from "./routes/catalogos/ciudades.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

const uploadsPath = path.resolve("uploads/comprobantes");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origen no permitido por CORS"));
  },
  credentials: true,
}));
app.use(bodyParser.json());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.get('/', (req, res) => {
  res.send('Servidor backend funcionando 🎉');
});

app.use('/api/auth', authRoutes);
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
app.use("/api/oficinas", oficinasRoutes);
app.use("/api/catalogos/paises", paisesRoutes);
app.use("/api/catalogos/regiones", regionesRoutes);
app.use("/api/catalogos/ciudades", ciudadesRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || "https://api.wolfbox.app";

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en ${PUBLIC_URL}`);
});
