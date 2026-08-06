import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { redactarParaAuditoria } from "../utils/auditoria.service.js";

test("SEC-009 redacta secretos y contenido binario", () => {
  const limpio = redactarParaAuditoria({
    email: "usuario@example.com",
    password: "NoDebeAparecer",
    refreshToken: "NoDebeAparecer",
    nested: { contrasena: "NoDebeAparecer", valor: 10 },
    archivo: Buffer.from("contenido"),
  });

  assert.equal(limpio.email, "usuario@example.com");
  assert.equal(limpio.password, "[REDACTADO]");
  assert.equal(limpio.refreshToken, "[REDACTADO]");
  assert.equal(limpio.nested.contrasena, "[REDACTADO]");
  assert.equal(limpio.nested.valor, 10);
  assert.equal(limpio.archivo, "[REDACTADO]");
});

test("SEC-009 crea una tabla append-only con trazabilidad completa", () => {
  const migration = readFileSync(
    new URL("../migrations/20260806_sec009_auditoria_eventos.sql", import.meta.url),
    "utf8"
  );
  for (const campo of [
    "request_id", "actor_tipo", "actor_id", "accion", "recurso",
    "datos_antes", "datos_despues", "resultado", "status_http", "ip", "fecha_evento",
  ]) assert.match(migration, new RegExp(`\\b${campo}\\b`));
  assert.match(migration, /ISJSON\(datos_antes\)/);
  assert.match(migration, /BEGIN TRANSACTION/);
});

test("SEC-009 impide lectura, edicion y borrado por la identidad runtime", () => {
  const policy = readFileSync(new URL("../SECURITY_AUDIT_LOG.md", import.meta.url), "utf8");
  assert.match(policy, /DENY SELECT, UPDATE, DELETE/);
  assert.match(policy, /GRANT INSERT/);
  assert.match(policy, /365 dias/);
});

test("SEC-009 instrumenta snapshots en operaciones prioritarias", () => {
  const archivos = [
    "../controllers/trm.controller.js",
    "../controllers/usuarios.controller.js",
    "../controllers/catalogos/servicios.controller.js",
    "../controllers/conciliacion.controller.js",
    "../controllers/solicitudes.controller.js",
    "../controllers/paquetes.controller.js",
  ].map((ruta) => readFileSync(new URL(ruta, import.meta.url), "utf8")).join("\n");

  for (const accion of [
    "crear_trm", "actualizar_usuario", "actualizar_tarifa_servicio",
    "autorizar_pago", "cambiar_estado_solicitud", "anular_guia",
  ]) assert.match(archivos, new RegExp(`accion: "${accion}"`));
});
