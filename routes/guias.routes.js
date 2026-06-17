import express from "express";
import { buscarGuias, obtenerTiendasUnicas, consultarTrackingFiltrado  } from "../controllers/consultarGuias.controller.js";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(autenticarToken, autorizarRoles("admin", "usuario"));

router.post("/buscar", buscarGuias);
router.get("/tiendas", obtenerTiendasUnicas);
router.get("/consultar-tracking", consultarTrackingFiltrado);
export default router;
