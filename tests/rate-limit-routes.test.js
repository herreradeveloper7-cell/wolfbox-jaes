import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("SEC-006 centraliza los limites y usa Redis cuando REDIS_URL esta disponible", () => {
  const config = readSource("../config/rate-limit.js");

  assert.match(config, /createClient/);
  assert.match(config, /new RedisStore/);
  assert.match(config, /process\.env\.REDIS_URL/);
  assert.match(config, /wolfbox:rl:/);
  assert.match(config, /passOnStoreError: true/);
});

test("SEC-006 protege endpoints publicos sensibles", () => {
  const auth = readSource("../routes/auth.routes.js");
  const clientes = readSource("../routes/clientes.routes.js");
  const paquetes = readSource("../routes/paquetes.routes.js");

  assert.match(auth, /"\/login", limiteLogin/);
  assert.match(auth, /"\/password-reset\/request", limiteRecuperacionPassword/);
  assert.match(auth, /"\/refresh", limiteRenovacionSesion/);
  assert.match(clientes, /'\/validar', limiteRegistroPublico/);
  assert.match(clientes, /'\/login', limiteLogin/);
  assert.match(paquetes, /"\/tracking\/publico\/:hawb",\s*limiteTrackingPublico/);
});

test("SEC-006 protege operaciones costosas autenticadas", () => {
  const index = readSource("../index.js");
  const clientes = readSource("../routes/clientes.routes.js");
  const paquetes = readSource("../routes/paquetes.routes.js");
  const solicitudes = readSource("../routes/solicitudes.routes.js");

  assert.match(index, /app\.use\("\/api", limiteGeneralApi\)/);
  assert.match(index, /app\.get\("\/health\/db", limiteHealthDb/);
  assert.match(clientes, /"\/buscar\/:valor", casilleros, limiteBusqueda/);
  assert.match(paquetes, /"\/reporte", reportes, limiteReportes/);
  assert.match(paquetes, /"\/pdf\/:hawb", soloOperacion, limitePdf/);
  assert.match(solicitudes, /"\/reporte", soloOperacion, reportes, limiteReportes/);
  assert.match(solicitudes, /"\/pdf\/:id", autenticados, accesoCasilleros, limitePdf/);
});
