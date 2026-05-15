import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { despachoSchemas, idParam, textParam } from "../validators/api.schemas.js";
import {
  agregarHawbADespacho,
  cambiarEstadoDespacho,
  crearDespacho,
  editarDespacho,
  eliminarDespacho,
  listarDespachos,
  obtenerDetalleDespacho,
  quitarHawbDeDespacho,
} from "../controllers/despachos.controller.js";

const router = express.Router();
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken, soloOperacion);

router.get("/", listarDespachos);
router.post("/", validar({ body: despachoSchemas.crear }), crearDespacho);
router.get("/:id", validar({ params: idParam() }), obtenerDetalleDespacho);
router.put("/:id", validar({ params: idParam(), body: despachoSchemas.editar }), editarDespacho);
router.patch("/:id/estado", validar({ params: idParam(), body: despachoSchemas.estado }), cambiarEstadoDespacho);
router.delete("/:id", validar({ params: idParam() }), eliminarDespacho);
router.post("/:id/hawbs", validar({ params: idParam(), body: despachoSchemas.hawb }), agregarHawbADespacho);
router.delete("/:id/hawbs/:hawb", validar({ params: idParam().merge(textParam("hawb")) }), quitarHawbDeDespacho);

export default router;
