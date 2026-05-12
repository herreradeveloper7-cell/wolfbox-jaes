import test from "node:test";
import assert from "node:assert/strict";
import {
  buildClienteLoginResponse,
  buildClienteTokenPayload,
  buildUsuarioLoginResponse,
  buildUsuarioTokenPayload,
  getLoginExpiresIn,
} from "../utils/auth.helpers.js";

test("getLoginExpiresIn respeta mantener sesion", () => {
  assert.equal(getLoginExpiresIn(true), "30d");
  assert.equal(getLoginExpiresIn(false), "8h");
});

test("buildUsuarioLoginResponse no expone contrasena ni campos internos", () => {
  const response = buildUsuarioLoginResponse({
    id: 10,
    nombre: "Admin JAES",
    correo: "admin@jaes.com",
    contrasena: "hash-secreto",
    tipo_usuario: "admin",
    genero: "femenino",
    fecha_creacion: "2026-01-01",
  });

  assert.deepEqual(response, {
    id: 10,
    nombre: "Admin JAES",
    email: "admin@jaes.com",
    tipo: "admin",
    genero: "femenino",
    fecha_creacion: "2026-01-01",
  });
  assert.equal("contrasena" in response, false);
});

test("buildUsuarioTokenPayload usa rol real del usuario", () => {
  assert.deepEqual(
    buildUsuarioTokenPayload({
      id: 5,
      correo: "ops@jaes.com",
      tipo_usuario: "usuario",
    }),
    {
      id: 5,
      email: "ops@jaes.com",
      tipo: "usuario",
    }
  );
});

test("buildClienteLoginResponse y payload mantienen codigoReferencia", () => {
  const cliente = {
    id: 77,
    primer_nombre: "Laura",
    primer_apellido: "Perez",
    correo: "cliente@test.com",
    codigo_referencia: "COLAU12345",
    genero: "femenino",
    contrasena: "hash",
  };

  assert.deepEqual(buildClienteLoginResponse(cliente), {
    id: 77,
    nombre: "Laura Perez",
    email: "cliente@test.com",
    codigoReferencia: "COLAU12345",
    genero: "femenino",
    tipo: "cliente",
  });

  assert.deepEqual(buildClienteTokenPayload(cliente), {
    id: 77,
    email: "cliente@test.com",
    tipo: "cliente",
    codigoReferencia: "COLAU12345",
  });
});
