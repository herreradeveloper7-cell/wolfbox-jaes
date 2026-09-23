import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluarPoliticaPassword,
  validarPasswordNueva,
} from "../utils/password-policy.js";

test("la contraseña exige al menos 8 caracteres", () => {
  const resultado = evaluarPoliticaPassword("Corta!1");
  assert.equal(resultado.ok, false);
  assert.match(resultado.mensaje, /8 caracteres/);
});

test("la contraseña exige una letra mayúscula", () => {
  const resultado = evaluarPoliticaPassword("segura!1");
  assert.equal(resultado.ok, false);
  assert.match(resultado.mensaje, /mayúscula/);
});

test("la contraseña exige un carácter especial", () => {
  const resultado = evaluarPoliticaPassword("Segura123");
  assert.equal(resultado.ok, false);
  assert.match(resultado.mensaje, /carácter especial/);
});

test("acepta una contraseña de 8 caracteres con mayúscula y especial", async () => {
  assert.equal(evaluarPoliticaPassword("Segura1!").ok, true);
  assert.equal((await validarPasswordNueva("Segura1!")).ok, true);
});

test("no rechaza contraseñas por listas de palabras comunes o filtraciones", async () => {
  const resultado = await validarPasswordNueva("Password!");
  assert.equal(resultado.ok, true);
});
