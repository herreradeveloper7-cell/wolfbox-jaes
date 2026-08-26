import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const controller = readFileSync(
  new URL("../controllers/paquetes.controller.js", import.meta.url),
  "utf8"
);

test("la búsqueda de paquetes admite el nombre completo del cliente", () => {
  assert.match(controller, /CONCAT_WS\(' ',[\s\S]*c\.primer_nombre[\s\S]*c\.segundo_apellido/);
  assert.match(controller, /STRING_SPLIT\(@clienteTermino, ' '\)/);
});

test("la búsqueda incluye paquetes antiguos vinculados por código de casillero", () => {
  assert.match(
    controller,
    /p\.cliente_id IS NULL AND c\.codigo_referencia = p\.codigo_referencia/
  );
});

test("los límites de fecha comparan solamente la fecha de registro", () => {
  assert.match(controller, /CONVERT\(date, p\.fecha_registro\) >= @fechaDesde/);
  assert.match(controller, /CONVERT\(date, p\.fecha_registro\) <= @fechaHasta/);
});
