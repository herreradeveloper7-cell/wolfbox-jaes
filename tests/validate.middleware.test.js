import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { validar } from "../middleware/validate.middleware.js";
import { createMockResponse, createNext } from "./helpers/mockExpress.js";

test("validar parsea body, params y query antes de continuar", () => {
  const req = {
    body: { peso: "4.25" },
    params: { id: "8" },
    query: { activo: "true" },
  };
  const res = createMockResponse();
  const next = createNext();

  validar({
    body: z.object({ peso: z.coerce.number() }),
    params: z.object({ id: z.coerce.number().int() }),
    query: z.object({ activo: z.coerce.boolean() }),
  })(req, res, next);

  assert.equal(next.called, true);
  assert.equal(req.body.peso, 4.25);
  assert.equal(req.params.id, 8);
  assert.equal(req.query.activo, true);
});

test("validar responde 400 con errores de Zod", () => {
  const req = {
    body: { nombre: "" },
    params: {},
    query: {},
  };
  const res = createMockResponse();
  const next = createNext();

  validar({
    body: z.object({ nombre: z.string().min(1, "Nombre requerido") }),
  })(req, res, next);

  assert.equal(next.called, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
  assert.equal(res.body.message, "Datos de entrada invalidos");
  assert.equal(res.body.errores[0].campo, "nombre");
});
