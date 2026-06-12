  import express from "express";
  import multer from "multer";
  import path from "path";
  import { fileURLToPath } from "url";
  import { autenticarToken, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
  import { validar } from "../middleware/validate.middleware.js";
  import { azureStorageDisponible } from "../utils/storage.service.js";
  import { poolPromise, sql } from "../config/db.js";
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
  const soloCasilleros = autorizarPermisos("Casilleros");
  const autenticados = autorizarRoles("admin", "usuario", "cliente");
  const accesoCasilleros = (req, res, next) => {
    if (req.usuario?.tipo === "cliente") return next();
    return soloCasilleros(req, res, next);
  };
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

    req.body.usuario_id = null;
    return next();
  };
  const autorizarSolicitudPropia = async (req, res, next) => {
    if (["admin", "usuario"].includes(req.usuario?.tipo)) return next();

    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input("solicitud_id", sql.Int, req.params.id)
        .input("cliente_id", sql.Int, req.usuario?.id)
        .query(`
          SELECT TOP 1 id
          FROM solicitudes
          WHERE id = @solicitud_id
            AND cliente_id = @cliente_id
        `);

      if (!result.recordset.length) {
        return res.status(404).json({
          ok: false,
          mensaje: "Solicitud no encontrada",
        });
      }

      return next();
    } catch (error) {
      console.error("Error validando propietario de la solicitud:", error);
      return res.status(500).json({ ok: false, mensaje: "Error validando permisos" });
    }
  };

  router.use(autenticarToken);

  router.post("/crear", autenticados, accesoCasilleros, limitarCreacionCliente, validar({ body: solicitudSchemas.crear }), crearSolicitud);
  router.get("/reporte", soloOperacion, reportes, validar({ query: solicitudSchemas.reporte }), reporteSolicitudes);
  router.get("/listar", autenticados, accesoCasilleros, limitarClienteASuCasillero, obtenerSolicitudes);
  router.get("/detalle/:id", autenticados, accesoCasilleros, validar({ params: idParam() }), autorizarSolicitudPropia, obtenerDetalleSolicitud);

  router.get("/pdf/:id", autenticados, accesoCasilleros, validar({ params: idParam() }), autorizarSolicitudPropia, generarPDFSolicitudCobro);
  router.get("/pdf-data/:id", autenticados, accesoCasilleros, validar({ params: idParam() }), autorizarSolicitudPropia, obtenerDatosPDFSolicitud);
  router.post("/enviar-cobro/:id", soloCasilleros, validar({ params: idParam() }), enviarCobroSolicitud);

  router.put("/estado/:id", soloCasilleros, validar({ params: idParam(), body: solicitudSchemas.estado }), actualizarEstadoSolicitud);
  router.delete("/eliminar/:id", soloCasilleros, validar({ params: idParam() }), eliminarSolicitud);
  router.put("/editar/:id", soloCasilleros, validar({ params: idParam(), body: solicitudSchemas.editarCompleta }), editarSolicitudCompleta);

  router.get("/cargos/:id", autenticados, accesoCasilleros, validar({ params: idParam() }), autorizarSolicitudPropia, obtenerCargosAdicionales);
  router.get("/catalogo/cargos", autenticados, accesoCasilleros, obtenerCatalogoCargos);
  router.post("/cargos/:id", soloCasilleros, validar({ params: idParam(), body: solicitudSchemas.cargo }), agregarCargoAdicional);

  router.put("/paquete/actualizar/:paquete_id", soloCasilleros, validar({ params: idParam("paquete_id"), body: solicitudSchemas.actualizarPaquete }), actualizarPaqueteSolicitud);
  router.put("/paquete/remover/:paquete_id", soloCasilleros, validar({ params: idParam("paquete_id") }), removerPaqueteDeSolicitud);
  router.put("/paquete/agregar/:solicitud_id", soloCasilleros, validar({ params: idParam("solicitud_id"), body: solicitudSchemas.agregarPaquete }), agregarPaqueteASolicitud);

  router.post("/agrupar/:id", soloCasilleros, validar({ params: idParam(), body: solicitudSchemas.agrupar }), agruparSolicitud);

  router.post(
    "/comprobante/:id",
    autenticados,
    accesoCasilleros,
    validar({ params: idParam() }),
    autorizarSolicitudPropia,
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

  router.get("/comprobante/:id", autenticados, accesoCasilleros, validar({ params: idParam() }), autorizarSolicitudPropia, obtenerComprobantePago);
  router.get("/etiqueta/:hawbPadre", soloCasilleros, validar({ params: textParam("hawbPadre") }), generarEtiquetaHawbPadre);

  router.delete("/comprobante/:id", autenticados, accesoCasilleros, validar({ params: idParam() }), autorizarSolicitudPropia, eliminarComprobantePago);

  export default router;
