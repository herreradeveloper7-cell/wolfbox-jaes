import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularCotizacionServicio,
  calcularFleteServicio,
  calcularSeguroServicio,
  validarRangosTarifa,
} from "../utils/tarifas.helpers.js";

const servicioRangos = {
  nombre: "Pruebas",
  tarifas_rangos: [
    { peso_desde: 0, peso_hasta: 1, valor_usd: 7 },
    { peso_desde: 1, peso_hasta: 5, valor_usd: 15 },
    { peso_desde: 5, peso_hasta: 10, valor_usd: 20 },
  ],
  tarifa_por_libra_extra: 2.5,
  porcentaje_seguro: 10,
  seguro_minimo_usd: 10,
};

test("calcularFleteServicio usa el valor fijo del rango configurable", () => {
  assert.equal(calcularFleteServicio(servicioRangos, 1).fleteUSD, 7);
  assert.equal(calcularFleteServicio(servicioRangos, 4).fleteUSD, 15);
  assert.equal(calcularFleteServicio(servicioRangos, 8).fleteUSD, 20);
  assert.equal(calcularFleteServicio(servicioRangos, 10).fleteUSD, 20);
});

test("calcularFleteServicio multiplica todo el peso al superar el ultimo rango", () => {
  assert.equal(calcularFleteServicio(servicioRangos, 11).fleteUSD, 27.5);
  assert.equal(calcularFleteServicio(servicioRangos, 22).fleteUSD, 55);
});

test("calcularSeguroServicio siempre respeta el seguro minimo", () => {
  assert.equal(calcularSeguroServicio(servicioRangos, 100), 10);
  assert.equal(calcularSeguroServicio(servicioRangos, 200), 20);
  assert.equal(calcularSeguroServicio(servicioRangos, 0), 10);
  assert.equal(calcularSeguroServicio(servicioRangos, null), 10);
});

test("calcularCotizacionServicio produce el ejemplo completo esperado", () => {
  assert.deepEqual(calcularCotizacionServicio(servicioRangos, 22, 100), {
    ok: true,
    fleteUSD: 55,
    seguroUSD: 10,
    totalUSD: 65,
  });
});

test("validarRangosTarifa rechaza rangos superpuestos", () => {
  assert.equal(validarRangosTarifa([
    { peso_desde: 0, peso_hasta: 5, valor_usd: 10 },
    { peso_desde: 4, peso_hasta: 8, valor_usd: 15 },
  ]).ok, false);
});

test("servicios por libra conservan minimo facturable de diez libras", () => {
  const servicio = { nombre: "Libra", tarifa_por_libra_cc: 3 };
  assert.equal(calcularFleteServicio(servicio, 4).fleteUSD, 30);
  assert.equal(calcularFleteServicio(servicio, 12.5).fleteUSD, 37.5);
});
