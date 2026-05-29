import express from "express";
import { autenticarToken, autorizarPermisos, autorizarRoles } from "../middleware/auth.middleware.js";
import { validar } from "../middleware/validate.middleware.js";
import { idParam, textParam, usuarioSchemas } from "../validators/api.schemas.js";
import {
  crearUsuario,
  validarEmail,
  obtenerUsuariosSistema,
  obtenerUsuarioPorId,
  editarUsuario,
  obtenerUsuariosSelect,
  eliminarUsuario,
  cambiarEstadoUsuario,
  buscarUsuarios,
} from "../controllers/usuarios.controller.js";

const router = express.Router();
const soloAdmin = autorizarRoles("admin");
const soloOperacion = autorizarRoles("admin", "usuario");
const seguridad = autorizarPermisos("Seguridad");

router.use(autenticarToken);

router.get("/listar", seguridad, obtenerUsuariosSistema);

router.get("/select", soloOperacion, obtenerUsuariosSelect);

router.get("/detalle/:id", seguridad, validar({ params: idParam() }), obtenerUsuarioPorId);

router.post("/crear", seguridad, validar({ body: usuarioSchemas.crear }), crearUsuario);

router.get("/validar-email/:email", seguridad, validar({ params: textParam("email") }), validarEmail);

router.get("/buscar/:texto", soloOperacion, validar({ params: textParam("texto") }), buscarUsuarios);

router.put("/editar/:id", seguridad, validar({ params: idParam(), body: usuarioSchemas.editar }), editarUsuario);

router.delete("/eliminar/:id", seguridad, validar({ params: idParam() }), eliminarUsuario);
router.put("/estado/:id", seguridad, validar({ params: idParam(), body: usuarioSchemas.estado }), cambiarEstadoUsuario);


export default router;
