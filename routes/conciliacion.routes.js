import express from "express";
import multer from "multer";
import {
  buscarConciliacion,
  autorizarSolicitud,
  quitarAutorizacionSolicitud,
  subirComprobante // 👈 IMPORTANTE
} from "../controllers/conciliacion.controller.js";

const router = express.Router();


// 📁 CONFIGURACIÓN DE MULTER
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/comprobantes"); // 👈 carpeta donde se guardan
  },
  filename: (req, file, cb) => {
    const nombre = Date.now() + "-" + file.originalname;
    cb(null, nombre);
  }
});

const upload = multer({ storage });


// 🔎 CONSULTA
router.get("/", buscarConciliacion);

// 🔐 AUTORIZACIÓN
router.put("/autorizar/:id", autorizarSolicitud);
router.put("/quitar-autorizacion/:id", quitarAutorizacionSolicitud);

// 📤 SUBIR COMPROBANTE (NUEVO)
router.post(
  "/subir-comprobante/:id",
  upload.single("comprobante"),
  subirComprobante
);

export default router;