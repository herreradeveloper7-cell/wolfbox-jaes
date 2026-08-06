import crypto from "crypto";
import { registrarEventoAuditoria, redactarParaAuditoria } from "../utils/auditoria.service.js";

const METODOS_MUTACION = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const RUTAS_TECNICAS = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/clientes/login",
];

const requestIdValido = (valor) => /^[a-zA-Z0-9_-]{8,100}$/.test(String(valor || ""));

export const contextoRequest = (req, res, next) => {
  const recibido = req.get("x-request-id");
  req.requestId = requestIdValido(recibido) ? recibido : crypto.randomUUID();
  res.setHeader("X-Request-ID", req.requestId);
  next();
};

const describirRuta = (req) => {
  const ruta = req.originalUrl.split("?")[0];
  const partes = ruta.split("/").filter(Boolean);
  return {
    ruta,
    recurso: partes[1] || "api",
    recursoId: partes.find((parte, indice) => indice > 1 && /^\d+$/.test(parte)) || null,
  };
};

const accionDesdeMetodo = (metodo) => ({
  POST: "crear",
  PUT: "actualizar",
  PATCH: "cambiar_estado",
  DELETE: "eliminar",
}[metodo] || "mutar");

export const auditarMutaciones = (req, res, next) => {
  const rutaSinQuery = req.originalUrl.split("?")[0];
  if (!METODOS_MUTACION.has(req.method) || RUTAS_TECNICAS.includes(rutaSinQuery)) {
    return next();
  }

  let respuesta = null;
  const jsonOriginal = res.json.bind(res);
  res.json = (body) => {
    respuesta = body;
    return jsonOriginal(body);
  };

  res.once("finish", () => {
    const descriptor = describirRuta(req);
    const detalle = res.locals.auditoria || {};
    const actorTipo = req.usuario?.tipo === "cliente" ? "cliente" : req.usuario ? "usuario" : "anonimo";
    const codigoError = res.statusCode >= 400
      ? respuesta?.codigo || respuesta?.code || null
      : null;

    registrarEventoAuditoria({
      requestId: req.requestId,
      actorTipo,
      actorId: Number(req.usuario?.id) || null,
      actorRol: req.usuario?.tipo || null,
      accion: detalle.accion || accionDesdeMetodo(req.method),
      recurso: detalle.recurso || descriptor.recurso,
      recursoId: detalle.recursoId || descriptor.recursoId,
      metodo: req.method,
      ruta: descriptor.ruta,
      antes: detalle.antes ?? null,
      despues: detalle.despues ?? (res.statusCode < 400 ? redactarParaAuditoria(respuesta) : null),
      cambios: req.body || null,
      resultado: res.statusCode < 400 ? "exito" : "fallo",
      statusHttp: res.statusCode,
      codigoError,
      ip: req.ip || req.socket?.remoteAddress || null,
      userAgent: req.get("user-agent") || null,
    }).catch((error) => {
      console.error(`[audit:${req.requestId}] No fue posible registrar el evento:`, error.message);
    });
  });

  return next();
};
