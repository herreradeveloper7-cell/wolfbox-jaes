import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { crearCargaSegura } from "../utils/secure-upload.js";
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

const cargarComprobanteSeguro = crearCargaSegura({
  campo: "comprobante",
  formatosPermitidos: ["jpeg", "png", "pdf"],
  maxBytes: 8 * 1024 * 1024,
  directorioLocal: comprobantesDir,
  mensajeInvalido: "El archivo no es un JPG, PNG o PDF valido.",
});

router.use(autenticarToken, soloOperacion);

router.get("/", buscarConciliacion);
router.put("/autorizar/:id", autorizarSolicitud);
router.put("/quitar-autorizacion/:id", quitarAutorizacionSolicitud);
router.get("/comprobante/:id", descargarComprobante);

router.post(
  "/subir-comprobante/:id",
  cargarComprobanteSeguro,
  subirComprobante
);

export default router;
