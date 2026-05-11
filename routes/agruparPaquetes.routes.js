import express from "express";
import { obtenerSolicitudesAgrupables, obtenerPuntosControl, obtenerDetalleSolicitudAgrupar, obtenerOficinas  } from "../controllers/agruparPaquetes.controller.js";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";


const router = express.Router();
const soloOperacion = autorizarRoles("admin", "usuario");

router.use(autenticarToken, soloOperacion);

router.get("/puntos-control", obtenerPuntosControl);
router.get("/oficinas", obtenerOficinas);
router.get("/solicitudes", obtenerSolicitudesAgrupables);
router.get("/solicitud/:id", obtenerDetalleSolicitudAgrupar);



export default router;
