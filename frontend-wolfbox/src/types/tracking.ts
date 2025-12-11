export interface EstadoTracking {
  id: number;
  fecha: string;              
  estado: string;             
  punto_control: string;      
  observaciones?: string;
  responsable: string;
}

export interface ResultadoTracking {
  hawb: string;
  tracking: string;
  estados: EstadoTracking[];
}
