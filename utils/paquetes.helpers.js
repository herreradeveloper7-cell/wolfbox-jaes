export const sqlStringOrNull = (value) => (value == null || value === "" ? null : String(value));

export const optionalIntOrZero = (value) => {
  if (value == null || value === "") return 0;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeDeclaracionValor = (value) => sqlStringOrNull(value);

export const normalizeResponsable = (value) => {
  const responsable = typeof value === "string" ? value.trim() : value;
  return responsable ? String(responsable) : "Usuario del sistema";
};
