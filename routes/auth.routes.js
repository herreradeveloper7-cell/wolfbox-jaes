import express from 'express';
import {
  confirmarRecuperacionPassword,
  loginGeneral,
  registrarUsuario,
  solicitarRecuperacionPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post("/login", loginGeneral);
router.post("/password-reset/request", solicitarRecuperacionPassword);
router.post("/password-reset/confirm", confirmarRecuperacionPassword);

export default router;
