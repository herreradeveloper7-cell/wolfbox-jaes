import crypto from "crypto";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const PASSWORDS_COMUNES = new Set([
  "123456789012", "password1234", "password123!", "qwerty123456",
  "administrador", "administrator", "contraseña123", "contrasena123",
  "wolfbox12345", "jaescargo1234",
]);

const normalizar = (valor) => String(valor || "").normalize("NFKC").toLowerCase();

export const evaluarPoliticaPassword = (password, contexto = {}) => {
  const valor = String(password || "");
  if (valor.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, mensaje: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` };
  }
  if (valor.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, mensaje: `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres.` };
  }
  if (valor.trim().length !== valor.length || /^\s+$/.test(valor)) {
    return { ok: false, mensaje: "La contraseña no debe comenzar ni terminar con espacios." };
  }
  if (/^(.)\1{11,}$/u.test(valor)) {
    return { ok: false, mensaje: "La contraseña es demasiado repetitiva." };
  }

  const normalizada = normalizar(valor);
  if (PASSWORDS_COMUNES.has(normalizada)) {
    return { ok: false, mensaje: "Esta contraseña es demasiado común. Usa una frase única." };
  }

  const fragmentosContexto = [contexto.email?.split("@")[0], contexto.nombre]
    .flatMap((dato) => normalizar(dato).split(/[^a-z0-9áéíóúñ]+/i))
    .filter((dato) => dato.length >= 4);
  if (fragmentosContexto.some((fragmento) => normalizada.includes(fragmento))) {
    return { ok: false, mensaje: "La contraseña no debe contener tu nombre o correo." };
  }

  return { ok: true };
};

export const consultarPasswordComprometida = async (password, fetchImpl = globalThis.fetch) => {
  const hash = crypto.createHash("sha1").update(String(password), "utf8").digest("hex").toUpperCase();
  const prefijo = hash.slice(0, 5);
  const sufijo = hash.slice(5);
  const response = await fetchImpl(`https://api.pwnedpasswords.com/range/${prefijo}`, {
    headers: { "Add-Padding": "true", "User-Agent": "Wolfbox-Security-Check" },
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`Pwned Passwords respondio ${response.status}`);
  const resultado = await response.text();
  return resultado.split(/\r?\n/).some((linea) => linea.split(":")[0] === sufijo);
};

export const validarPasswordNueva = async (password, contexto = {}, opciones = {}) => {
  const politica = evaluarPoliticaPassword(password, contexto);
  if (!politica.ok) return { ...politica, status: 400, codigo: "PASSWORD_POLICY" };

  if (process.env.PASSWORD_BREACH_CHECK_DISABLED === "1") return { ok: true };

  try {
    const comprometida = await consultarPasswordComprometida(password, opciones.fetchImpl);
    return comprometida
      ? {
          ok: false,
          status: 400,
          codigo: "PASSWORD_COMPROMISED",
          mensaje: "Esta contraseña aparece en filtraciones conocidas. Elige una diferente.",
        }
      : { ok: true };
  } catch (error) {
    console.error("No fue posible verificar la contraseña comprometida:", error.message);
    return {
      ok: false,
      status: 503,
      codigo: "PASSWORD_CHECK_UNAVAILABLE",
      mensaje: "No fue posible verificar la seguridad de la contraseña. Intenta nuevamente.",
    };
  }
};

export const responderPasswordInvalida = (res, validacion) => res
  .status(validacion.status || 400)
  .json({ ok: false, codigo: validacion.codigo, campo: "password", mensaje: validacion.mensaje });
