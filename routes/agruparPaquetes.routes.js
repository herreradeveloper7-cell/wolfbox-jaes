import express from "express";
import { obtenerSolicitudesAgrupables, obtenerPuntosControl, obtenerDetalleSolicitudAgrupar, obtenerOficinas  } from "../controllers/agruparPaquetes.controller.js";


const router = express.Router();

router.get("/puntos-control", obtenerPuntosControl);
router.get("/oficinas", obtenerOficinas);
router.get("/solicitudes", obtenerSolicitudesAgrupables);
router.get("/solicitud/:id", obtenerDetalleSolicitudAgrupar);



export default router;
