import express from "express";
import { buscarPaquetesFiltrados } from "../controllers/paquetes.controller.js";

const router = express.Router();

router.post("/buscar", buscarPaquetesFiltrados);

export default router;
