import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Boxes, Clock3, MapPin, PackageSearch, Route, Search, Truck } from "lucide-react";
import ClientDashboardLayout from "../../layouts/ClientDashboardLayout";

type EstadoTracking = {
  id: number;
  fecha: string;
  estado: string | null;
  punto_control: string | null;
  observaciones: string | null;
  responsable: string | null;
};

type PaqueteRelacionado = {
  id: number;
  hawb: string;
  tracking: string | null;
  contenido: string | null;
  peso: number | null;
  tienda: string | null;
  estado: string | null;
  punto_control: string | null;
  fecha_registro: string | null;
  estados: EstadoTracking[];
};

type GuiaTracking = PaqueteRelacionado & {
  notas: string | null;
  cliente: string | null;
  codigo_referencia: string | null;
  es_hawb_padre?: boolean;
  paquetes?: PaqueteRelacionado[];
};

const pasosBase = [
  "Digitado",
  "Consolidado",
  "Manifestado",
  "Aerolinea Miami",
  "Aeropuerto Destino",
  "Pendiente de Aduanas",
  "Facturado Pendiente de Pago",
  "Entregada a destinatario",
];

const normalizar = (value: unknown) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatearFecha = (fecha?: string | null) => {
  if (!fecha) return "Sin fecha";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function RastreoPaquetesCliente() {
  const [hawb, setHawb] = useState("");
  const [guia, setGuia] = useState<GuiaTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [hawbActivo, setHawbActivo] = useState<string | null>(null);

  const paquetes = guia?.paquetes?.length ? guia.paquetes : guia ? [guia] : [];
  const paqueteActivo = useMemo(
    () => paquetes.find((item) => item.hawb === hawbActivo) || paquetes[0],
    [hawbActivo, paquetes]
  );
  const estados = paqueteActivo?.estados || guia?.estados || [];
  const ultimoEstado = estados[0]?.estado || paqueteActivo?.estado || guia?.estado || "En proceso";
  const indicePaso = Math.max(
    0,
    pasosBase.findIndex((paso) => normalizar(paso) === normalizar(ultimoEstado))
  );
  const progreso = Math.round(((indicePaso + 1) / pasosBase.length) * 100);

  const buscarGuia = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const valor = hawb.trim().toUpperCase();

    if (!valor) {
      setMensaje("Ingresa un HAWB para consultar.");
      setGuia(null);
      return;
    }

    setLoading(true);
    setMensaje("");
    setGuia(null);
    setHawbActivo(null);

    try {
      const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
      const response = await fetch(`/api/paquetes/tracking/mio/${encodeURIComponent(valor)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data) || data.length === 0) {
        setMensaje("No encontramos informacion para el HAWB ingresado.");
        return;
      }

      setGuia(data[0]);
      setHawbActivo(data[0]?.paquetes?.[0]?.hawb || data[0]?.hawb || null);
    } catch (error) {
      console.error("Error consultando tracking:", error);
      setMensaje("No fue posible consultar el HAWB. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientDashboardLayout scrollable>
      <div className="min-h-full bg-slate-200 px-5 py-8 text-slate-900 lg:px-10">
        <section className="mx-auto w-full max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-gradient-to-br from-red-950 to-slate-950 p-6 text-white shadow-xl shadow-slate-400/20">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">
                  Rastreo de paquetes
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Seguimiento en tiempo real
                </h1>
                <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-white/75">
                  Consulta un HAWB individual o un HAWB padre para visualizar el avance, los paquetes relacionados y su historial de estados.
                </p>

                <form onSubmit={buscarGuia} className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                    Numero HAWB
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-900/50" />
                      <input
                        value={hawb}
                        onChange={(event) => setHawb(event.target.value.toUpperCase())}
                        placeholder="Ej: COJA000000000001"
                        className="h-12 w-full rounded-xl border border-white/20 bg-white pl-12 pr-4 text-sm font-black text-slate-900 outline-none transition focus:ring-4 focus:ring-white/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-red-950 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Consultando" : "Rastrear"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>

                {mensaje && (
                  <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">
                    {mensaje}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-400/20">
              {!guia ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-950">
                    <PackageSearch className="h-10 w-10" />
                  </div>
                  <h2 className="mt-5 text-xl font-black text-gray-700">
                    Consulta visual de tu envio
                  </h2>
                  <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                    Al ingresar un HAWB veras el estado actual, progreso, paquetes hijos si aplica y el historial operativo.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-900">
                        {guia.es_hawb_padre ? "HAWB padre" : "HAWB"}
                      </p>
                      <h2 className="mt-1 break-all font-mono text-2xl font-black text-gray-800">
                        {guia.hawb}
                      </h2>
                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        {guia.es_hawb_padre ? `${paquetes.length} paquetes relacionados` : guia.tracking || "Tracking no disponible"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                      {ultimoEstado}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      <span>Progreso estimado</span>
                      <span>{progreso}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-950 via-red-700 to-emerald-700 transition-all"
                        style={{ width: `${progreso}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <ResumenCard icono={MapPin} label="Punto" value={paqueteActivo?.punto_control || guia.punto_control || "Sin punto"} />
                    <ResumenCard icono={Clock3} label="Ultima fecha" value={formatearFecha(estados[0]?.fecha)} />
                    <ResumenCard icono={Truck} label="Tienda" value={paqueteActivo?.tienda || guia.tienda || "No disponible"} />
                  </div>
                </div>
              )}
            </section>
          </div>

          {guia && (
            <div className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
              <aside className="rounded-[1.35rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-400/20">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-950">
                    <Boxes className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      Relacionados
                    </p>
                    <h2 className="font-black text-gray-700">Paquetes</h2>
                  </div>
                </div>

                <div className="space-y-2">
                  {paquetes.map((paquete) => (
                    <button
                      key={paquete.hawb}
                      onClick={() => setHawbActivo(paquete.hawb)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        paqueteActivo?.hawb === paquete.hawb
                          ? "border-red-900 bg-red-50 text-red-950"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-red-900/30"
                      }`}
                    >
                      <p className="font-mono text-sm font-black">{paquete.hawb}</p>
                      <p className="mt-1 text-xs font-semibold">{paquete.estado || "En proceso"}</p>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="rounded-[1.35rem] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-400/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-900">
                      Historial
                    </p>
                    <h2 className="mt-2 text-xl font-black text-gray-700">
                      Linea de tiempo de {paqueteActivo?.hawb}
                    </h2>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600">
                    {estados.length} estados
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {estados.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm font-bold text-slate-500">
                      Este HAWB aun no tiene historial disponible.
                    </div>
                  )}

                  {estados.map((estado, index) => (
                    <article key={estado.id} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${
                          index === 0 ? "bg-red-950" : "bg-slate-800"
                        }`}>
                          <Route className="h-5 w-5" />
                        </div>
                        {index < estados.length - 1 && <div className="mt-3 h-full min-h-16 w-px bg-slate-200" />}
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-black text-gray-700">{estado.estado || "Estado sin nombre"}</h3>
                            <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-red-900">
                              {estado.punto_control || "Sin punto de control"}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-slate-500">{formatearFecha(estado.fecha)}</p>
                        </div>
                        {estado.observaciones && (
                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                            {estado.observaciones}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </section>
      </div>
    </ClientDashboardLayout>
  );
}

function ResumenCard({
  icono: Icono,
  label,
  value,
}: {
  icono: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icono className="h-5 w-5 text-red-900" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-gray-700">{value}</p>
    </div>
  );
}
