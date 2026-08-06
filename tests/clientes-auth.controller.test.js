import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { createMockResponse } from "./helpers/mockExpress.js";
import { createSequentialPool } from "./helpers/mockDb.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "controller-test-secret";

const { __setPoolPromiseForTests } = await import("../config/db.js");
const { loginCliente, cambiarEstadoCliente } = await import(
  "../controllers/clientes.controller.js"
);

test("loginCliente autentica un cliente activo", async () => {
  const hash = await bcrypt.hash("clave-ok", 4);
  const pool = createSequentialPool([
    {
      recordset: [
        {
          id: 10,
          correo: "activo@test.com",
          contrasena: hash,
          primer_nombre: "Cliente",
          primer_apellido: "Activo",
          codigo_referencia: "JACOACT123",
          estado: "activo",
        },
      ],
    },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = { body: { email: "activo@test.com", contrasena: "clave-ok" } };
  const res = createMockResponse();

  await loginCliente(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
});

test("loginCliente rechaza un cliente inactivo", async () => {
  const hash = await bcrypt.hash("clave-ok", 4);
  const pool = createSequentialPool([
    {
      recordset: [
        {
          id: 11,
          correo: "inactivo@test.com",
          contrasena: hash,
          estado: "inactivo",
        },
      ],
    },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = { body: { email: "inactivo@test.com", contrasena: "clave-ok" } };
  const res = createMockResponse();

  await loginCliente(req, res);

  assert.equal(res.statusCode, 403);
  assert.match(res.body.message, /inhabilitada/i);
});

test("cambiarEstadoCliente actualiza y devuelve el estado persistido", async () => {
  const pool = createSequentialPool([
    { recordset: [{ id: 12, estado: "inhabilitado" }] },
  ]);
  __setPoolPromiseForTests(Promise.resolve(pool));

  const req = { params: { id: "12" }, body: { estado: "inhabilitado" } };
  const res = createMockResponse();

  await cambiarEstadoCliente(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.cliente.estado, "inhabilitado");
  assert.equal(pool.calls[0].inputs.estado.value, "inhabilitado");
});
