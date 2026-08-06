import express from 'express';
import {
  confirmarRecuperacionPassword,
  loginGeneral,
  registrarUsuario,
  solicitarRecuperacionPassword,
  renovarSesion,
  cerrarSesion,
} from "../controllers/auth.controller.js";
import { confirmarMfa, prepararMfa, verificarLoginMfa } from "../controllers/mfa.controller.js";
import { autenticarDesafioMfa } from "../middleware/mfa.middleware.js";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import {
  limiteLogin,
  limiteRecuperacionPassword,
  limiteRenovacionSesion,
} from "../config/rate-limit.js";

const router = express.Router();

router.post('/registro', autenticarToken, autorizarRoles("admin"), registrarUsuario);
router.post("/login", limiteLogin, loginGeneral);
router.get("/mfa/setup", limiteLogin, autenticarDesafioMfa, prepararMfa);
router.post("/mfa/setup/confirm", limiteLogin, autenticarDesafioMfa, confirmarMfa);
router.post("/mfa/verify", limiteLogin, autenticarDesafioMfa, verificarLoginMfa);
router.post("/password-reset/request", limiteRecuperacionPassword, solicitarRecuperacionPassword);
router.post("/password-reset/confirm", limiteRecuperacionPassword, confirmarRecuperacionPassword);
router.post("/refresh", limiteRenovacionSesion, renovarSesion);
router.post("/logout", cerrarSesion);

export default router;
