
export interface Solicitud {
  id: number;
  fecha: string;
  estado: string;
  cliente_nombre: string;
  codigo_referencia: string;
  destinatario: number | null;
  destinatario_nombre?: string;
  hawbs?: string;
  cantidadPaquetes?: number;
  pesoTotal?: string | number;
  hawbs_agrupados?: string | null;
  hawbs_normales?: string | null;
  guia_agrupada?: string | null;
  comprobante_pago_url?: string | null;
  comprobante?: string | null;

}

// 👉 Tipo SOLO para el PDF (con toda la info enriquecida)
export interface SolicitudPDFData {
  id: number;
  fecha: string;

  // Cliente
  cliente_nombre: string;
  codigoCasillero: string;
  cliente_direccion?: string;
  cliente_ciudad?: string;

  // Destinatario
  destinatario_nombre: string;
  destinatario_ciudad: string;
  destinatario_direccion: string;
  destinatario_telefono: string;
  servicio_id?: number;
  servicio_nombre?: string;

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
  totalPeso?: number;
  totalUSD: number;
  trm: number;
  totalCOP: number;
}
