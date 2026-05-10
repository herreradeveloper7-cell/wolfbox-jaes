  import express from "express";
  import multer from "multer";
  import path from "path";
  import { fileURLToPath } from "url";

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
    generarEtiquetaHawbPadre
  } from "../controllers/solicitudes.controller.js";

  console.log("📌 Ruta /api/solicitudes cargada correctamente");

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

  router.post("/crear", crearSolicitud);
  router.get("/listar", obtenerSolicitudes);
  router.get("/detalle/:id", obtenerDetalleSolicitud);

  router.get("/pdf-data/:id", obtenerDatosPDFSolicitud);

  router.put("/estado/:id", actualizarEstadoSolicitud);
  router.delete("/eliminar/:id", eliminarSolicitud);
  router.put("/editar/:id", editarSolicitudCompleta);

  router.get("/cargos/:id", obtenerCargosAdicionales);
  router.get("/catalogo/cargos", obtenerCatalogoCargos);
  router.post("/cargos/:id", agregarCargoAdicional);

  router.put("/paquete/actualizar/:paquete_id", actualizarPaqueteSolicitud);
  router.put("/paquete/remover/:paquete_id", removerPaqueteDeSolicitud);
  router.put("/paquete/agregar/:solicitud_id", agregarPaqueteASolicitud);

  router.post("/agrupar/:id", agruparSolicitud);

  router.post(
    "/comprobante/:id",
    upload.single("comprobante"),
    subirComprobantePago
  );

  router.get("/comprobante/:id", obtenerComprobantePago);
  router.get("/etiqueta/:hawbPadre", generarEtiquetaHawbPadre);

  router.delete("/comprobante/:id", eliminarComprobantePago);

  export default router;
