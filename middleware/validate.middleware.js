import { ZodError } from "zod";

export const validar = (schemas = {}) => {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          mensaje: "Datos de entrada invalidos",
          message: "Datos de entrada invalidos",
          errores: error.issues.map((issue) => ({
            campo: issue.path.join("."),
            mensaje: issue.message,
          })),
        });
      }

      return res.status(500).json({
        ok: false,
        mensaje: "Error validando datos de entrada",
        message: "Error validando datos de entrada",
      });
    }
  };
};
