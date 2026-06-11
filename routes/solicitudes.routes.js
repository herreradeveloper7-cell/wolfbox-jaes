  import express from "express";
  import multer from "multer";
  import path from "path";
  import { fileURLToPath } from "url";
  import { autenticarToken, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
  import { validar } from "../middleware/validate.middleware.js";
  import { azureStorageDisponible } from "../utils/storage.service.js";
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
    generarPDFSolicitudCobro,
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

  const tiposComprobantePermitidos = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
  ]);

  const upload = multer({
    storage: azureStorageDisponible() ? multer.memoryStorage() : storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (tiposComprobantePermitidos.has(file.mimetype)) {
        return cb(null, true);
      }

      return cb(new Error("Solo se permiten archivos JPG, PNG o PDF."));
    },
  });
  const soloAdmin = autorizarRoles("admin");
  const soloOperacion = autorizarRoles("admin", "usuario");
  const autenticados = autorizarRoles("admin", "usuario", "cliente");
  const reportes = autorizarPermisos("Reportes");
  const limitarClienteASuCasillero = (req, res, next) => {
    if (req.usuario?.tipo !== "cliente") return next();

    req.query.codigo = req.usuario.codigoReferencia;
    return next();
  };
  const limitarCreacionCliente = (req, res, next) => {
    if (req.usuario?.tipo !== "cliente") return next();

    if (Number(req.body?.cliente_id) !== Number(req.usuario.id)) {
      return res.status(403).json({
        ok: false,
        mensaje: "No puedes crear solicitudes para otro cliente",
      });
    }

    return next();
  };

  router.use(autenticarToken);

  router.post("/crear", autenticados, limitarCreacionCliente, validar({ body: solicitudSchemas.crear }), crearSolicitud);
  router.get("/reporte", soloOperacion, reportes, validar({ query: solicitudSchemas.reporte }), reporteSolicitudes);
  router.get("/listar", autenticados, limitarClienteASuCasillero, obtenerSolicitudes);
  router.get("/detalle/:id", autenticados, validar({ params: idParam() }), obtenerDetalleSolicitud);

  router.get("/pdf/:id", autenticados, validar({ params: idParam() }), generarPDFSolicitudCobro);
  router.get("/pdf-data/:id", autenticados, validar({ params: idParam() }), obtenerDatosPDFSolicitud);
  router.post("/enviar-cobro/:id", soloOperacion, validar({ params: idParam() }), enviarCobroSolicitud);

  router.put("/estado/:id", soloOperacion, validar({ params: idParam(), body: solicitudSchemas.estado }), actualizarEstadoSolicitud);
  router.delete("/eliminar/:id", soloOperacion, validar({ params: idParam() }), eliminarSolicitud);
  router.put("/editar/:id", soloOperacion, validar({ params: idParam(), body: solicitudSchemas.editarCompleta }), editarSolicitudCompleta);

  router.get("/cargos/:id", autenticados, validar({ params: idParam() }), obtenerCargosAdicionales);
  router.get("/catalogo/cargos", autenticados, obtenerCatalogoCargos);
  router.post("/cargos/:id", soloOperacion, validar({ params: idParam(), body: solicitudSchemas.cargo }), agregarCargoAdicional);

  router.put("/paquete/actualizar/:paquete_id", soloOperacion, validar({ params: idParam("paquete_id"), body: solicitudSchemas.actualizarPaquete }), actualizarPaqueteSolicitud);
  router.put("/paquete/remover/:paquete_id", soloOperacion, validar({ params: idParam("paquete_id") }), removerPaqueteDeSolicitud);
  router.put("/paquete/agregar/:solicitud_id", soloOperacion, validar({ params: idParam("solicitud_id"), body: solicitudSchemas.agregarPaquete }), agregarPaqueteASolicitud);

  router.post("/agrupar/:id", soloOperacion, validar({ params: idParam(), body: solicitudSchemas.agrupar }), agruparSolicitud);

  router.post(
    "/comprobante/:id",
    autenticados,
    validar({ params: idParam() }),
    (req, res, next) => {
      upload.single("comprobante")(req, res, (error) => {
        if (!error) return next();

        return res.status(400).json({
          mensaje: error.message || "Archivo no valido.",
        });
      });
    },
    subirComprobantePago
  );

  router.get("/comprobante/:id", autenticados, validar({ params: idParam() }), obtenerComprobantePago);
  router.get("/etiqueta/:hawbPadre", soloOperacion, validar({ params: textParam("hawbPadre") }), generarEtiquetaHawbPadre);

  router.delete("/comprobante/:id", autenticados, validar({ params: idParam() }), eliminarComprobantePago);

  export default router;
