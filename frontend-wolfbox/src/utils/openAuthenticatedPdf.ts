const getResponseFileName = (contentDisposition: string | null, fallback: string) => {
  if (!contentDisposition) return fallback;

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].trim());
    } catch {
      return fallback;
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1]?.trim() || fallback;
};

const renderPdfViewer = (
  viewerWindow: Window,
  blobUrl: string,
  fileName: string
) => {
  const viewerDocument = viewerWindow.document;
  viewerDocument.open();
  viewerDocument.write("<!doctype html><html><head></head><body></body></html>");
  viewerDocument.close();
  viewerDocument.title = fileName;

  const style = viewerDocument.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body { display: grid; grid-template-rows: 52px 1fr; background: #333; font-family: Arial, sans-serif; }
    header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 18px; background: #3f3f3f; color: #fff; }
    strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    a { flex: 0 0 auto; border-radius: 4px; background: #8b0000; color: #fff; padding: 9px 14px; font-size: 13px; font-weight: 700; text-decoration: none; }
    iframe { width: 100%; height: 100%; border: 0; background: #525659; }
  `;
  viewerDocument.head.appendChild(style);

  const header = viewerDocument.createElement("header");
  const title = viewerDocument.createElement("strong");
  title.textContent = fileName;

  const downloadLink = viewerDocument.createElement("a");
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  downloadLink.textContent = "Descargar PDF";

  header.append(title, downloadLink);

  const iframe = viewerDocument.createElement("iframe");
  iframe.title = fileName;
  iframe.src = `${blobUrl}#toolbar=0&navpanes=0`;

  viewerDocument.body.append(header, iframe);
};

export const openAuthenticatedPdf = async (url: string, fileName = "rotulo.pdf") => {
  const pendingWindow = window.open("about:blank", "_blank");

  pendingWindow?.document.write(`
    <html>
      <head><title>Generando PDF</title></head>
      <body style="font-family: Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; color: #334155;">
        <div style="text-align: center;">
          <strong>Generando PDF...</strong>
          <p>Estamos preparando el PDF de forma segura.</p>
        </div>
      </body>
    </html>
  `);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
  });

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    pendingWindow?.close();

    if (contentType.includes("application/json")) {
      const payload = await response.json();
      throw new Error(payload.message || payload.mensaje || "No se pudo generar el PDF.");
    }

    throw new Error("No se pudo generar el PDF.");
  }

  if (!contentType.includes("application/pdf")) {
    pendingWindow?.close();
    throw new Error("La respuesta del servidor no es un PDF valido.");
  }

  const blob = await response.blob();
  const resolvedFileName = getResponseFileName(
    response.headers.get("content-disposition"),
    fileName
  );
  const pdfFile = new File([blob], resolvedFileName, { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(pdfFile);

  if (pendingWindow) {
    renderPdfViewer(pendingWindow, blobUrl, resolvedFileName);
  } else {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = resolvedFileName;
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30 * 60_000);
};
