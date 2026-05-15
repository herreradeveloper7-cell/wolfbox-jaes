import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readRoute = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

const assertProtectedAfterRouterUse = (source, protectedRouteSnippet) => {
  const authIndex = source.indexOf("router.use(autenticarToken");
  const routeIndex = source.indexOf(protectedRouteSnippet);

  assert.ok(authIndex >= 0, "La ruta debe declarar router.use(autenticarToken)");
  assert.ok(routeIndex >= 0, `No se encontro ${protectedRouteSnippet}`);
  assert.ok(
    authIndex < routeIndex,
    `${protectedRouteSnippet} debe quedar despues de router.use(autenticarToken)`
  );
};

test("rutas criticas declaran autenticacion antes de endpoints protegidos", () => {
  const paquetes = readRoute("../routes/paquetes.routes.js");
  const solicitudes = readRoute("../routes/solicitudes.routes.js");
  const conciliacion = readRoute("../routes/conciliacion.routes.js");
  const trm = readRoute("../routes/trm.routes.js");
  const dashboard = readRoute("../routes/dashboard.routes.js");
  const despachos = readRoute("../routes/despachos.routes.js");

  assertProtectedAfterRouterUse(paquetes, 'router.post("/registrar"');
  assertProtectedAfterRouterUse(paquetes, 'router.put("/anular/:hawb"');
  assertProtectedAfterRouterUse(paquetes, 'router.post("/tracking/estado"');
  assertProtectedAfterRouterUse(solicitudes, 'router.post("/crear"');
  assertProtectedAfterRouterUse(solicitudes, 'router.put("/editar/:id"');
  assertProtectedAfterRouterUse(solicitudes, 'router.post("/agrupar/:id"');
  assertProtectedAfterRouterUse(conciliacion, 'router.put("/autorizar/:id"');
  assertProtectedAfterRouterUse(trm, 'router.post("/"');
  assertProtectedAfterRouterUse(dashboard, 'router.get("/usuario"');
  assertProtectedAfterRouterUse(despachos, 'router.post("/"');
  assertProtectedAfterRouterUse(despachos, 'router.post("/:id/hawbs"');
});

test("rutas administrativas criticas declaran restricciones por rol", () => {
  const conciliacion = readRoute("../routes/conciliacion.routes.js");
  const trm = readRoute("../routes/trm.routes.js");
  const paquetes = readRoute("../routes/paquetes.routes.js");
  const solicitudes = readRoute("../routes/solicitudes.routes.js");
  const dashboard = readRoute("../routes/dashboard.routes.js");
  const despachos = readRoute("../routes/despachos.routes.js");

  assert.match(conciliacion, /router\.use\(autenticarToken,\s*soloOperacion\)/);
  assert.match(trm, /const soloAdmin = autorizarRoles\("admin"\)/);
  assert.match(paquetes, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(solicitudes, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(dashboard, /autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(despachos, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
});
