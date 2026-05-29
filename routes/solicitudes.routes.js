  import express from "express";
  import multer from "multer";
  import path from "path";
  import { fileURLToPath } from "url";
  import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
  import { validar } from "../middleware/validate.middleware.js";
  import { idParam, solicitudSchemas, textParam } from "../validators/api.schemas.js";

  import {
    crearSolicitud,
    obtenerSolicitudes,
    actualizarEstadoSolicitud,
    eliminarSolicitud,
    obtenerDetalleSolicitud,
    obtenerDatosPDFSolicitud,
    obtenerCargosAdicionales,
    agregarCargoAdicional,
    actualizarPaqueteSolicitud,
    removerPaqueteDeSolicitud,
    agregarPaqueteASolicitud,
    editarSolicitudCompleta,
    obtenerCatalogoCargos,
    subirComprobantePago,
    obtenerComprobantePago,
    eliminarComprobantePago,
    agruparSolicitud,
    generarEtiquetaHawbPadre,
    enviarCobroSolicitud,
    reporteSolicitudes
  } from "../controllers/solicitudes.controller.js";

  const router = express.Router();

  router.get("/pdf-test/:id", (req, res) => {
    return res.json({
      ok: true,
      mensaje: "Ruta pdf-test funcionando",
      id_recibido: req.params.id
    });
  });

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), "uploads/comprobantes/"));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
  });

  const upload = multer({ storage });
  const soloAdmin = autorizarRoles("admin");
  const soloOperacion = autorizarRoles("admin", "usuario");

  router.use(autenticarToken, soloOperacion);

  router.post("/crear", validar({ body: solicitudSchemas.crear }), crearSolicitud);
  router.get("/reporte", soloAdmin, validar({ query: solicitudSchemas.reporte }), reporteSolicitudes);
  router.get("/listar", obtenerSolicitudes);
  router.get("/detalle/:id", validar({ params: idParam() }), obtenerDetalleSolicitud);

  router.get("/pdf-data/:id", validar({ params: idParam() }), obtenerDatosPDFSolicitud);
  router.post("/enviar-cobro/:id", validar({ params: idParam() }), enviarCobroSolicitud);

  router.put("/estado/:id", validar({ params: idParam(), body: solicitudSchemas.estado }), actualizarEstadoSolicitud);
  router.delete("/eliminar/:id", validar({ params: idParam() }), eliminarSolicitud);
  router.put("/editar/:id", validar({ params: idParam(), body: solicitudSchemas.editarCompleta }), editarSolicitudCompleta);

  router.get("/cargos/:id", validar({ params: idParam() }), obtenerCargosAdicionales);
  router.get("/catalogo/cargos", obtenerCatalogoCargos);
  router.post("/cargos/:id", validar({ params: idParam(), body: solicitudSchemas.cargo }), agregarCargoAdicional);

  router.put("/paquete/actualizar/:paquete_id", validar({ params: idParam("paquete_id"), body: solicitudSchemas.actualizarPaquete }), actualizarPaqueteSolicitud);
  router.put("/paquete/remover/:paquete_id", validar({ params: idParam("paquete_id") }), removerPaqueteDeSolicitud);
  router.put("/paquete/agregar/:solicitud_id", validar({ params: idParam("solicitud_id"), body: solicitudSchemas.agregarPaquete }), agregarPaqueteASolicitud);

  router.post("/agrupar/:id", validar({ params: idParam(), body: solicitudSchemas.agrupar }), agruparSolicitud);

  router.post(
    "/comprobante/:id",
    validar({ params: idParam() }),
    upload.single("comprobante"),
    subirComprobantePago
  );

  router.get("/comprobante/:id", validar({ params: idParam() }), obtenerComprobantePago);
  router.get("/etiqueta/:hawbPadre", validar({ params: textParam("hawbPadre") }), generarEtiquetaHawbPadre);

  router.delete("/comprobante/:id", validar({ params: idParam() }), eliminarComprobantePago);

  export default router;
