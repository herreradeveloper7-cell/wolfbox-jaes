import express from 'express';
import { autenticarToken, autorizarClientePropio, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { clienteSchemas, idParam, textParam } from "../validators/api.schemas.js";
import {
  limiteBusqueda,
  limiteLogin,
  limiteRegistroPublico,
  limiteReportes,
} from "../config/rate-limit.js";
import { 
    registrarCliente, 
    validarClienteExistente, 
    loginCliente,
    actualizarPerfilCliente, 
    obtenerPerfilCliente,
    buscarCliente,
    buscarClienteDestinatarios,
    actualizarClienteAdmin,
    cambiarEstadoCliente,
    reporteClientesCasilleros,
} from '../controllers/clientes.controller.js';


const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const soloOperacion = autorizarRoles("admin", "usuario");
const casilleros = autorizarPermisos("Casilleros");
const reportes = autorizarPermisos("Reportes");
const seguridad = autorizarPermisos("Seguridad");
router.post('/validar', limiteRegistroPublico, validar({ body: clienteSchemas.validar }), validarClienteExistente);
router.post('/', limiteRegistroPublico, validar({ body: clienteSchemas.registrar }), registrarCliente);
router.post('/login', limiteLogin, validar({ body: clienteSchemas.login }), loginCliente);

router.use(autenticarToken);

router.get("/reporte-casilleros", reportes, limiteReportes, validar({ query: clienteSchemas.reporteCasilleros }), reporteClientesCasilleros);
router.get("/buscar/:valor", casilleros, limiteBusqueda, validar({ params: textParam("valor") }), buscarCliente);
router.get("/buscar-destinatarios/:texto", casilleros, limiteBusqueda, validar({ params: textParam("texto") }), buscarClienteDestinatarios);
router.get("/perfil", autorizarRoles("cliente"), obtenerPerfilCliente);
router.put(
  "/actualizar-perfil",
  autorizarRoles("cliente"),
  validar({ body: clienteSchemas.actualizarPerfil }),
  autorizarClientePropio((req) => req.body.id),
  actualizarPerfilCliente
);
router.put("/:id", casilleros, validar({ params: idParam(), body: clienteSchemas.actualizarAdmin }), actualizarClienteAdmin);
router.patch("/:id/estado", seguridad, validar({ params: idParam(), body: clienteSchemas.estado }), cambiarEstadoCliente);

 

export default router;
