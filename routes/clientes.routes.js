import express from 'express';
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
const reportes = autorizarPermisos("Reportes");

router.post('/validar', validar({ body: clienteSchemas.validar }), validarClienteExistente);
router.post('/', validar({ body: clienteSchemas.registrar }), registrarCliente);
router.post('/login', validar({ body: clienteSchemas.login }), loginCliente);

router.use(autenticarToken);

router.get("/reporte-casilleros", reportes, validar({ query: clienteSchemas.reporteCasilleros }), reporteClientesCasilleros);
router.get("/buscar/:valor", soloOperacion, validar({ params: textParam("valor") }), buscarCliente);
router.get("/buscar-destinatarios/:texto", soloOperacion, validar({ params: textParam("texto") }), buscarClienteDestinatarios);
router.get("/perfil", autorizarRoles("cliente"), obtenerPerfilCliente);
router.put(
  "/actualizar-perfil",
  autorizarRoles("cliente"),
  validar({ body: clienteSchemas.actualizarPerfil }),
  autorizarClientePropio((req) => req.body.id),
  actualizarPerfilCliente
);
router.put("/:id", soloOperacion, validar({ params: idParam(), body: clienteSchemas.actualizarAdmin }), actualizarClienteAdmin);

 

export default router;
