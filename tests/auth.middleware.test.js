import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  autenticarToken,
  autorizarClientePropio,
  autorizarRoles,
  firmarToken,
} from "../middleware/auth.middleware.js";
import { createMockResponse, createNext } from "./helpers/mockExpress.js";

process.env.JWT_SECRET = "test-secret";

test("firmarToken y autenticarToken aceptan un Bearer token valido", () => {
  const token = firmarToken({ id: 7, tipo: "admin", email: "admin@test.com" }, "1h");
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockResponse();
  const next = createNext();

  autenticarToken(req, res, next);

  assert.equal(next.called, true);
  assert.equal(req.usuario.id, 7);
  assert.equal(req.usuario.tipo, "admin");
});

test("autenticarToken responde 401 si no llega token", () => {
  const req = { headers: {} };
  const res = createMockResponse();
  const next = createNext();

  autenticarToken(req, res, next);

  assert.equal(next.called, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Token de autenticacion requerido");
});

test("autenticarToken responde 401 si el token es invalido", () => {
  const token = jwt.sign({ id: 1, tipo: "admin" }, "otro-secreto");
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockResponse();
  const next = createNext();

  autenticarToken(req, res, next);

  assert.equal(next.called, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Token invalido o expirado");
});

test("autorizarRoles permite roles configurados", () => {
  const req = { usuario: { tipo: "usuario" } };
  const res = createMockResponse();
  const next = createNext();

  autorizarRoles("admin", "usuario")(req, res, next);

  assert.equal(next.called, true);
});

test("autorizarRoles rechaza roles no permitidos", () => {
  const req = { usuario: { tipo: "cliente" } };
  const res = createMockResponse();
  const next = createNext();

  autorizarRoles("admin", "usuario")(req, res, next);

  assert.equal(next.called, false);
  assert.equal(res.statusCode, 403);
});

test("autorizarClientePropio permite cliente con referencia propia y bloquea otra referencia", () => {
  const middleware = autorizarClientePropio((req) => req.params.codigo, "codigoReferencia");

  const reqPermitido = {
    usuario: { tipo: "cliente", codigoReferencia: "COABC123" },
    params: { codigo: "COABC123" },
  };
  const resPermitido = createMockResponse();
  const nextPermitido = createNext();

  middleware(reqPermitido, resPermitido, nextPermitido);
  assert.equal(nextPermitido.called, true);

  const reqBloqueado = {
    usuario: { tipo: "cliente", codigoReferencia: "COABC123" },
    params: { codigo: "COZZZ999" },
  };
  const resBloqueado = createMockResponse();
  const nextBloqueado = createNext();

  middleware(reqBloqueado, resBloqueado, nextBloqueado);
  assert.equal(nextBloqueado.called, false);
  assert.equal(resBloqueado.statusCode, 403);
});
