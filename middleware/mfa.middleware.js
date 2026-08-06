import { verificarToken } from "./auth.middleware.js";

export const autenticarDesafioMfa = (req, res, next) => {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    const payload = verificarToken(token);
    if (!payload?.mfa_scope || !payload?.id || payload.tipo !== "admin") throw new Error("alcance invalido");
    req.desafioMfa = payload;
    return next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "El desafío MFA es inválido o expiró." });
  }
};
