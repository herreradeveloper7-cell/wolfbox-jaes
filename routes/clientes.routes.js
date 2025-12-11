import express from 'express';
import { 
    registrarCliente, 
    validarClienteExistente, 
    loginCliente,
    actualizarPerfilCliente, 
    buscarCliente,
    buscarClienteDestinatarios
} from '../controllers/clientes.controller.js';


const router = express.Router();

router.get("/buscar/:valor", buscarCliente);
router.get("/buscar-destinatarios/:texto", buscarClienteDestinatarios);



router.post('/validar', validarClienteExistente);
router.post('/', registrarCliente);
router.post('/login', loginCliente);
router.put("/actualizar-perfil", actualizarPerfilCliente);

 

export default router;
