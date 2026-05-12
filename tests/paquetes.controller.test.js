import test from "node:test";
import assert from "node:assert/strict";
import { createMockResponse } from "./helpers/mockExpress.js";
import { createMockSql } from "./helpers/mockDb.js";

process.env.NODE_ENV = "test";

const { registrarPaqueteConDeps } = await import("../controllers/paquetes.controller.js");

const paqueteBody = {
  tracking: "TRK-001",
  referencia: "",
  tienda: "",
  contenido: "Zapatos",
  peso: 2.5,
  digitado_por: "",
  codigo_referencia: "COABC12345",
  ancho: "",
  alto: "",
  largo: "",
  asegurado: undefined,
  declaracion_valor: 125000,
  ubicacion: "",
  posicion_arancelaria: "",
  agrupado: undefined,
  notas: "",
  servicio_id: 3,
  destinatario_id: 9,
};

test("registrarPaqueteConDeps registra paquete e historial en una transaccion", async () => {
  const mock = createMockSql([
    { recordset: [{ id: 44 }] },
    { recordset: [{ id: 5 }] },
    { rowsAffected: [1] },
    { rowsAffected: [1] },
  ]);
  const res = createMockResponse();

  await registrarPaqueteConDeps(
    { body: paqueteBody },
    res,
    {
      poolPromise: Promise.resolve({}),
      sql: mock.sql,
      generarHAWBUnico: async () => "COJA000000000001",
      validarRestriccionesServicio: async () => ({ ok: true }),
    }
  );

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.hawb, "COJA000000000001");
  assert.equal(mock.transactions[0].begun, true);
  assert.equal(mock.transactions[0].committed, true);
  assert.equal(mock.transactions[0].rolledBack, false);

  const insertPaquete = mock.calls.find((call) => call.queryText.includes("INSERT INTO paquetes"));
  assert.equal(insertPaquete.inputs.declaracion_valor.value, "125000");
  assert.equal(insertPaquete.inputs.tienda.value, null);
  assert.equal(insertPaquete.inputs.ancho.value, 0);

  const insertHistorial = mock.calls.find((call) => call.queryText.includes("INSERT INTO historial_estados"));
  assert.equal(insertHistorial.inputs.responsable.value, "Usuario del sistema");
});

test("registrarPaqueteConDeps revierte si el cliente no existe", async () => {
  const mock = createMockSql([{ recordset: [] }]);
  const res = createMockResponse();

  await registrarPaqueteConDeps(
    { body: paqueteBody },
    res,
    {
      poolPromise: Promise.resolve({}),
      sql: mock.sql,
      generarHAWBUnico: async () => "COJA000000000001",
      validarRestriccionesServicio: async () => ({ ok: true }),
    }
  );

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.mensaje, "Cliente no encontrado");
  assert.equal(mock.transactions[0].rolledBack, true);
  assert.equal(mock.transactions[0].committed, false);
});

test("registrarPaqueteConDeps revierte si el servicio viola restricciones", async () => {
  const mock = createMockSql([{ recordset: [{ id: 44 }] }]);
  const res = createMockResponse();

  await registrarPaqueteConDeps(
    { body: paqueteBody },
    res,
    {
      poolPromise: Promise.resolve({}),
      sql: mock.sql,
      generarHAWBUnico: async () => "COJA000000000001",
      validarRestriccionesServicio: async () => ({
        ok: false,
        status: 400,
        mensaje: "Peso excede el servicio",
      }),
    }
  );

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.mensaje, "Peso excede el servicio");
  assert.equal(mock.transactions[0].rolledBack, true);
  assert.equal(mock.transactions[0].committed, false);
});
