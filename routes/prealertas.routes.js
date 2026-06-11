import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { prealertaSchemas } from "../validators/api.schemas.js";
import { crearPrealerta, listarPrealertas } from "../controllers/prealertas.controller.js";

const router = express.Router();

router.use(autenticarToken, autorizarRoles("admin", "usuario", "cliente"));

router.get("/", validar({ query: prealertaSchemas.listar }), listarPrealertas);
router.post("/", validar({ body: prealertaSchemas.crear }), crearPrealerta);

export default router;
