import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("el interceptor fetch no reconstruye FormData con una frontera multipart distinta", () => {
  const source = readFileSync(
    new URL("../frontend-wolfbox/src/api/http.ts", import.meta.url),
    "utf8"
  );

  const construccionFinal = source.match(/return new Request\(base, \{([\s\S]*?)\n\s*\}\);/)?.[1] || "";
  assert.doesNotMatch(construccionFinal, /\.\.\.init/);
  assert.match(construccionFinal, /headers: withAuthHeaders/);
});

test("las cargas FormData dejan que el navegador genere Content-Type y boundary", () => {
  const solicitudes = readFileSync(
    new URL("../frontend-wolfbox/src/pages/SolicitarDespachos.tsx", import.meta.url),
    "utf8"
  );
  const conciliacion = readFileSync(
    new URL("../frontend-wolfbox/src/pages/usuario/ConciliacionPagos.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(solicitudes, /Content-Type["']?:\s*["']multipart\/form-data/);
  assert.doesNotMatch(conciliacion, /Content-Type["']?:\s*["']multipart\/form-data/);
});
