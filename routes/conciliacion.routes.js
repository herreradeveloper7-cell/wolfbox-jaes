import express from "express";
import multer from "multer";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { azureStorageDisponible } from "../utils/storage.service.js";
import {
  buscarConciliacion,
  autorizarSolicitud,
  quitarAutorizacionSolicitud,
  subirComprobante,
  descargarComprobante,
} from "../controllers/conciliacion.controller.js";

const router = express.Router();
const soloOperacion = autorizarRoles("admin", "usuario");
const comprobantesDir = "uploads/comprobantes";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, comprobantesDir);
  },
  filename: (req, file, cb) => {
    const limpio = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${Date.now()}-${limpio}`);
  },
});

const tiposPermitidos = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const upload = multer({
  storage: azureStorageDisponible() ? multer.memoryStorage() : storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (tiposPermitidos.has(file.mimetype)) {
      return cb(null, true);
    }

    return cb(new Error("Solo se permiten archivos JPG, PNG o PDF."));
  },
});

router.use(autenticarToken, soloOperacion);

router.get("/", buscarConciliacion);
router.put("/autorizar/:id", autorizarSolicitud);
router.put("/quitar-autorizacion/:id", quitarAutorizacionSolicitud);
router.get("/comprobante/:id", descargarComprobante);

router.post(
  "/subir-comprobante/:id",
  (req, res, next) => {
    upload.single("comprobante")(req, res, (error) => {
      if (!error) return next();

      return res.status(400).json({
        mensaje: error.message || "Archivo no valido.",
      });
    });
  },
  subirComprobante
);

export default router;
