import express from "express";
import {
  crearUsuario,
  validarEmail,
  obtenerUsuariosSistema,
  obtenerUsuarioPorId,
  editarUsuario,
  eliminarUsuario,
  cambiarEstadoUsuario
} from "../controllers/usuarios.controller.js";

const router = express.Router();

router.get("/listar", obtenerUsuariosSistema);

router.get("/detalle/:id", obtenerUsuarioPorId);

router.post("/crear", crearUsuario);

router.get("/validar-email/:email", validarEmail);

router.put("/editar/:id", editarUsuario);

router.delete("/eliminar/:id", eliminarUsuario);
router.put("/estado/:id", cambiarEstadoUsuario);


export default router;
