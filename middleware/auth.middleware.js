import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
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
      message: "Token de autenticacion requerido",
    });
  }

  try {
    req.usuario = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
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
        message: "No tienes permisos para realizar esta accion",
      });
    }

    return next();
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
        message: "No tienes permisos para realizar esta accion",
      });
    }

    const valorRequest = String(obtenerValor(req) ?? "");
    const valorToken = String(req.usuario?.[campoToken] ?? "");

    if (!valorRequest || valorRequest !== valorToken) {
      return res.status(403).json({
        ok: false,
        message: "No puedes acceder a informacion de otro cliente",
      });
    }

    return next();
  };
};

export const firmarToken = (payload, expiresIn = "8h") => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};
