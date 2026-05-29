import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import {
  actualizarTransportadora,
  crearTransportadora,
  inhabilitarTransportadora,
  listarTransportadoras,
} from "../controllers/transportadoras.controller.js";

const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken);

router.get("/", soloOperacion, listarTransportadoras);
router.post("/", soloAdmin, crearTransportadora);
router.put("/:id", soloAdmin, actualizarTransportadora);
router.patch("/:id/inhabilitar", soloAdmin, inhabilitarTransportadora);

export default router;
