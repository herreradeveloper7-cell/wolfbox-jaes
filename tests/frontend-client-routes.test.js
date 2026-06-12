import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../frontend-wolfbox/src/App.tsx", import.meta.url), "utf8");

test("dashboard y perfil del cliente usan guard de sesion", () => {
  assert.match(
    app,
    /path="\/dashboardCliente" element=\{clienteProtegido\(<DashboardClientePage \/>\)\}/
  );
  assert.match(
    app,
    /path="\/editar-perfil" element=\{clienteProtegido\(<EditarPerfilCliente \/>\)\}/
  );
});

test("rutas operativas del cliente permanecen protegidas", () => {
  assert.match(app, /path="\/rastreo-paquetes" element=\{clienteProtegido/);
  assert.match(app, /path="\/prealertas" element=\{clienteProtegido/);
  assert.match(app, /path="\/solicitar-despachos" element=\{casilleroCompartido/);
  assert.match(app, /path="\/destinatarios-casilleros" element=\{casilleroCompartido/);
});
