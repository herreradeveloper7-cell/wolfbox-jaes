import express from "express";

import {
  obtenerCiudadesPorRegion,
} from "../../controllers/catalogos/ciudades.controller.js";

const router = express.Router();

router.get("/:region_id", obtenerCiudadesPorRegion);

export default router;