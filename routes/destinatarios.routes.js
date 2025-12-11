import express from "express";
import { crearDestinatario,
        listarDestinatarios,
        eliminarDestinatario,
        editarDestinatario
    } from "../controllers/destinatarios.controller.js";

const router = express.Router();

router.post("/crear", crearDestinatario);
router.get("/:cliente_id", listarDestinatarios);

router.put("/:id", editarDestinatario);


router.delete("/:id", eliminarDestinatario);



export default router;
