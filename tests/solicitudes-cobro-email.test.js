import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("el estado del cobro por email se persiste solo despues del envio", () => {
  const controller = readSource("../controllers/solicitudes.controller.js");
  const inicio = controller.indexOf("export const enviarCobroSolicitud");
  const envio = controller.indexOf("await enviarEmailDesdePlantilla", inicio);
  const persistencia = controller.indexOf(
    "SET cobro_email_enviado_en = SYSUTCDATETIME()",
    inicio
  );

  assert.ok(envio > inicio, "Debe enviar el correo desde el controlador de cobro");
  assert.ok(
    persistencia > envio,
    "Debe marcar la solicitud unicamente despues de enviar el correo"
  );
  assert.match(controller, /s\.cobro_email_enviado_en/);
});

test("la migracion agrega una fecha de envio opcional a solicitudes", () => {
  const migration = readSource(
    "../migrations/20260828_solicitudes_cobro_email.sql"
  );

  assert.match(
    migration,
    /COL_LENGTH\(N'dbo\.solicitudes', N'cobro_email_enviado_en'\)/
  );
  assert.match(migration, /ADD cobro_email_enviado_en DATETIME2 NULL/);
});

test("la tabla de solicitudes muestra el indicador de cobro a todos", () => {
  const table = readSource(
    "../frontend-wolfbox/src/components/solicitudes/SolicitudesRealizadasTabla.tsx"
  );

  assert.match(table, />Cobro<\/th>/);
  assert.match(table, /Boolean\(s\.cobro_email_enviado_en\)/);
  assert.match(table, /Cobro enviado al correo del cliente/);
  assert.match(table, /Cobro pendiente de enviar al cliente/);
});
