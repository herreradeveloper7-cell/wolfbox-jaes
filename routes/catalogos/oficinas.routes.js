import express from "express";
import { obtenerOficinas } from "../../controllers/catalogos/oficinas.controller.js";

const router = express.Router();

router.get("/", obtenerOficinas);

export default router;