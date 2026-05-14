import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const {
  normalizarHawbsAgrupacion,
  buildHawbInClause,
  buildTrackingPadreAgrupado,
} = await import("../controllers/solicitudes.controller.js");

test("normalizarHawbsAgrupacion limpia valores vacios y duplicados", () => {
  assert.deepEqual(
    normalizarHawbsAgrupacion([" COJA1 ", "", null, "COJA1", "COJA2"]),
    ["COJA1", "COJA2"]
  );
});

test("buildHawbInClause crea placeholders parametrizados", () => {
  assert.equal(buildHawbInClause(["COJA1", "COJA2", "COJA3"]), "@hawb0,@hawb1,@hawb2");
});

test("buildTrackingPadreAgrupado usa el HAWB padre para evitar truncamiento", () => {
  assert.equal(buildTrackingPadreAgrupado("COJA123456789G"), "COJA123456789G");
});
