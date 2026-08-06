import assert from "node:assert/strict";
import test from "node:test";
import {
  cifrarSecretoMfa,
  consumirCodigoRecuperacion,
  descifrarSecretoMfa,
  generarCodigosRecuperacion,
  generarTotp,
  verificarTotp,
} from "../utils/mfa.service.js";

test("SEC-010 genera TOTP compatible con el vector RFC 6238", () => {
  const secretoRfc = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  assert.equal(generarTotp(secretoRfc, 59_000), "287082");
  assert.equal(verificarTotp(secretoRfc, "287082", 59_000), true);
  assert.equal(verificarTotp(secretoRfc, "000000", 59_000), false);
});

test("SEC-010 cifra secretos MFA con autenticacion AES-GCM", () => {
  const anterior = process.env.MFA_ENCRYPTION_KEY;
  process.env.MFA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  try {
    const secreto = "JBSWY3DPEHPK3PXP";
    const cifrado = cifrarSecretoMfa(secreto);
    assert.notEqual(cifrado.includes(secreto), true);
    assert.equal(descifrarSecretoMfa(cifrado), secreto);
  } finally {
    if (anterior === undefined) delete process.env.MFA_ENCRYPTION_KEY;
    else process.env.MFA_ENCRYPTION_KEY = anterior;
  }
});

test("SEC-010 genera codigos de recuperacion de un solo uso almacenados como hash", () => {
  const { codigos, hashes } = generarCodigosRecuperacion();
  assert.equal(codigos.length, 8);
  assert.equal(JSON.stringify(hashes).includes(codigos[0]), false);
  const restantes = consumirCodigoRecuperacion(codigos[0], JSON.stringify(hashes));
  assert.equal(JSON.parse(restantes).length, 7);
  assert.equal(consumirCodigoRecuperacion(codigos[0], restantes), null);
});

test("SEC-010 mantiene MFA de administradores tras una bandera explicita de despliegue", async () => {
  const fuente = await import("node:fs").then((fs) => fs.readFileSync(new URL("../controllers/auth.controller.js", import.meta.url), "utf8"));
  assert.match(fuente, /MFA_ADMIN_REQUIRED\s*===\s*"1"/);
});
