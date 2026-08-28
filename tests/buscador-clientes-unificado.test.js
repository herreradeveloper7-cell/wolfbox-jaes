import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readSource = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

test("el buscador compartido distingue cliente inexistente de error de consulta", () => {
  const source = readSource(
    "../frontend-wolfbox/src/components/clientes/BuscarClientes.tsx"
  );

  assert.match(source, /setSinResultados\(clientes\.length === 0\)/);
  assert.match(source, /Cliente no registrado/);
  assert.match(source, /No fue posible consultar los clientes/);
  assert.match(source, /requestActual !== requestRef\.current/);
});

test("las paginas con sugerencias reutilizan el buscador de clientes", () => {
  for (const path of [
    "../frontend-wolfbox/src/pages/SolicitarDespachos.tsx",
    "../frontend-wolfbox/src/pages/usuario/ConsultarGuia.tsx",
    "../frontend-wolfbox/src/pages/usuario/ConciliacionPagos.tsx",
    "../frontend-wolfbox/src/components/paquetesDigitados/BusquedaPaquetes.tsx",
    "../frontend-wolfbox/src/components/destianatariosCasilleros/BuscarDestinatarios.tsx",
  ]) {
    assert.match(readSource(path), /import BuscarClientes/);
  }
});
