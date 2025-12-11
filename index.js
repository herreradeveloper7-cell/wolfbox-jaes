import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
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
import cargosRoutes from "./routes/cargos.routes.js";
import serviciosRoutes from "./routes/servicios.routes.js";


dotenv.config();
const app = express();

const uploadsPath = path.resolve("uploads/comprobantes");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(cors());
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
