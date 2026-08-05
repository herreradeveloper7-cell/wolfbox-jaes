import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { promocionesSchemas } from "../validators/api.schemas.js";
import { crearCargaSegura } from "../utils/secure-upload.js";
import {
  actualizarPromocion,
  crearPromocion,
  eliminarPromocion,
  listarPromocionesActivas,
  listarPromocionesAdmin,
} from "../controllers/promociones.controller.js";

const router = express.Router();
const cargarImagen = crearCargaSegura({
  campo: "imagen",
  formatosPermitidos: ["jpeg", "webp"],
  maxBytes: 2 * 1024 * 1024,
  mensajeInvalido: "El archivo no es una imagen JPG, JPEG o WEBP valida.",
});

router.use(autenticarToken);
router.get("/activas", autorizarRoles("admin", "usuario", "cliente"), listarPromocionesActivas);
router.get("/", autorizarRoles("admin"), validar({ query: promocionesSchemas.listar }), listarPromocionesAdmin);
router.post("/", autorizarRoles("admin"), cargarImagen, validar({ body: promocionesSchemas.guardar }), crearPromocion);
router.put("/:id", autorizarRoles("admin"), cargarImagen, validar({ params: promocionesSchemas.id, body: promocionesSchemas.guardar }), actualizarPromocion);
router.delete("/:id", autorizarRoles("admin"), validar({ params: promocionesSchemas.id }), eliminarPromocion);

export default router;
