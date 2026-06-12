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
  const transportadoras = readRoute("../routes/transportadoras.routes.js");

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
  assertProtectedAfterRouterUse(transportadoras, 'router.get("/"');
});

test("rutas administrativas criticas declaran restricciones por rol", () => {
  const conciliacion = readRoute("../routes/conciliacion.routes.js");
  const trm = readRoute("../routes/trm.routes.js");
  const paquetes = readRoute("../routes/paquetes.routes.js");
  const solicitudes = readRoute("../routes/solicitudes.routes.js");
  const dashboard = readRoute("../routes/dashboard.routes.js");
  const despachos = readRoute("../routes/despachos.routes.js");
  const transportadoras = readRoute("../routes/transportadoras.routes.js");

  assert.match(conciliacion, /router\.use\(autenticarToken,\s*soloOperacion\)/);
  assert.match(trm, /const soloAdmin = autorizarRoles\("admin"\)/);
  assert.match(paquetes, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(solicitudes, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(dashboard, /autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(despachos, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
  assert.match(transportadoras, /const soloOperacion = autorizarRoles\("admin",\s*"usuario"\)/);
});

test("rutas de clientes y solicitudes exigen propiedad o permiso de Casilleros", () => {
  const solicitudes = readRoute("../routes/solicitudes.routes.js");
  const destinatarios = readRoute("../routes/destinatarios.routes.js");
  const clientes = readRoute("../routes/clientes.routes.js");
  const paquetes = readRoute("../routes/paquetes.routes.js");

  assert.match(solicitudes, /const autorizarSolicitudPropia = async/);
  assert.match(solicitudes, /"\/detalle\/:id"[\s\S]*autorizarSolicitudPropia/);
  assert.match(solicitudes, /"\/pdf\/:id"[\s\S]*autorizarSolicitudPropia/);
  assert.match(solicitudes, /"\/comprobante\/:id"[\s\S]*autorizarSolicitudPropia/);
  assert.match(solicitudes, /const soloCasilleros = autorizarPermisos\("Casilleros"\)/);
  assert.match(destinatarios, /autorizarPermisos\("Casilleros"\)/);
  assert.match(clientes, /const casilleros = autorizarPermisos\("Casilleros"\)/);
  assert.match(paquetes, /autorizarClientePropio\(\(req\) => req\.params\.referencia/);
});

test("registro interno y rastreo privado no quedan expuestos publicamente", () => {
  const auth = readRoute("../routes/auth.routes.js");
  const paquetes = readRoute("../routes/paquetes.routes.js");
  const solicitudes = readRoute("../routes/solicitudes.routes.js");

  assert.match(auth, /router\.post\('\/registro', autenticarToken, autorizarRoles\("admin"\)/);
  assert.match(paquetes, /"\/tracking\/mio\/:hawb"[\s\S]*autorizarRoles\("cliente"\)/);
  assert.doesNotMatch(solicitudes, /pdf-test/);
});

test("las consultas internas de guias requieren autenticacion", () => {
  const source = readRoute("../routes/guias.routes.js");

  assert.match(source, /router\.use\(autenticarToken, autorizarRoles\("admin", "usuario"\)\)/);
  assert.match(source, /router\.post\("\/buscar", buscarGuias\)/);
  assert.match(source, /router\.get\("\/consultar-tracking", consultarTrackingFiltrado\)/);
});
