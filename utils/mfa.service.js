import crypto from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const obtenerClave = () => {
  const raw = String(process.env.MFA_ENCRYPTION_KEY || "").trim();
  const clave = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (clave.length !== 32) throw new Error("MFA_ENCRYPTION_KEY debe contener exactamente 32 bytes");
  return clave;
};

export const codificarBase32 = (buffer) => {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let salida = "";
  for (let i = 0; i < bits.length; i += 5) {
    salida += BASE32[Number.parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  }
  return salida;
};

const decodificarBase32 = (valor) => {
  const limpio = String(valor).toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (const caracter of limpio) bits += BASE32.indexOf(caracter).toString(2).padStart(5, "0");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};

export const generarSecretoMfa = () => codificarBase32(crypto.randomBytes(20));

export const cifrarSecretoMfa = (secreto) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", obtenerClave(), iv);
  const cifrado = Buffer.concat([cipher.update(secreto, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), cifrado.toString("base64url")].join(".");
};

export const descifrarSecretoMfa = (valor) => {
  const [version, iv, tag, cifrado] = String(valor).split(".");
  if (version !== "v1" || !iv || !tag || !cifrado) throw new Error("Secreto MFA cifrado invalido");
  const decipher = crypto.createDecipheriv("aes-256-gcm", obtenerClave(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(cifrado, "base64url")), decipher.final()]).toString("utf8");
};

export const generarTotp = (secreto, fecha = Date.now(), desplazamiento = 0) => {
  const contador = Math.floor(fecha / 1000 / 30) + desplazamiento;
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(contador));
  const hmac = crypto.createHmac("sha1", decodificarBase32(secreto)).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const numero = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(numero).padStart(6, "0");
};

export const verificarTotp = (secreto, codigo, fecha = Date.now()) => {
  const recibido = Buffer.from(String(codigo || "").replace(/\s/g, ""));
  return [-1, 0, 1].some((ventana) => {
    const esperado = Buffer.from(generarTotp(secreto, fecha, ventana));
    return recibido.length === esperado.length && crypto.timingSafeEqual(recibido, esperado);
  });
};

const hashCodigo = (codigo) => crypto.createHash("sha256").update(String(codigo).toUpperCase()).digest("hex");

export const generarCodigosRecuperacion = () => {
  const codigos = Array.from({ length: 8 }, () => `${crypto.randomBytes(4).toString("hex").slice(0, 4)}-${crypto.randomBytes(4).toString("hex").slice(0, 4)}`.toUpperCase());
  return { codigos, hashes: codigos.map(hashCodigo) };
};

export const consumirCodigoRecuperacion = (codigo, hashesJson) => {
  let hashes;
  try { hashes = JSON.parse(hashesJson || "[]"); } catch { hashes = []; }
  const buscado = hashCodigo(String(codigo || "").replace(/\s/g, ""));
  const indice = hashes.findIndex((hash) => hash.length === buscado.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(buscado)));
  if (indice < 0) return null;
  hashes.splice(indice, 1);
  return JSON.stringify(hashes);
};

export const crearUriOtp = ({ secreto, email }) => {
  const issuer = "WolfBox JAES";
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${email}`)}?secret=${secreto}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
};
