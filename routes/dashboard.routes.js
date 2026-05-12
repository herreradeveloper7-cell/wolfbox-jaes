import express from "express";
import { obtenerResumenUsuario } from "../controllers/dashboard.controller.js";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(autenticarToken, autorizarRoles("admin", "usuario"));

router.get("/usuario", obtenerResumenUsuario);

export default router;
