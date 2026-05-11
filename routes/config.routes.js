import express from "express";
import { getUltimoTRM, crearTRM } from "../controllers/config.controller.js";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(autenticarToken);

router.get("/trm", autorizarRoles("admin", "usuario", "cliente"), getUltimoTRM);
router.post("/trm", autorizarRoles("admin"), crearTRM);

export default router;
