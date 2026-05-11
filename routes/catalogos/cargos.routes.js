import { Router } from "express";
import { autenticarToken, autorizarRoles } from "../../middleware/auth.middleware.js";
import {
  obtenerCargosPorSolicitud,
  crearCargoAdicional,
  eliminarCargoAdicional,
  obtenerCatalogoCargos
} from "../../controllers/catalogos/cargos.controller.js";

const router = Router();
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken, soloOperacion);

router.get("/catalogo/cargos", obtenerCatalogoCargos);
router.get("/:solicitud_id", obtenerCargosPorSolicitud);
router.post("/agregar", crearCargoAdicional);
router.delete("/:id", eliminarCargoAdicional);

export default router;
