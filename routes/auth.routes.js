import express from 'express';
import {
  confirmarRecuperacionPassword,
  loginGeneral,
  registrarUsuario,
  solicitarRecuperacionPassword,
} from "../controllers/auth.controller.js";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/registro', autenticarToken, autorizarRoles("admin"), registrarUsuario);
router.post("/login", loginGeneral);
router.post("/password-reset/request", solicitarRecuperacionPassword);
router.post("/password-reset/confirm", confirmarRecuperacionPassword);

export default router;
