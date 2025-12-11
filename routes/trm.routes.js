import express from "express";
import { listarTRM, crearTRM, editarTRM, eliminarTRM, obtenerTRMActual } from "../controllers/trm.controller.js";

const router = express.Router();

router.get("/", listarTRM);
router.get("/actual", obtenerTRMActual);
router.post("/", crearTRM);
router.put("/:id", editarTRM);
router.delete("/:id", eliminarTRM);

export default router;
