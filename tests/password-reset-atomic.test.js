import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const fuente = readFileSync(
  new URL("../controllers/auth.controller.js", import.meta.url),
  "utf8"
);

const funcionReset = fuente.slice(
  fuente.indexOf("export const confirmarRecuperacionPassword"),
  fuente.length
);

test("SEC-011 consume el token dentro de una transaccion serializable", () => {
  assert.match(funcionReset, /transaction\.begin\(sql\.ISOLATION_LEVEL\.SERIALIZABLE\)/);
  assert.match(funcionReset, /password_reset_tokens WITH \(UPDLOCK, HOLDLOCK\)/);
  assert.match(funcionReset, /WHERE id = @id\s+AND usado = 0\s+AND expira_en > SYSUTCDATETIME\(\)/s);
  assert.match(funcionReset, /consumo\.rowsAffected\[0\] !== 1/);
});

test("SEC-011 cambia password, consume token y revoca sesiones en la misma transaccion", () => {
  const commit = funcionReset.indexOf("await transaction.commit()");
  const cambioPassword = funcionReset.indexOf("UPDATE usuarios");
  const consumoToken = funcionReset.indexOf("UPDATE password_reset_tokens");
  const revocacion = funcionReset.indexOf("UPDATE sesiones_autenticacion");

  assert.ok(cambioPassword > 0 && cambioPassword < commit);
  assert.ok(consumoToken > cambioPassword && consumoToken < commit);
  assert.ok(revocacion > consumoToken && revocacion < commit);
});

test("SEC-011 revierte la transaccion ante cualquier error", () => {
  assert.match(funcionReset, /if \(transactionStarted\)[\s\S]*await transaction\.rollback\(\)/);
});

test("SEC-011 notifica el cambio solo despues de confirmar la transaccion", () => {
  const commit = funcionReset.indexOf("await transaction.commit()");
  const notificacion = funcionReset.indexOf('evento: "password_actualizada"');
  assert.ok(commit > 0 && notificacion > commit);
});
