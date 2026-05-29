import express from "express";
import { autenticarToken, autorizarPermisos, autorizarRoles } from "../../middleware/auth.middleware.js";
import {
  crearServicio,
  obtenerServicios,
  actualizarServicio,
  eliminarServicio,
  obtenerServicioPorId
} from "../../controllers/catalogos/servicios.controller.js";

const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const configuracion = autorizarPermisos("Configuracion");
const autenticados = autorizarRoles("admin", "usuario", "cliente");

router.use(autenticarToken);

router.get("/", autenticados, obtenerServicios);
router.get("/:id", autenticados, obtenerServicioPorId);

router.post("/", configuracion, crearServicio);

router.put("/:id", configuracion, actualizarServicio);

router.delete("/:id", configuracion, eliminarServicio);

export default router;
