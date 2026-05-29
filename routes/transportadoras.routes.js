import express from "express";
import { autenticarToken, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import {
  actualizarTransportadora,
  crearTransportadora,
  inhabilitarTransportadora,
  listarTransportadoras,
} from "../controllers/transportadoras.controller.js";

const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const soloOperacion = autorizarRoles("admin", "usuario");
const configuracion = autorizarPermisos("Configuracion");

router.use(autenticarToken);

router.get("/", soloOperacion, listarTransportadoras);
router.post("/", configuracion, crearTransportadora);
router.put("/:id", configuracion, actualizarTransportadora);
router.patch("/:id/inhabilitar", configuracion, inhabilitarTransportadora);

export default router;
