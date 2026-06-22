import test from "node:test";
import assert from "node:assert/strict";

import { crearNombrePdfSolicitud } from "../controllers/solicitudes.controller.js";

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
