import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createMockResponse, createNext } from "./helpers/mockExpress.js";
import { createSequentialPool } from "./helpers/mockDb.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
const { __setPoolPromiseForTests } = await import("../config/db.js");
const {
  autenticarToken,
  autorizarClientePropio,
  autorizarRoles,
  firmarToken,
} = await import("../middleware/auth.middleware.js");

test("firmarToken y autenticarToken aceptan una sesion vigente", async () => {
  const sid = "9f4467bc-1634-469f-850c-005f04ea61dc";
  const pool = createSequentialPool([
    { recordset: [{ tipo_cuenta: "usuario", cuenta_id: 7 }] },
    { recordset: [{ tipo_usuario: "admin", estado: "activo" }] },
    { recordset: [{ permiso: "Seguridad" }] },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));
  const token = firmarToken({ id: 7, tipo: "admin", email: "admin@test.com", sid }, "1h");
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockResponse();
  const next = createNext();

  await autenticarToken(req, res, next);

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

test("autenticarToken invalida inmediatamente la sesion de un cliente inhabilitado", async () => {
  const pool = createSequentialPool([
    { recordset: [{ tipo_cuenta: "cliente", cuenta_id: 20 }] },
    { recordset: [{ estado: "inhabilitado" }] },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));
  const token = firmarToken({
    id: 20,
    tipo: "cliente",
    sid: "439901e6-b0ce-411a-b66d-d6bd29eab682",
  }, "1h");
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createMockResponse();
  const next = createNext();

  await autenticarToken(req, res, next);

  assert.equal(next.called, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /inhabilitada/i);
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
