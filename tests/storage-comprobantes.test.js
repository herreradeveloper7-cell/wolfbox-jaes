import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("Azure ResourceNotFound se comunica como almacenamiento no disponible", () => {
  const storage = readSource("../utils/storage.service.js");

  assert.match(storage, /error\?\.code === "ResourceNotFound"/);
  assert.match(storage, /error\.code = "STORAGE_UNAVAILABLE"/);
  assert.match(storage, /error\.statusCode = 503/);
  assert.match(storage, /await containerClient\.createIfNotExists\(\)/);
});

test("reemplazar comprobante conserva el anterior hasta persistir el nuevo", () => {
  for (const relativePath of [
    "../controllers/solicitudes.controller.js",
    "../controllers/conciliacion.controller.js",
  ]) {
    const controller = readSource(relativePath);
    const inicio = controller.indexOf("export const subirComprobante");
    const actualizacion = controller.indexOf("UPDATE solicitudes", inicio);
    const persistido = controller.indexOf("comprobantePersistido = true", actualizacion);
    const eliminacionAnterior = controller.indexOf(
      "if (comprobanteActual && comprobanteActual !== rutaArchivo)",
      persistido
    );

    assert.ok(actualizacion > inicio);
    assert.ok(persistido > actualizacion);
    assert.ok(eliminacionAnterior > persistido);
  }
});
