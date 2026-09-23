export const obtenerRequisitosPassword = (password: string) => [
  { texto: "Mínimo 8 caracteres", cumple: password.length >= 8 },
  {
    texto: "Al menos una letra mayúscula",
    cumple: /[A-ZÁÉÍÓÚÜÑ]/u.test(password),
  },
  {
    texto: "Al menos un carácter especial (por ejemplo: !, @, #)",
    cumple: /[^\p{L}\p{N}\s]/u.test(password),
  },
];

export const passwordCumpleRequisitos = (password: string) =>
  obtenerRequisitosPassword(password).every((requisito) => requisito.cumple);
