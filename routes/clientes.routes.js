import express from 'express';
import { rateLimit } from "express-rate-limit";
import { autenticarToken, autorizarClientePropio, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { clienteSchemas, idParam, textParam } from "../validators/api.schemas.js";
import { 
    registrarCliente, 
    validarClienteExistente, 
    loginCliente,
    actualizarPerfilCliente, 
    obtenerPerfilCliente,
    buscarCliente,
    buscarClienteDestinatarios,
    actualizarClienteAdmin,
    reporteClientesCasilleros,
} from '../controllers/clientes.controller.js';


const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const soloOperacion = autorizarRoles("admin", "usuario");
const casilleros = autorizarPermisos("Casilleros");
const reportes = autorizarPermisos("Reportes");
const accesoPublicoLimitado = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, mensaje: "Demasiadas solicitudes. Intenta nuevamente en unos minutos." },
});
const loginLimitado = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { ok: false, mensaje: "Demasiados intentos. Espera unos minutos antes de volver a intentar." },
});

router.post('/validar', accesoPublicoLimitado, validar({ body: clienteSchemas.validar }), validarClienteExistente);
router.post('/', accesoPublicoLimitado, validar({ body: clienteSchemas.registrar }), registrarCliente);
router.post('/login', loginLimitado, validar({ body: clienteSchemas.login }), loginCliente);

router.use(autenticarToken);

router.get("/reporte-casilleros", reportes, validar({ query: clienteSchemas.reporteCasilleros }), reporteClientesCasilleros);
router.get("/buscar/:valor", casilleros, validar({ params: textParam("valor") }), buscarCliente);
router.get("/buscar-destinatarios/:texto", casilleros, validar({ params: textParam("texto") }), buscarClienteDestinatarios);
router.get("/perfil", autorizarRoles("cliente"), obtenerPerfilCliente);
router.put(
  "/actualizar-perfil",
  autorizarRoles("cliente"),
  validar({ body: clienteSchemas.actualizarPerfil }),
  autorizarClientePropio((req) => req.body.id),
  actualizarPerfilCliente
);
router.put("/:id", casilleros, validar({ params: idParam(), body: clienteSchemas.actualizarAdmin }), actualizarClienteAdmin);

 

export default router;
