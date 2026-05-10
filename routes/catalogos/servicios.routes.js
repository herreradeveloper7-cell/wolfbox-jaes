import express from "express";
import {
  crearServicio,
  obtenerServicios,
  actualizarServicio,
  eliminarServicio,
  obtenerServicioPorId
} from "../../controllers/catalogos/servicios.controller.js";

const router = express.Router();

router.get("/", obtenerServicios);
router.get("/:id", obtenerServicioPorId);

router.post("/", crearServicio);

router.put("/:id", actualizarServicio);

router.delete("/:id", eliminarServicio);

export default router;
