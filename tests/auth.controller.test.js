import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createMockResponse } from "./helpers/mockExpress.js";
import { createSequentialPool } from "./helpers/mockDb.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "controller-test-secret";

const { __setPoolPromiseForTests } = await import("../config/db.js");
const { loginGeneral, renovarSesion, cerrarSesion } = await import("../controllers/auth.controller.js");

test("loginGeneral autentica usuario interno activo y no expone contrasena", async () => {
  const hash = await bcrypt.hash("clave-ok", 4);
  const pool = createSequentialPool([
    {
      recordset: [
        {
          id: 1,
          nombre: "Operador",
          correo: "ops@test.com",
          contrasena: hash,
          tipo_usuario: "usuario",
          genero: "masculino",
          estado: "activo",
          fecha_creacion: "2026-01-01",
        },
      ],
    },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = {
    body: {
      email: "ops@test.com",
      contrasena: "clave-ok",
      mantenerSesion: false,
    },
  };
  const res = createMockResponse();

  await loginGeneral(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.usuario.tipo, "usuario");
  assert.equal("contrasena" in res.body.usuario, false);

  const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(payload.id, 1);
  assert.equal(payload.tipo, "usuario");
  assert.ok(payload.sid);
  assert.ok(payload.exp - payload.iat <= 15 * 60);
  assert.equal(res.cookies.wolfbox_refresh.options.httpOnly, true);
});

test("loginGeneral rechaza usuario interno inhabilitado", async () => {
  const hash = await bcrypt.hash("clave-ok", 4);
  const pool = createSequentialPool([
    {
      recordset: [
        {
          id: 2,
          nombre: "Admin",
          correo: "admin@test.com",
          contrasena: hash,
          tipo_usuario: "admin",
          estado: "inhabilitado",
        },
      ],
    },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = { body: { email: "admin@test.com", contrasena: "clave-ok" } };
  const res = createMockResponse();

  await loginGeneral(req, res);

  assert.equal(res.statusCode, 403);
});

test("loginGeneral autentica cliente cuando no existe usuario interno", async () => {
  const hash = await bcrypt.hash("cliente-ok", 4);
  const pool = createSequentialPool([
    { recordset: [] },
    {
      recordset: [
        {
          id: 30,
          primer_nombre: "Cliente",
          primer_apellido: "Prueba",
          correo: "cliente@test.com",
          contrasena: hash,
          codigo_referencia: "COCLI12345",
          genero: "femenino",
          estado: "activo",
        },
      ],
    },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = {
    body: {
      email: "cliente@test.com",
      contrasena: "cliente-ok",
      mantenerSesion: true,
    },
  };
  const res = createMockResponse();

  await loginGeneral(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.usuario.tipo, "cliente");
  assert.equal(res.body.usuario.codigoReferencia, "COCLI12345");

  const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(payload.tipo, "cliente");
  assert.equal(payload.codigoReferencia, "COCLI12345");
  assert.ok(payload.sid);
  assert.ok(payload.exp - payload.iat <= 15 * 60);
});

test("loginGeneral rechaza cliente inhabilitado aunque la contrasena sea correcta", async () => {
  const hash = await bcrypt.hash("cliente-ok", 4);
  const pool = createSequentialPool([
    { recordset: [] },
    {
      recordset: [
        {
          id: 31,
          correo: "cliente-inactivo@test.com",
          contrasena: hash,
          estado: "inhabilitado",
        },
      ],
    },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = {
    body: { email: "cliente-inactivo@test.com", contrasena: "cliente-ok" },
  };
  const res = createMockResponse();

  await loginGeneral(req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /inhabilitada/i);
});

test("renovarSesion rota la cookie y emite un access token corto", async () => {
  const pool = createSequentialPool([
    {
      recordset: [{
        id: "c2ba4caf-750c-445b-98d3-02751002e405",
        tipo_cuenta: "usuario",
        cuenta_id: 7,
        expira_en: new Date(Date.now() + 8 * 60 * 60 * 1000),
      }],
    },
    {
      recordset: [{
        id: 7,
        nombre: "Operador",
        correo: "ops@test.com",
        tipo_usuario: "usuario",
        estado: "activo",
      }],
    },
    { recordset: [{ permiso: "Casilleros" }] },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = { headers: { cookie: "wolfbox_refresh=token-anterior" } };
  const res = createMockResponse();
  await renovarSesion(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.token);
  assert.notEqual(res.cookies.wolfbox_refresh.value, "token-anterior");
  assert.equal(res.cookies.wolfbox_refresh.options.httpOnly, true);
  const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(payload.sid, "c2ba4caf-750c-445b-98d3-02751002e405");
  assert.ok(payload.exp - payload.iat <= 15 * 60);
});

test("login configura cookie cross-site segura cuando SameSite es none", async () => {
  const anterior = process.env.REFRESH_COOKIE_SAME_SITE;
  process.env.REFRESH_COOKIE_SAME_SITE = "none";
  const hash = await bcrypt.hash("clave-ok", 4);
  const pool = createSequentialPool([
    { recordset: [{
      id: 42,
      correo: "cross-site@test.com",
      contrasena: hash,
      primer_nombre: "Cross",
      primer_apellido: "Site",
      codigo_referencia: "JACOCROSS",
      estado: "activo",
    }] },
    { recordset: [] },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));
  const req = { body: { email: "cross-site@test.com", contrasena: "clave-ok" } };
  const res = createMockResponse();

  const { loginCliente } = await import("../controllers/clientes.controller.js");
  await loginCliente(req, res);

  assert.equal(res.cookies.wolfbox_refresh.options.sameSite, "none");
  assert.equal(res.cookies.wolfbox_refresh.options.secure, true);
  process.env.REFRESH_COOKIE_SAME_SITE = anterior;
});

test("cerrarSesion revoca el refresh token y elimina la cookie", async () => {
  const pool = createSequentialPool([{ recordset: [] }]);
  __setPoolPromiseForTests(Promise.resolve(pool));
  const req = { headers: { cookie: "wolfbox_refresh=token-vigente" } };
  const res = createMockResponse();

  await cerrarSesion(req, res);

  assert.equal(res.statusCode, 204);
  assert.ok(res.clearedCookies.wolfbox_refresh);
  assert.match(pool.calls[0].queryText, /revocada_en/i);
});
