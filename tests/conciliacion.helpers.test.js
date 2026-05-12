import test from "node:test";
import assert from "node:assert/strict";
import { buildConciliacionQuery } from "../utils/conciliacion.helpers.js";

test("buildConciliacionQuery sin filtros conserva consulta base ordenada", () => {
  const { query, inputs } = buildConciliacionQuery();

  assert.match(query, /FROM solicitudes s/);
  assert.match(query, /ORDER BY s\.fecha DESC/);
  assert.deepEqual(inputs, []);
});

test("buildConciliacionQuery agrega filtros parametrizados", () => {
  const { query, inputs } = buildConciliacionQuery({
    fechaInicio: "2026-01-01",
    fechaFin: "2026-01-31",
    cliente: "COABC",
    solicitud: "55",
  });

  assert.match(query, /@fechaInicio/);
  assert.match(query, /@fechaFin/);
  assert.match(query, /LIKE @cliente/);
  assert.match(query, /s\.id = @solicitud/);
  assert.deepEqual(inputs, [
    { name: "fechaInicio", type: "Date", value: "2026-01-01" },
    { name: "fechaFin", type: "Date", value: "2026-01-31" },
    { name: "cliente", type: "VarChar", value: "%COABC%" },
    { name: "solicitud", type: "Int", value: "55" },
  ]);
});

test("buildConciliacionQuery no interpola texto de cliente en SQL", () => {
  const intentoInyeccion = "'; DROP TABLE solicitudes; --";
  const { query, inputs } = buildConciliacionQuery({ cliente: intentoInyeccion });

  assert.equal(query.includes(intentoInyeccion), false);
  assert.equal(inputs[0].value, `%${intentoInyeccion}%`);
});
