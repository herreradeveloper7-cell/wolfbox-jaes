import express from "express";
import {   crearDestinatario,
        listarDestinatarios,
        eliminarDestinatario,
        editarDestinatario,
        obtenerDestinatariosPorCliente
    } from "../controllers/destinatarios.controller.js";

const router = express.Router();

router.get("/por-cliente/:codigoCasillero", obtenerDestinatariosPorCliente);


router.post("/crear", crearDestinatario);
router.get("/:cliente_id", listarDestinatarios);
router.put("/:id", editarDestinatario);
router.delete("/:id", eliminarDestinatario);



export default router;
