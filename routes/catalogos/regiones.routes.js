import express from "express";

import {
  obtenerRegionesPorPais,
} from "../../controllers/catalogos/regiones.controller.js";

const router = express.Router();

router.get("/:pais_id", obtenerRegionesPorPais);

export default router;