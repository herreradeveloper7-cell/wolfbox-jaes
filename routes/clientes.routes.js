import express from 'express';
import { autenticarToken, autorizarClientePropio, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { clienteSchemas, idParam, textParam } from "../validators/api.schemas.js";
import { 
    registrarCliente, 
    validarClienteExistente, 
    loginCliente,
    actualizarPerfilCliente, 
    buscarCliente,
    buscarClienteDestinatarios,
    actualizarClienteAdmin,
    reporteClientesCasilleros,
} from '../controllers/clientes.controller.js';


const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const soloOperacion = autorizarRoles("admin", "usuario");

router.post('/validar', validar({ body: clienteSchemas.validar }), validarClienteExistente);
router.post('/', validar({ body: clienteSchemas.registrar }), registrarCliente);
router.post('/login', validar({ body: clienteSchemas.login }), loginCliente);

router.use(autenticarToken);

router.get("/reporte-casilleros", soloAdmin, validar({ query: clienteSchemas.reporteCasilleros }), reporteClientesCasilleros);
router.get("/buscar/:valor", soloOperacion, validar({ params: textParam("valor") }), buscarCliente);
router.get("/buscar-destinatarios/:texto", soloOperacion, validar({ params: textParam("texto") }), buscarClienteDestinatarios);
router.put(
  "/actualizar-perfil",
  autorizarRoles("cliente"),
  validar({ body: clienteSchemas.actualizarPerfil }),
  autorizarClientePropio((req) => req.body.id),
  actualizarPerfilCliente
);
router.put("/:id", soloOperacion, validar({ params: idParam(), body: clienteSchemas.actualizarAdmin }), actualizarClienteAdmin);

 

export default router;
