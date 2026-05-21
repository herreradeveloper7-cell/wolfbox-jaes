import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import {
  archivarNotificacion,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "../controllers/notificaciones.controller.js";

const router = express.Router();

router.use(autenticarToken, autorizarRoles("admin", "usuario"));

router.get("/", listarNotificaciones);
router.patch("/leer-todas", marcarTodasLeidas);
router.patch("/:id/leida", marcarNotificacionLeida);
router.patch("/:id/archivar", archivarNotificacion);

export default router;
