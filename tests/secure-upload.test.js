import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectarFormatoSeguro } from "../utils/secure-upload.js";

const jpegValido = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(16, 0x01),
  Buffer.from([0xff, 0xd9]),
]);
const pngValido = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16, 0x01),
  Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]),
]);
const pdfValido = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\nstartxref\n0\n%%EOF\n");
const webpValido = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x04, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
  Buffer.from("VP8 "),
]);

test("SEC-007 detecta el tipo desde la firma y estructura, no desde el nombre", () => {
  assert.equal(detectarFormatoSeguro(jpegValido)?.mime, "image/jpeg");
  assert.equal(detectarFormatoSeguro(pngValido)?.mime, "image/png");
  assert.equal(detectarFormatoSeguro(pdfValido)?.mime, "application/pdf");
  assert.equal(detectarFormatoSeguro(webpValido)?.mime, "image/webp");
});

test("SEC-007 rechaza archivos camuflados o truncados", () => {
  assert.equal(detectarFormatoSeguro(Buffer.from("archivo.exe renombrado.pdf")), null);
  assert.equal(detectarFormatoSeguro(Buffer.from("%PDF-1.7 sin marcador final")), null);
  assert.equal(detectarFormatoSeguro(jpegValido.subarray(0, -2)), null);
  assert.equal(detectarFormatoSeguro(pngValido.subarray(0, -8)), null);
});

test("SEC-007 usa nombres UUID y limites multipart estrictos", () => {
  const source = readFileSync(new URL("../utils/secure-upload.js", import.meta.url), "utf8");
  assert.match(source, /crypto\.randomUUID\(\)/);
  assert.match(source, /files: 1/);
  assert.match(source, /parts: 21/);
  assert.match(source, /fileSize: maxBytes/);
  assert.doesNotMatch(source, /originalname/);
});

test("SEC-007 aplica la carga segura a todos los flujos de archivos", () => {
  const solicitudes = readFileSync(new URL("../routes/solicitudes.routes.js", import.meta.url), "utf8");
  const conciliacion = readFileSync(new URL("../routes/conciliacion.routes.js", import.meta.url), "utf8");
  const promociones = readFileSync(new URL("../routes/promociones.routes.js", import.meta.url), "utf8");

  assert.match(solicitudes, /formatosPermitidos: \["jpeg", "pdf"\]/);
  assert.match(conciliacion, /formatosPermitidos: \["jpeg", "png", "pdf"\]/);
  assert.match(promociones, /formatosPermitidos: \["jpeg", "webp"\]/);
});
