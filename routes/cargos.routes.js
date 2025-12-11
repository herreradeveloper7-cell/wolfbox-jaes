import { Router } from "express";
import {
  obtenerCargosPorSolicitud,
  crearCargoAdicional,
  eliminarCargoAdicional
} from "../controllers/cargos.controller.js";

const router = Router();

router.get("/:solicitud_id", obtenerCargosPorSolicitud);
router.post("/agregar", crearCargoAdicional);
router.delete("/:id", eliminarCargoAdicional);

export default router;
