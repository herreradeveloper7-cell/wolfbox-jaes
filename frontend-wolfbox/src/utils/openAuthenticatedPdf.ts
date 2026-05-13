export const openAuthenticatedPdf = async (url: string, fileName = "rotulo.pdf") => {
  const pendingWindow = window.open("about:blank", "_blank");

  pendingWindow?.document.write(`
    <html>
      <head><title>Generando rotulo</title></head>
      <body style="font-family: Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; color: #334155;">
        <div style="text-align: center;">
          <strong>Generando rotulo...</strong>
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
      throw new Error(payload.message || payload.mensaje || "No se pudo generar el rotulo.");
    }

    throw new Error("No se pudo generar el rotulo.");
  }

  if (!contentType.includes("application/pdf")) {
    pendingWindow?.close();
    throw new Error("La respuesta del servidor no es un PDF valido.");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));

  if (pendingWindow) {
    pendingWindow.location.href = blobUrl;
  } else {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};
