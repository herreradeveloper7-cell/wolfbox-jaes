import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { listarTransportadoras } from "../controllers/transportadoras.controller.js";

const router = express.Router();
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken, soloOperacion);

router.get("/", listarTransportadoras);

export default router;
