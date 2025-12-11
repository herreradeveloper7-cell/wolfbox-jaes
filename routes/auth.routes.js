import express from 'express';
import { registrarUsuario } from '../controllers/auth.controller.js';
import { loginGeneral } from "../controllers/auth.controller.js";

const router = express.Router();

router.post('/registro', registrarUsuario);
router.post("/login", loginGeneral);

export default router;
