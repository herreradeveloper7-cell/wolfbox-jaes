import express from "express";
import { autenticarToken, autorizarRoles } from "../middleware/auth.middleware.js";
import { poolPromise, sql } from "../config/db.js";
import { validar } from "../middleware/validate.middleware.js";
import { destinatarioSchemas, idParam, textParam } from "../validators/api.schemas.js";
import {   crearDestinatario,
        listarDestinatarios,
        eliminarDestinatario,
        editarDestinatario,
        obtenerDestinatariosPorCliente
    } from "../controllers/destinatarios.controller.js";

const router = express.Router();
const autenticados = autorizarRoles("admin", "usuario", "cliente");

const autorizarDestinatarioPropio = async (req, res, next) => {
  if (["admin", "usuario"].includes(req.usuario?.tipo)) {
    return next();
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("SELECT cliente_id FROM destinatarios WHERE id = @id");

    const destinatario = result.recordset[0];

    if (!destinatario) {
      return res.status(404).json({ ok: false, msg: "Destinatario no encontrado" });
    }

    if (Number(destinatario.cliente_id) !== Number(req.usuario?.id)) {
      return res.status(403).json({
        ok: false,
        msg: "No puedes modificar destinatarios de otro cliente",
      });
    }

    return next();
  } catch (error) {
    console.error("Error validando propietario del destinatario:", error);
    return res.status(500).json({ ok: false, msg: "Error validando permisos" });
  }
};

router.use(autenticarToken, autenticados);

router.get(
  "/por-cliente/:codigoCasillero",
  validar({ params: textParam("codigoCasillero") }),
  (req, res, next) => {
    if (["admin", "usuario"].includes(req.usuario?.tipo)) return next();
    if (req.params.codigoCasillero === req.usuario?.codigoReferencia) return next();

    return res.status(403).json({
      ok: false,
      msg: "No puedes consultar destinatarios de otro cliente",
    });
  },
  obtenerDestinatariosPorCliente
);

router.post(
  "/crear",
  validar({ body: destinatarioSchemas.crear }),
  (req, res, next) => {
    if (["admin", "usuario"].includes(req.usuario?.tipo)) return next();
    if (Number(req.body.cliente_id) === Number(req.usuario?.id)) return next();

    return res.status(403).json({
      ok: false,
      msg: "No puedes crear destinatarios para otro cliente",
    });
  },
  crearDestinatario
);
router.get(
  "/:cliente_id",
  validar({ params: idParam("cliente_id") }),
  (req, res, next) => {
    if (["admin", "usuario"].includes(req.usuario?.tipo)) return next();
    if (Number(req.params.cliente_id) === Number(req.usuario?.id)) return next();

    return res.status(403).json({
      ok: false,
      msg: "No puedes consultar destinatarios de otro cliente",
    });
  },
  listarDestinatarios
);
router.put("/:id", validar({ params: idParam(), body: destinatarioSchemas.editar }), autorizarDestinatarioPropio, editarDestinatario);
router.delete("/:id", validar({ params: idParam() }), autorizarDestinatarioPropio, eliminarDestinatario);



export default router;
