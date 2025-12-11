import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ReactDOMServer from "react-dom/server";
import PlantillaPDFSolicitud from "../components/solicitudes/PlantillaPDFSolicitud";
import type { SolicitudPDFData } from "../types/solicitudes";

export async function generarPdfSolicitud(solicitud: SolicitudPDFData) {
  const temp = document.createElement("div");
  temp.style.position = "absolute";
  temp.style.top = "-9999px";
  temp.style.left = "-9999px";
  temp.style.width = "1050px";
  temp.style.background = "white";

  const htmlString = ReactDOMServer.renderToString(
    <PlantillaPDFSolicitud solicitud={solicitud} />
  );

  temp.innerHTML = htmlString;
  document.body.appendChild(temp);

  const canvas = await html2canvas(temp, {
    scale: 3,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");

  // 4️⃣ Crear PDF tamaño A4
  const pdf = new jsPDF("p", "pt", "a4");

  // medidas reales A4 en jsPDF
  const pdfWidth = 595.28;
  const pdfHeight = 841.89;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  // 5️⃣ Descargar PDF
  const blob = pdf.output("blob");

  const fechaActual = new Date().toISOString().split("T")[0];
  const nombrePDF = `Solicitud_${solicitud.id}_${fechaActual}.pdf`;

  const url = URL.createObjectURL(blob);

  window.open(url, "_blank");

  const link = document.createElement("a");
  link.href = url;
  link.download = nombrePDF;
  link.click();

  document.body.removeChild(temp);
}
