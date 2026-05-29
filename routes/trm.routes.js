import express from "express";
import { listarTRM, crearTRM, editarTRM, eliminarTRM, obtenerTRMActual } from "../controllers/trm.controller.js";
import { autenticarToken, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { idParam, trmSchemas } from "../validators/api.schemas.js";

const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const configuracion = autorizarPermisos("Configuracion");
const autenticados = autorizarRoles("admin", "usuario", "cliente");

router.use(autenticarToken);

router.get("/", configuracion, listarTRM);
router.get("/actual", autenticados, obtenerTRMActual);
router.post("/", configuracion, validar({ body: trmSchemas.guardar }), crearTRM);
router.put("/:id", configuracion, validar({ params: idParam(), body: trmSchemas.guardar }), editarTRM);
router.delete("/:id", configuracion, validar({ params: idParam() }), eliminarTRM);

export default router;
