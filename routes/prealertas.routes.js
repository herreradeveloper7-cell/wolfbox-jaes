import express from "express";
import { autenticarToken, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { prealertaSchemas } from "../validators/api.schemas.js";
import { actualizarPrealerta, crearPrealerta, eliminarPrealerta, listarPrealertas } from "../controllers/prealertas.controller.js";

const router = express.Router();

const autorizarPrealertas = (req, res, next) => {
  if (req.usuario?.tipo === "cliente") return next();
  return autorizarPermisos("Casilleros")(req, res, next);
};

router.use(autenticarToken, autorizarRoles("admin", "usuario", "cliente"));
router.use(autorizarPrealertas);

router.get("/", validar({ query: prealertaSchemas.listar }), listarPrealertas);
router.post("/", validar({ body: prealertaSchemas.crear }), crearPrealerta);
router.put("/:id", validar({ params: prealertaSchemas.id, body: prealertaSchemas.actualizar }), actualizarPrealerta);
router.delete("/:id", validar({ params: prealertaSchemas.id }), eliminarPrealerta);

export default router;
