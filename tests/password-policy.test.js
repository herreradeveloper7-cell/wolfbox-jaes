import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  consultarPasswordComprometida,
  evaluarPoliticaPassword,
  validarPasswordNueva,
} from "../utils/password-policy.js";

test("SEC-010 exige contrasenas nuevas de al menos 12 caracteres", () => {
  const resultado = evaluarPoliticaPassword("Corta-123");
  assert.equal(resultado.ok, false);
});

test("SEC-010 rechaza contrasenas comunes, repetitivas o relacionadas con el usuario", () => {
  assert.equal(evaluarPoliticaPassword("password123!").ok, false);
  assert.equal(evaluarPoliticaPassword("aaaaaaaaaaaa").ok, false);
  assert.equal(
    evaluarPoliticaPassword("Javier-seguro-2026", {
      nombre: "Javier Herrera",
      email: "javier@example.com",
    }).ok,
    false
  );
});

test("SEC-010 permite una frase de contrasena larga y no predecible", () => {
  assert.equal(evaluarPoliticaPassword("Nubes-Cobre-Viajan-48").ok, true);
});

test("SEC-010 consulta filtraciones sin enviar la contrasena ni su hash completo", async () => {
  const password = "Nubes-Cobre-Viajan-48";
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  let solicitud;

  const comprometida = await consultarPasswordComprometida(password, async (url, opciones) => {
    solicitud = { url, opciones };
    return {
      ok: true,
      text: async () => `${hash.slice(5)}:27\nOTROSUFIJO:0`,
    };
  });

  assert.equal(comprometida, true);
  assert.match(solicitud.url, new RegExp(`${hash.slice(0, 5)}$`));
  assert.equal(solicitud.url.includes(password), false);
  assert.equal(solicitud.url.includes(hash), false);
  assert.equal(solicitud.opciones.headers["Add-Padding"], "true");
});

test("SEC-010 bloquea una contrasena encontrada en filtraciones", async () => {
  const password = "Nubes-Cobre-Viajan-48";
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const resultado = await validarPasswordNueva(password, {}, {
    fetchImpl: async () => ({ ok: true, text: async () => `${hash.slice(5)}:3` }),
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.codigo, "PASSWORD_COMPROMISED");
});

test("SEC-010 no permite omitir silenciosamente la verificacion si el proveedor falla", async () => {
  const resultado = await validarPasswordNueva("Nubes-Cobre-Viajan-48", {}, {
    fetchImpl: async () => {
      throw new Error("servicio temporalmente no disponible");
    },
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.status, 503);
  assert.equal(resultado.codigo, "PASSWORD_CHECK_UNAVAILABLE");
});
