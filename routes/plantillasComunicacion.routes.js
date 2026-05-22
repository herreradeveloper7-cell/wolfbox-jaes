import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import {
  actualizarPlantillaComunicacion,
  crearPlantillaComunicacion,
  enviarPruebaPlantillaComunicacion,
  inhabilitarPlantillaComunicacion,
  listarLogsEmail,
  listarPlantillasComunicacion,
} from "../controllers/plantillasComunicacion.controller.js";

const router = express.Router();
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken, soloOperacion);

router.get("/", listarPlantillasComunicacion);
router.get("/logs", listarLogsEmail);
router.post("/", crearPlantillaComunicacion);
router.post("/:id/enviar-prueba", enviarPruebaPlantillaComunicacion);
router.put("/:id", actualizarPlantillaComunicacion);
router.patch("/:id/inhabilitar", inhabilitarPlantillaComunicacion);

export default router;
