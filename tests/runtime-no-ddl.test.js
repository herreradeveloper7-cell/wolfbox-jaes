import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const archivosJs = (directorio) => readdirSync(directorio).flatMap((nombre) => {
  const ruta = path.join(directorio, nombre);
  if (statSync(ruta).isDirectory()) return archivosJs(ruta);
  return ruta.endsWith(".js") ? [ruta] : [];
});

test("SEC-008 impide DDL en controladores, servicios y middleware de runtime", () => {
  const archivos = ["controllers", "utils", "middleware", "routes"]
    .flatMap((directorio) => archivosJs(path.join(root, directorio)));
  const ddl = /\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|INDEX|VIEW|PROCEDURE|FUNCTION)\b/i;

  for (const archivo of archivos) {
    assert.doesNotMatch(readFileSync(archivo, "utf8"), ddl, `DDL encontrado en ${archivo}`);
  }
});

test("SEC-008 conserva el esquema requerido en una migracion versionada e idempotente", () => {
  const migration = readFileSync(
    path.join(root, "migrations", "20260805_sec008_runtime_schema.sql"),
    "utf8"
  );

  for (const tabla of [
    "password_reset_tokens",
    "plantillas_comunicacion",
    "email_logs",
    "notificaciones",
    "servicio_tarifas_rangos",
    "despachos",
    "despacho_paquetes",
    "prealertas",
    "promociones_tiendas",
  ]) {
    assert.match(migration, new RegExp(`OBJECT_ID\\(N'dbo\\.${tabla}'`));
  }

  assert.match(migration, /SET XACT_ABORT ON/);
  assert.match(migration, /BEGIN TRANSACTION/);
  assert.match(migration, /COMMIT TRANSACTION/);
});
