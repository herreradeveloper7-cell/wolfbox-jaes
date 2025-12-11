
// 👉 Tipo que ya usas en tablas, listados, etc.
export interface Solicitud {
  id: number;
  fecha: string;
  estado: string;
  destinatario: number | null;
  destinatario_nombre?: string;
  hawbs?: string;
  cantidadPaquetes?: number;
  pesoTotal?: string | number;
}

// 👉 Tipo SOLO para el PDF (con toda la info enriquecida)
export interface SolicitudPDFData {
  id: number;
  fecha: string;

  // Cliente
  cliente_nombre: string;
  codigoCasillero: string;

  // Destinatario
  destinatario_nombre: string;
  destinatario_ciudad: string;
  destinatario_direccion: string;
  destinatario_telefono: string;

  // Paquetes
  paquetes: {
    tracking: string;
    hawb: string;
    contenido: string;
    peso: number;
    asegurado: number;
  }[];

  // Totales
  totalAseguradoUSD: number;
  totalUSD: number;
  trm: number;
  totalCOP: number;
}
