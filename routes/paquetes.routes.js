import express from "express";

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
  generarPDFEtiqueta
} from "../controllers/paquetes.controller.js";

const router = express.Router();

router.post("/registrar", registrarPaquete);

router.get("/", obtenerPaquetes);

router.put("/editar/:id", editarPaquete);
router.put("/editar-basico/:id", editarCamposBasicos);

router.post("/buscar", buscarPaquetesFiltrados);
router.get("/reporte", generarReporteCSV);

router.get("/tracking/hawb/:hawb", obtenerPaquetePorHAWB);
router.post("/tracking/estado", crearEstadoTracking);   
router.put("/tracking/estado/historial/:id", editarEstadoHistorial);
router.delete("/tracking/estado/historial/:id", eliminarEstadoTracking);

router.get("/validar/tracking/:valor", validarTracking);
router.get("/validar/referencia/:valor", validarReferencia);
router.get("/catalogo-estados", obtenerCatalogoEstados);
router.get("/pdf/:hawb", generarPDFEtiqueta);

router.get("/por-cliente/:referencia", obtenerPaquetesPorCliente);

router.put("/anular/:hawb", anularGuia);

export default router;
