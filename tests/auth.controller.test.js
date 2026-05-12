import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createMockResponse } from "./helpers/mockExpress.js";
import { createSequentialPool } from "./helpers/mockDb.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "controller-test-secret";

const { __setPoolPromiseForTests } = await import("../config/db.js");
const { loginGeneral } = await import("../controllers/auth.controller.js");

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
});
