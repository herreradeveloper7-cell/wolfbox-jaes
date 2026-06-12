import express from "express";
import multer from "multer";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { promocionesSchemas } from "../validators/api.schemas.js";
import {
  actualizarPromocion,
  crearPromocion,
  eliminarPromocion,
  listarPromocionesActivas,
  listarPromocionesAdmin,
} from "../controllers/promociones.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const permitidos = new Set(["image/jpeg", "image/webp"]);
    return permitidos.has(file.mimetype) ? cb(null, true) : cb(new Error("Solo se permiten imágenes JPG, JPEG o WEBP."));
  },
});

const cargarImagen = (req, res, next) => upload.single("imagen")(req, res, (error) => {
  if (!error) return next();
  return res.status(400).json({ ok: false, mensaje: error.message || "Imagen no válida" });
});

router.use(autenticarToken);
router.get("/activas", autorizarRoles("admin", "usuario", "cliente"), listarPromocionesActivas);
router.get("/", autorizarRoles("admin"), validar({ query: promocionesSchemas.listar }), listarPromocionesAdmin);
router.post("/", autorizarRoles("admin"), cargarImagen, validar({ body: promocionesSchemas.guardar }), crearPromocion);
router.put("/:id", autorizarRoles("admin"), cargarImagen, validar({ params: promocionesSchemas.id, body: promocionesSchemas.guardar }), actualizarPromocion);
router.delete("/:id", autorizarRoles("admin"), validar({ params: promocionesSchemas.id }), eliminarPromocion);

export default router;
