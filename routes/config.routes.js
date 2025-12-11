import express from "express";
import { getUltimoTRM, crearTRM } from "../controllers/config.controller.js";

const router = express.Router();

router.get("/trm", getUltimoTRM);
router.post("/trm", crearTRM);

export default router;
