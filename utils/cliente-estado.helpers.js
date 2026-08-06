export const ESTADOS_CLIENTE = Object.freeze({
  ACTIVO: "activo",
  INACTIVO: "inactivo",
  INHABILITADO: "inhabilitado",
});

export const clienteEstaActivo = (cliente) =>
  String(cliente?.estado || "").trim().toLowerCase() === ESTADOS_CLIENTE.ACTIVO;

export const MENSAJE_CLIENTE_INHABILITADO =
  "La cuenta se encuentra inhabilitada. Comunícate con soporte.";
