import test from "node:test";
import assert from "node:assert/strict";
import {
  despachoSchemas,
  paqueteSchemas,
  solicitudSchemas,
  trmSchemas,
  usuarioSchemas,
} from "../validators/api.schemas.js";

test("paqueteSchemas.registrar coerciona numeros y limpia opcionales vacios", () => {
  const data = paqueteSchemas.registrar.parse({
    tracking: "  TRK-1  ",
    codigo_referencia: "COABC123",
    contenido: "Zapatos",
    peso: "2.5",
    servicio_id: "3",
    destinatario_id: "9",
    declaracion_valor: "120",
    notas: "",
  });

  assert.equal(data.tracking, "TRK-1");
  assert.equal(data.peso, 2.5);
  assert.equal(data.servicio_id, 3);
  assert.equal(data.destinatario_id, 9);
  assert.equal(data.declaracion_valor, 120);
  assert.equal(data.notas, undefined);
});

test("paqueteSchemas.registrar rechaza peso no positivo", () => {
  assert.throws(() =>
    paqueteSchemas.registrar.parse({
      tracking: "TRK-1",
      codigo_referencia: "COABC123",
      contenido: "Zapatos",
      peso: "0",
      servicio_id: "3",
      destinatario_id: "9",
    })
  );
});

test("solicitudSchemas.crear requiere al menos un paquete", () => {
  assert.throws(() =>
    solicitudSchemas.crear.parse({
      cliente_id: 1,
      usuario_id: 2,
      paquetes: [],
      destinatario: 3,
    })
  );
});

test("solicitudSchemas.editarCompleta acepta paquete_id y rechaza payload vacio", () => {
  const data = solicitudSchemas.editarCompleta.parse({
    paquetes: [{ paquete_id: "44", peso: "6.75", contenido: "Ropa" }],
  });

  assert.equal(data.paquetes[0].paquete_id, 44);
  assert.equal(data.paquetes[0].peso, 6.75);

  assert.throws(() => solicitudSchemas.editarCompleta.parse({}));
});

test("solicitudSchemas.agrupar exige minimo dos HAWB", () => {
  assert.doesNotThrow(() =>
    solicitudSchemas.agrupar.parse({ hawbs: ["COJA0001", "COJA0002"] })
  );

  assert.throws(() => solicitudSchemas.agrupar.parse({ hawbs: ["COJA0001"] }));
});

test("despachoSchemas valida estado y HAWB requerido", () => {
  assert.doesNotThrow(() =>
    despachoSchemas.estado.parse({ estado: "cerrado" })
  );
  assert.doesNotThrow(() =>
    despachoSchemas.hawb.parse({ hawb: "COJA0001" })
  );

  assert.throws(() => despachoSchemas.estado.parse({ estado: "bloqueado" }));
  assert.throws(() => despachoSchemas.hawb.parse({ hawb: "" }));
});

test("despachoSchemas.buscar normaliza filtros de busqueda", () => {
  const data = despachoSchemas.buscar.parse({
    q: "  DESP  ",
    oficina_id: "2",
    transportadora_id: "5",
    estado: "abierto",
    fechaDesde: "2026-05-01",
    fechaHasta: "2026-05-15",
  });

  assert.equal(data.q, "DESP");
  assert.equal(data.oficina_id, 2);
  assert.equal(data.transportadora_id, 5);
  assert.equal(data.estado, "abierto");
  assert.throws(() => despachoSchemas.buscar.parse({ estado: "activo" }));
});

test("trmSchemas.guardar exige valor positivo", () => {
  const data = trmSchemas.guardar.parse({ valor: "3975.44" });

  assert.equal(data.valor, 3975.44);
  assert.throws(() => trmSchemas.guardar.parse({ valor: "0" }));
});

test("usuarioSchemas.estado permite solo estados conocidos", () => {
  assert.deepEqual(usuarioSchemas.estado.parse({ estado: "inhabilitado" }), {
    estado: "inhabilitado",
  });

  assert.throws(() => usuarioSchemas.estado.parse({ estado: "bloqueado" }));
});
