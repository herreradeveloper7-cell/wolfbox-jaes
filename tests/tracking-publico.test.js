import test from "node:test";
import assert from "node:assert/strict";
import { serializarTrackingPublico } from "../controllers/paquetes.controller.js";
import { hawbParam } from "../validators/api.schemas.js";

test("la respuesta publica de tracking solo contiene campos permitidos", () => {
  const resultado = serializarTrackingPublico({
    respuesta: {
      id: 99,
      hawb: "COJA000000000001",
      tracking: "TRACKING-SECRETO",
      contenido: "Contenido privado",
      peso: 22,
      tienda: "Tienda privada",
      notas: "Nota privada",
      cliente: "Cliente privado",
      codigo_referencia: "CASILLERO-PRIVADO",
      estado: "En tránsito",
      punto_control: "Miami",
      fecha_registro: "2026-08-04 10:00:00",
      paquetes: [{ tracking: "HIJO-SECRETO" }],
    },
    historial: [{
      id: 10,
      fecha: "2026-08-04 11:00:00",
      estado: "En tránsito",
      punto_control: "Miami",
      observaciones: "Observación privada",
      responsable: "Operador privado",
    }],
  });

  assert.deepEqual(resultado, {
    hawb: "COJA000000000001",
    estado: "En tránsito",
    punto_control: "Miami",
    fecha_registro: "2026-08-04 10:00:00",
    estados: [{
      fecha: "2026-08-04 11:00:00",
      estado: "En tránsito",
      punto_control: "Miami",
    }],
  });

  const serializado = JSON.stringify(resultado);
  for (const valorSensible of [
    "TRACKING-SECRETO",
    "Contenido privado",
    "Tienda privada",
    "Nota privada",
    "Cliente privado",
    "CASILLERO-PRIVADO",
    "HIJO-SECRETO",
    "Observación privada",
    "Operador privado",
  ]) {
    assert.equal(serializado.includes(valorSensible), false);
  }
});

test("hawbParam normaliza y restringe el identificador consultado", () => {
  assert.deepEqual(
    hawbParam.parse({ hawb: " coja000000000001 " }),
    { hawb: "COJA000000000001" }
  );
  assert.throws(() => hawbParam.parse({ hawb: "../master" }));
  assert.throws(() => hawbParam.parse({ hawb: "A".repeat(51) }));
});
