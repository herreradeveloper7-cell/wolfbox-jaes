export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const contieneMayuscula = (valor) => /[A-ZÁÉÍÓÚÜÑ]/u.test(valor);
const contieneCaracterEspecial = (valor) => /[^\p{L}\p{N}\s]/u.test(valor);

export const evaluarPoliticaPassword = (password) => {
  const valor = String(password || "");
  if (valor.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, mensaje: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` };
  }
  if (valor.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, mensaje: `La contraseña no puede superar ${PASSWORD_MAX_LENGTH} caracteres.` };
  }
  if (!contieneMayuscula(valor)) {
    return { ok: false, mensaje: "La contraseña debe incluir al menos una letra mayúscula." };
  }
  if (!contieneCaracterEspecial(valor)) {
    return { ok: false, mensaje: "La contraseña debe incluir al menos un carácter especial." };
  }

  return { ok: true };
};

export const validarPasswordNueva = async (password) => {
  const politica = evaluarPoliticaPassword(password);
  return politica.ok
    ? { ok: true }
    : { ...politica, status: 400, codigo: "PASSWORD_POLICY" };
};

export const responderPasswordInvalida = (res, validacion) => res
  .status(validacion.status || 400)
  .json({
    ok: false,
    codigo: validacion.codigo,
    campo: "password",
    mensaje: validacion.mensaje,
    message: validacion.mensaje,
  });
