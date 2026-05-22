import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import iconSearchTracking from "../assets/search-alt-2-svgrepo-com (1).svg";

type EstadoTracking = {
  id: number;
  fecha: string;
  estado: string | null;
  punto_control: string | null;
  observaciones: string | null;
  responsable: string | null;
};

type GuiaPublica = {
  hawb: string;
  tracking: string | null;
  contenido: string | null;
  peso: number | null;
  tienda: string | null;
  notas: string | null;
  cliente: string | null;
  codigo_referencia: string | null;
  estado: string | null;
  punto_control: string | null;
  fecha_registro: string | null;
  estados: EstadoTracking[];
};

const API_URL = "/api/paquetes/tracking/hawb";

export default function ConsultarGuiaHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hawb, setHawb] = useState("");
  const [guia, setGuia] = useState<GuiaPublica | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const buscarGuia = async (event?: FormEvent<HTMLFormElement>, hawbDirecto?: string) => {
    event?.preventDefault();

    const valor = (hawbDirecto ?? hawb).trim();
    if (!valor) {
      setMensaje("Ingresa un número HAWB para consultar el estado.");
      setGuia(null);
      return;
    }

    setHawb(valor.toUpperCase());
    setLoading(true);
    setMensaje("");
    setGuia(null);

    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(valor)}`);
      const data = await response.json();

      if (!response.ok || !Array.isArray(data) || data.length === 0) {
        setMensaje("No encontramos información para el HAWB ingresado.");
        return;
      }

      setGuia(data[0]);
    } catch (error) {
      console.error("Error consultando HAWB:", error);
      setMensaje("No fue posible conectar con el servidor. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hawbParam = searchParams.get("hawb") || searchParams.get("guia");
    if (hawbParam) {
      buscarGuia(undefined, hawbParam.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const limpiarConsulta = () => {
    setHawb("");
    setGuia(null);
    setMensaje("");
  };

  const estados = guia?.estados ?? [];
  const ultimoEstado = estados[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-gray-200 px-4 py-3 text-slate-900 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(127, 29, 29, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 29, 29, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />
      <div className="absolute -left-28 top-20 h-64 w-64 rotate-45 border border-red-900/20" />
      <div className="absolute -right-32 bottom-20 h-80 w-80 rotate-45 border border-red-900/20" />
      <div className="absolute left-0 top-0 h-full w-28 bg-gradient-to-r from-white/60 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-28 bg-gradient-to-l from-white/60 to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col justify-center">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-fit rounded-xl border border-red-900/15 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-900 shadow-sm transition hover:bg-white cursor-pointer"
          >
            ← Volver
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">
            Consulta pública de guías
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/90 shadow-2xl shadow-slate-400/40 backdrop-blur">
          <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-5 text-white sm:p-6">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.35)_49%,transparent_50%,transparent_100%)] bg-[length:28px_28px]" />
              </div>

              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/70">
                  Tracking empresarial
                </p>
                <h1 className="mt-3 max-w-md text-2xl font-black leading-tight sm:text-3xl">
                  Consulta el estado de tu HAWB
                </h1>
                <p className="mt-3 max-w-md text-sm font-medium leading-5 text-white/75">
                  Visualiza el avance de una guía sin iniciar sesión. Ingresa el número HAWB y revisa el último estado registrado.
                </p>
              </div>

              <form onSubmit={buscarGuia} className="relative mt-5 rounded-xl border border-white/15 bg-white/10 p-3">
                <label htmlFor="hawb" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/65">
                  Número HAWB
                </label>
                <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row lg:flex-col xl:flex-row">
                  <input
                    id="hawb"
                    value={hawb}
                    onChange={(event) => setHawb(event.target.value.toUpperCase())}
                    placeholder="Ej: COJA000000000001"
                    className="min-h-10 flex-1 rounded-xl border border-white/20 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-white focus:ring-4 focus:ring-white/20"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-h-10 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-red-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                  >
                    {loading ? "Buscando..." : "Consultar"}
                  </button>
                </div>
              </form>

              <div className="relative mt-4 grid grid-cols-2 gap-2.5">
                <div className="border border-white/15 bg-white/10 p-3 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Acceso</p>
                  <p className="mt-2 text-sm font-bold">Público</p>
                </div>
                <div className="border border-white/15 bg-white/10 p-3 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">Consulta</p>
                  <p className="mt-2 text-sm font-bold">HAWB</p>
                </div>
              </div>
            </aside>

            <div className="p-4 sm:p-5">
              {!guia && (
                <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-red-900/20 bg-red-900/5">
                    <img
                      src={iconSearchTracking}
                      alt="Consultar HAWB"
                      className="h-10 w-10"
                    />
                  </div>
                  <h2 className="mt-4 text-xl font-black text-gray-700">
                    Seguimiento rápido y seguro
                  </h2>
                  <p className="mt-2 max-w-md text-sm font-medium leading-5 text-slate-500">
                    El resultado mostrará estado actual, punto de control, datos principales y línea de tiempo del HAWB consultado.
                  </p>
                  {mensaje && (
                    <div className="mt-4 w-full max-w-md border-l-4 border-red-900 bg-red-900/5 px-4 py-2.5 text-left">
                      <p className="text-sm font-bold text-red-900">{mensaje}</p>
                    </div>
                  )}
                </div>
              )}

              {guia && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-slate-50/90 p-3.5 shadow-inner">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                          HAWB consultado
                        </p>
                        <h2 className="mt-1.5 break-all text-xl font-black tracking-[0.08em] text-red-900 sm:text-2xl">
                          {guia.hawb}
                        </h2>
                      </div>
                      <div className="w-fit rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-green-700">
                        {guia.estado ?? "En proceso"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoCard label="Punto de control" value={guia.punto_control ?? ultimoEstado?.punto_control ?? "Sin registro"} />
                    <InfoCard label="Tracking" value={guia.tracking ?? "No disponible"} />
                    <InfoCard label="Peso" value={guia.peso ? `${guia.peso} LBS` : "No disponible"} />
                    <InfoCard label="Fecha registro" value={guia.fecha_registro ?? "No disponible"} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                        Detalle de la guía
                      </p>
                      <div className="mt-3 space-y-2.5 text-sm">
                        <DetailRow label="Cliente" value={guia.cliente ?? "No disponible"} />
                        <DetailRow label="Casillero" value={guia.codigo_referencia ?? "No disponible"} />
                        <DetailRow label="Tienda" value={guia.tienda ?? "No disponible"} />
                        <DetailRow label="Contenido" value={guia.contenido ?? "No disponible"} />
                        <DetailRow label="Notas" value={guia.notas ?? "Sin notas"} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                            Línea de tiempo
                          </p>
                          <h3 className="mt-1 text-base font-bold text-gray-700">
                            Historial de estados
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={limpiarConsulta}
                          className="rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2 text-xs font-black text-slate-700 transition hover:bg-gray-100 cursor-pointer hover:shadow hover:-translate-y-0.5 hover:shadow-gray-300"
                        >
                          Nueva consulta
                        </button>
                      </div>

                      <div className="mt-4 max-h-[300px] space-y-3 overflow-y-auto pr-2">
                        {estados.length === 0 && (
                          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                            Aún no hay historial disponible para esta guía.
                          </p>
                        )}

                        {estados.map((item, index) => (
                          <div key={item.id} className="relative flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className={`h-3 w-3 rounded-full ${index === 0 ? "bg-red-900" : "bg-gray-300"}`} />
                              {index < estados.length - 1 && <span className="mt-2 h-full min-h-14 w-px bg-gray-200" />}
                            </div>
                            <div className="flex-1 rounded-xl border border-gray-200 bg-slate-50/80 p-3">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-bold text-gray-700">{item.estado ?? "Estado sin nombre"}</p>
                                <p className="text-xs font-semibold text-slate-500">{item.fecha}</p>
                              </div>
                              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-red-900">
                                {item.punto_control ?? "Sin punto de control"}
                              </p>
                              {item.observaciones && (
                                <p className="mt-2 text-sm leading-5 text-slate-600">{item.observaciones}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-xs font-semibold text-slate-600">
          Copyright © Wolfbox Software 2025
        </p>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1.5 break-words text-xs font-bold leading-5 text-slate-800">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 pb-2.5 last:border-b-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="max-w-full break-words font-semibold text-slate-800 sm:max-w-[60%] sm:text-right">{value}</span>
    </div>
  );
}
