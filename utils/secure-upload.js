import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { azureStorageDisponible } from "./storage.service.js";

const FORMATOS = {
  jpeg: { mime: "image/jpeg", extension: ".jpg" },
  png: { mime: "image/png", extension: ".png" },
  pdf: { mime: "application/pdf", extension: ".pdf" },
  webp: { mime: "image/webp", extension: ".webp" },
};

const terminaCon = (buffer, firma) => {
  if (buffer.length < firma.length) return false;
  return buffer.subarray(buffer.length - firma.length).equals(firma);
};

export const detectarFormatoSeguro = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  const esJpeg = buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff
    && terminaCon(buffer, Buffer.from([0xff, 0xd9]));
  if (esJpeg) return { tipo: "jpeg", ...FORMATOS.jpeg };

  const firmaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const finalPng = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  if (buffer.subarray(0, 8).equals(firmaPng) && terminaCon(buffer, finalPng)) {
    return { tipo: "png", ...FORMATOS.png };
  }

  const cabeceraPdf = buffer.subarray(0, Math.min(buffer.length, 1024)).indexOf(Buffer.from("%PDF-"));
  const colaPdf = buffer.subarray(Math.max(0, buffer.length - 2048));
  if (cabeceraPdf >= 0 && colaPdf.indexOf(Buffer.from("%%EOF")) >= 0) {
    return { tipo: "pdf", ...FORMATOS.pdf };
  }

  const esWebp = buffer.toString("ascii", 0, 4) === "RIFF"
    && buffer.toString("ascii", 8, 12) === "WEBP";
  if (esWebp) return { tipo: "webp", ...FORMATOS.webp };

  return null;
};

const crearMulter = (maxBytes) => multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxBytes,
    files: 1,
    fields: 20,
    parts: 21,
    fieldNameSize: 100,
    fieldSize: 256 * 1024,
  },
});

export const crearCargaSegura = ({
  campo,
  formatosPermitidos,
  maxBytes,
  directorioLocal = null,
  mensajeInvalido = "El archivo no tiene un formato permitido o esta corrupto.",
}) => {
  const upload = crearMulter(maxBytes);
  const permitidos = new Set(formatosPermitidos);

  return (req, res, next) => {
    upload.single(campo)(req, res, async (error) => {
      if (error) {
        const mensaje = error.code === "LIMIT_FILE_SIZE"
          ? `El archivo supera el limite de ${Math.ceil(maxBytes / 1024 / 1024)} MB.`
          : "La carga del archivo no es valida.";
        return res.status(400).json({ ok: false, mensaje });
      }

      if (!req.file) return next();

      const formato = detectarFormatoSeguro(req.file.buffer);
      if (!formato || !permitidos.has(formato.tipo)) {
        req.file = undefined;
        return res.status(400).json({ ok: false, mensaje: mensajeInvalido });
      }

      req.file.mimetype = formato.mime;
      req.file.filename = `${crypto.randomUUID()}${formato.extension}`;
      req.file.detectedType = formato.tipo;

      try {
        if (directorioLocal && !azureStorageDisponible()) {
          const destino = path.resolve(directorioLocal);
          await fs.mkdir(destino, { recursive: true });
          await fs.writeFile(path.join(destino, req.file.filename), req.file.buffer, { flag: "wx" });
        }
        return next();
      } catch (storageError) {
        console.error("Error preparando archivo validado:", storageError);
        req.file = undefined;
        return res.status(500).json({ ok: false, mensaje: "No fue posible almacenar el archivo." });
      }
    });
  };
};
