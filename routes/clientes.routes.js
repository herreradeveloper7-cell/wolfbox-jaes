import express from 'express';
import { 
    registrarCliente, 
    validarClienteExistente, 
    loginCliente,
    actualizarPerfilCliente, 
    buscarCliente,
    buscarClienteDestinatarios,
    actualizarClienteAdmin,
} from '../controllers/clientes.controller.js';


const router = express.Router();

router.get("/buscar/:valor", buscarCliente);
router.get("/buscar-destinatarios/:texto", buscarClienteDestinatarios);



router.post('/validar', validarClienteExistente);
router.post('/', registrarCliente);
router.post('/login', loginCliente);
router.put("/actualizar-perfil", actualizarPerfilCliente);
router.put("/:id", actualizarClienteAdmin);

 

export default router;
