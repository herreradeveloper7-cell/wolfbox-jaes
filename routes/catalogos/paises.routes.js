import express from "express";
import { obtenerPaises } from "../../controllers/catalogos/paises.controller.js";

const router = express.Router();

router.get("/", obtenerPaises);

export default router;