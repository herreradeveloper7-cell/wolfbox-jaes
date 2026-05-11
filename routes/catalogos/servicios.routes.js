import express from "express";
import { autenticarToken, autorizarRoles } from "../../middleware/auth.middleware.js";
import {
  crearServicio,
  obtenerServicios,
  actualizarServicio,
  eliminarServicio,
  obtenerServicioPorId
} from "../../controllers/catalogos/servicios.controller.js";

const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const autenticados = autorizarRoles("admin", "usuario", "cliente");

router.use(autenticarToken);

router.get("/", autenticados, obtenerServicios);
router.get("/:id", autenticados, obtenerServicioPorId);

router.post("/", soloAdmin, crearServicio);

router.put("/:id", soloAdmin, actualizarServicio);

router.delete("/:id", soloAdmin, eliminarServicio);

export default router;
