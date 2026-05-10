import express from "express";
import { buscarGuias, obtenerTiendasUnicas, consultarTrackingFiltrado  } from "../controllers/consultarGuias.controller.js";

const router = express.Router();

router.post("/buscar", buscarGuias);
router.get("/tiendas", obtenerTiendasUnicas);
router.get("/consultar-tracking", consultarTrackingFiltrado);
export default router;
