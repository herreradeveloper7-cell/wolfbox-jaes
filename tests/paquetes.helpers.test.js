import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDeclaracionValor,
  normalizeResponsable,
  optionalIntOrZero,
  sqlStringOrNull,
} from "../utils/paquetes.helpers.js";

test("normalizeDeclaracionValor siempre entrega string o null para SQL NVarChar", () => {
  assert.equal(normalizeDeclaracionValor(125000), "125000");
  assert.equal(normalizeDeclaracionValor("125000"), "125000");
  assert.equal(normalizeDeclaracionValor(""), null);
  assert.equal(normalizeDeclaracionValor(undefined), null);
  assert.equal(normalizeDeclaracionValor(null), null);
});

test("sqlStringOrNull evita undefined en parametros NVarChar", () => {
  assert.equal(sqlStringOrNull("Notas"), "Notas");
  assert.equal(sqlStringOrNull(123), "123");
  assert.equal(sqlStringOrNull(""), null);
  assert.equal(sqlStringOrNull(undefined), null);
});

test("optionalIntOrZero normaliza dimensiones opcionales", () => {
  assert.equal(optionalIntOrZero("12"), 12);
  assert.equal(optionalIntOrZero(7), 7);
  assert.equal(optionalIntOrZero(""), 0);
  assert.equal(optionalIntOrZero(undefined), 0);
  assert.equal(optionalIntOrZero("abc"), 0);
});

test("normalizeResponsable usa valor por defecto para historial", () => {
  assert.equal(normalizeResponsable("Maria"), "Maria");
  assert.equal(normalizeResponsable("  "), "Usuario del sistema");
  assert.equal(normalizeResponsable(undefined), "Usuario del sistema");
});
