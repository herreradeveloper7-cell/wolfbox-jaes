import test from "node:test";
import assert from "node:assert/strict";
import { buildSolicitudesAgrupablesQueries } from "../utils/agruparPaquetes.helpers.js";

test("buildSolicitudesAgrupablesQueries exige que todos los paquetes esten listos", () => {
  const { dataQuery, totalQuery, dataInputs, totalInputs } = buildSolicitudesAgrupablesQueries({
    page: 2,
    limit: 15,
    puntoControl: 7,
    oficina: 3,
  });

  assert.match(dataQuery, /HAVING COUNT\(paquete_id\) >= 2/);
  assert.match(dataQuery, /SUM\([\s\S]*\) = COUNT\(paquete_id\)/);
  assert.match(dataQuery, /LEFT JOIN PuntoControlSeleccionado pcs/);
  assert.match(dataQuery, /punto_control_valido = 1/);
  assert.match(dataQuery, /LEFT JOIN UltimoEstado/);
  assert.match(totalQuery, /FROM SolicitudesCandidatas/);
  assert.equal(dataInputs.find((input) => input.name === "offset").value, 15);
  assert.equal(dataInputs.find((input) => input.name === "limit").value, 15);
  assert.equal(totalInputs.find((input) => input.name === "puntoControl").value, 7);
  assert.equal(totalInputs.find((input) => input.name === "oficina").value, 3);
});

test("buildSolicitudesAgrupablesQueries agrega filtros de fecha parametrizados", () => {
  const { dataQuery, totalInputs } = buildSolicitudesAgrupablesQueries({
    fechaInicio: "2026-05-01",
    fechaFin: "2026-05-13",
    puntoControl: 4,
  });

  assert.match(dataQuery, /CAST\(s\.fecha AS DATE\) >= @fechaInicio/);
  assert.match(dataQuery, /CAST\(s\.fecha AS DATE\) <= @fechaFin/);
  assert.deepEqual(
    totalInputs.filter((input) => input.name.startsWith("fecha")),
    [
      { name: "fechaInicio", type: "Date", value: "2026-05-01" },
      { name: "fechaFin", type: "Date", value: "2026-05-13" },
    ]
  );
});
