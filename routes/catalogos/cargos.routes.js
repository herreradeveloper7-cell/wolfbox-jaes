import { Router } from "express";
import {
  obtenerCargosPorSolicitud,
  crearCargoAdicional,
  eliminarCargoAdicional,
  obtenerCatalogoCargos
} from "../../controllers/catalogos/cargos.controller.js";

const router = Router();

router.get("/catalogo/cargos", obtenerCatalogoCargos);

router.get("/:solicitud_id", obtenerCargosPorSolicitud);
router.post("/agregar", crearCargoAdicional);
router.delete("/:id", eliminarCargoAdicional);

export default router;
