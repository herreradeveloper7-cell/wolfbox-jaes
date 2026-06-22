import test from "node:test";
import assert from "node:assert/strict";

import {
  calcularPesoTotalSolicitud,
  calcularTotalesActualesSolicitud,
  crearNombrePdfSolicitud,
} from "../controllers/solicitudes.controller.js";

test("crearNombrePdfSolicitud incluye numero y fecha ISO de la solicitud", () => {
  assert.equal(
    crearNombrePdfSolicitud({ id: 1113, fecha: "2026-06-19T00:00:00.000Z" }),
    "Solicitud_1113_2026-06-19.pdf"
  );
});

test("crearNombrePdfSolicitud admite fechas entregadas por mssql como Date", () => {
  assert.equal(
    crearNombrePdfSolicitud({ id: 1113, fecha: new Date("2026-06-19T00:00:00.000Z") }),
    "Solicitud_1113_2026-06-19.pdf"
  );
});

test("crearNombrePdfSolicitud usa valores seguros si faltan datos", () => {
  assert.equal(
    crearNombrePdfSolicitud({}),
    "Solicitud_sin-numero_sin-fecha.pdf"
  );
});

test("calcularPesoTotalSolicitud suma paquetes sin agrupar", () => {
  assert.equal(
    calcularPesoTotalSolicitud([
      { hawb: "COJA001", peso: 4.25 },
      { hawb: "COJA002", peso: 5.75 },
    ]),
    10
  );
});

test("calcularPesoTotalSolicitud no duplica el peso del HAWB padre", () => {
  assert.equal(
    calcularPesoTotalSolicitud([
      { hawb: "COJA001", peso: 4.25 },
      { hawb: "COJA002", peso: 5.75 },
      { hawb: "COJA999G", peso: 10 },
    ]),
    10
  );
});

test("calcularTotalesActualesSolicitud reemplaza el total antiguo y conserva la TRM", () => {
  assert.deepEqual(
    calcularTotalesActualesSolicitud({
      fleteUSD: 116,
      seguroUSD: 5,
      valorUSDGuardado: 137,
      valorCOPGuardado: 493200,
    }),
    {
      trm: 3600,
      totalUSD: 121,
      totalCOP: 435600,
      totalUSDConCargos: 121,
      totalCOPConCargos: 435600,
    }
  );
});

test("calcularTotalesActualesSolicitud agrega cargos actuales por separado", () => {
  const totales = calcularTotalesActualesSolicitud({
    fleteUSD: 116,
    seguroUSD: 5,
    valorUSDGuardado: 137,
    valorCOPGuardado: 493200,
    cargosUSD: 10,
    cargosCOP: 36000,
  });

  assert.equal(totales.totalUSDConCargos, 131);
  assert.equal(totales.totalCOPConCargos, 471600);
});
