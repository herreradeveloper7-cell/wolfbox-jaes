import fs from "fs";
import path from "path";

const LOGO_RELATIVE_PATHS = [
  path.join("frontend-wolfbox", "src", "assets", "logoJaesCargo.png"),
  path.join("src", "assets", "logoJaesCargo.png"),
];

export const getLogoJaesCargoPath = () => {
  const customPath = process.env.PDF_LOGO_PATH;

  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  for (const relativePath of LOGO_RELATIVE_PATHS) {
    const logoPath = path.resolve(process.cwd(), relativePath);

    if (fs.existsSync(logoPath)) {
      return logoPath;
    }
  }

  return null;
};

export const drawLogoJaesCargo = (doc, x = 18, y = 16, width = 85) => {
  const logoPath = getLogoJaesCargoPath();

  if (!logoPath) {
    console.warn("No se encontro el logo JAES para el PDF.");
    return false;
  }

  try {
    doc.image(logoPath, x, y, { width });
    return true;
  } catch (error) {
    console.warn("No se pudo cargar el logo JAES en el PDF:", error.message);
    return false;
  }
};
