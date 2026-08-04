import express from "express";
import { rateLimit } from "express-rate-limit";
import { autenticarToken, autorizarClientePropio, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { hawbParam, idParam, paqueteSchemas, textParam } from "../validators/api.schemas.js";

import {
  registrarPaquete,
  obtenerPaquetes,
  generarReporteCSV,
  validarTracking,
  validarReferencia,
  buscarPaquetesFiltrados,
  editarPaquete,
  editarCamposBasicos,
  anularGuia,
  obtenerPaquetesPorCliente, 
  obtenerPaquetePorHAWB,
  eliminarEstadoTracking,
  crearEstadoTracking,
  editarEstadoHistorial,
  obtenerCatalogoEstados,
  generarPDFEtiqueta,
  reporteEstadoGuia
} from "../controllers/paquetes.controller.js";

const router = express.Router();

const consultaTrackingPublicoLimitada = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    ok: false,
    mensaje: "Demasiadas consultas de tracking. Espera unos minutos e intenta nuevamente.",
  },
});

router.get(
  "/tracking/publico/:hawb",
  consultaTrackingPublicoLimitada,
  validar({ params: hawbParam }),
  (req, res, next) => {
    req.consultaTrackingPublica = true;
    return obtenerPaquetePorHAWB(req, res, next);
  }
);

router.use(autenticarToken);

const soloOperacion = autorizarRoles("admin", "usuario");
const soloAdmin = autorizarRoles("admin");
const reportes = autorizarPermisos("Reportes");
const autenticados = autorizarRoles("admin", "usuario", "cliente");

router.get(
  "/tracking/hawb/:hawb",
  soloOperacion,
  validar({ params: hawbParam }),
  obtenerPaquetePorHAWB
);

router.get(
  "/tracking/mio/:hawb",
  autorizarRoles("cliente"),
  validar({ params: hawbParam }),
  obtenerPaquetePorHAWB
);

router.post("/registrar", soloOperacion, validar({ body: paqueteSchemas.registrar }), registrarPaquete);

router.get("/", soloOperacion, obtenerPaquetes);

router.put("/editar/:id", soloOperacion, validar({ params: idParam(), body: paqueteSchemas.editar }), editarPaquete);
router.put("/editar-basico/:id", soloOperacion, validar({ params: idParam(), body: paqueteSchemas.editarBasico }), editarCamposBasicos);

router.post("/buscar", soloOperacion, validar({ body: paqueteSchemas.buscar }), buscarPaquetesFiltrados);
router.get("/reporte-estado-guia", reportes, validar({ query: paqueteSchemas.reporteEstadoGuia }), reporteEstadoGuia);
router.get("/reporte", reportes, generarReporteCSV);

router.post("/tracking/estado", soloOperacion, validar({ body: paqueteSchemas.estadoTracking }), crearEstadoTracking);   
router.put("/tracking/estado/historial/:id", soloOperacion, validar({ params: idParam(), body: paqueteSchemas.editarEstado }), editarEstadoHistorial);
router.delete("/tracking/estado/historial/:id", soloOperacion, validar({ params: idParam() }), eliminarEstadoTracking);

router.get("/validar/tracking/:valor", soloOperacion, validar({ params: textParam("valor") }), validarTracking);
router.get("/validar/referencia/:valor", soloOperacion, validar({ params: textParam("valor") }), validarReferencia);
router.get("/catalogo-estados", soloOperacion, obtenerCatalogoEstados);
router.get("/pdf/:hawb", soloOperacion, validar({ params: textParam("hawb") }), generarPDFEtiqueta);

router.get(
  "/por-cliente/:referencia",
  autenticados,
  (req, res, next) => {
    if (req.usuario?.tipo === "cliente") return next();
    return autorizarPermisos("Casilleros")(req, res, next);
  },
  validar({ params: textParam("referencia") }),
  autorizarClientePropio((req) => req.params.referencia, "codigoReferencia"),
  obtenerPaquetesPorCliente
);

router.put("/anular/:hawb", soloOperacion, validar({ params: textParam("hawb"), body: paqueteSchemas.anular }), anularGuia);

export default router;
