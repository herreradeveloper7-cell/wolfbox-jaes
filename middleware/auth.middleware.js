import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET debe estar configurado en producción.");
    }
    console.warn("JWT_SECRET no esta configurado. Usando secreto local temporal.");
    return "wolfbox-dev-secret";
  }

  return secret;
};

export const autenticarToken = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token de autenticacion requerido",
      message: "Token de autenticacion requerido",
    });
  }

  try {
    req.usuario = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      mensaje: "Token invalido o expirado",
      message: "Token invalido o expirado",
    });
  }
};

export const autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rol = req.usuario?.tipo;

    if (!rol || !rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para realizar esta accion",
        message: "No tienes permisos para realizar esta accion",
      });
    }

    return next();
  };
};

export const autorizarPermisos = (...permisosPermitidos) => {
  return (req, res, next) => {
    const rol = req.usuario?.tipo;

    if (rol === "admin") return next();

    const permisosUsuario = Array.isArray(req.usuario?.permisos)
      ? req.usuario.permisos
      : [];

    const tienePermiso = permisosPermitidos.some((permiso) =>
      permisosUsuario.includes(permiso)
    );

    if (rol === "usuario" && tienePermiso) {
      return next();
    }

    return res.status(403).json({
      ok: false,
      mensaje: "No tienes permisos para realizar esta accion",
      message: "No tienes permisos para realizar esta accion",
    });
  };
};

export const autorizarClientePropio = (obtenerValor, campoToken = "id") => {
  return (req, res, next) => {
    if (["admin", "usuario"].includes(req.usuario?.tipo)) {
      return next();
    }

    if (req.usuario?.tipo !== "cliente") {
      return res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos para realizar esta accion",
        message: "No tienes permisos para realizar esta accion",
      });
    }

    const valorRequest = String(obtenerValor(req) ?? "");
    const valorToken = String(req.usuario?.[campoToken] ?? "");

    if (!valorRequest || valorRequest !== valorToken) {
      return res.status(403).json({
        ok: false,
        mensaje: "No puedes acceder a informacion de otro cliente",
        message: "No puedes acceder a informacion de otro cliente",
      });
    }

    return next();
  };
};

export const firmarToken = (payload, expiresIn = "8h") => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};
