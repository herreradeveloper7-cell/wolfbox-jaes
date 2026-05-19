import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import {
  actualizarTransportadora,
  crearTransportadora,
  inhabilitarTransportadora,
  listarTransportadoras,
} from "../controllers/transportadoras.controller.js";

const router = express.Router();
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken, soloOperacion);

router.get("/", listarTransportadoras);
router.post("/", crearTransportadora);
router.put("/:id", actualizarTransportadora);
router.patch("/:id/inhabilitar", inhabilitarTransportadora);

export default router;
