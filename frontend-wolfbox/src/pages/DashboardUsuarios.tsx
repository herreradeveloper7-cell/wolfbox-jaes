import { useEffect, useMemo, useState } from "react";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import iconPackage from "../assets/lockers-storage-svgrepo-com.svg";
import iconRequest from "../assets/file-ui-svgrepo-com.svg";
import iconGroup from "../assets/sort-random-svgrepo-com.svg";
import iconClients from "../assets/profile-circle-svgrepo-com.svg";
import { CalendarRange, ChevronDown } from "lucide-react";

type ResumenDashboard = {
  paquetesDigitados: number;
  solicitudesSinAgrupar: number;
  solicitudesAgrupadas: number;
  clientesConPaquetesDigitados: number;
};

type PeriodoDashboard = "7d" | "15d" | "1m" | "1y" | "todos";

const emptyResumen: ResumenDashboard = {
  paquetesDigitados: 0,
  solicitudesSinAgrupar: 0,
  solicitudesAgrupadas: 0,
  clientesConPaquetesDigitados: 0,
};

const flujoEstadosPaquete = [
  "Digitado",
  "Consolidado",
  "Manifestado",
  "Aerolinea Miami",
  "Aeropuerto Destino",
  "Pendiente de Aduanas",
  "Facturado Pendiente de Pago",
  "Desbloqueado",
  "Entregada a transportadora",
  "Entregada a destinatario",
];

const parseJsonResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return res.json();
};

const normalizeText = (value: unknown) => String(value || "").trim().toLowerCase();

const periodosDashboard: { value: PeriodoDashboard; label: string; detail: string }[] = [
  { value: "7d", label: "Ultimos 7 dias", detail: "Pulso operativo reciente" },
  { value: "15d", label: "Ultimos 15 dias", detail: "Ventana quincenal" },
  { value: "1m", label: "Ultimo mes", detail: "Ultimos 30 dias" },
  { value: "1y", label: "Ultimo año", detail: "Ultimos 365 dias" },
  { value: "todos", label: "Todos", detail: "Historico completo" },
];

const diasPorPeriodo: Partial<Record<PeriodoDashboard, number>> = {
  "7d": 7,
  "15d": 15,
  "1m": 30,
  "1y": 365,
};

const getFechaRegistro = (item: any) =>
  item?.fecha_registro || item?.fecha || item?.fecha_creacion || item?.fecha_digitacion || "";

const estaEnPeriodo = (item: any, periodo: PeriodoDashboard) => {
  const dias = diasPorPeriodo[periodo];
  if (!dias) return true;

  const fechaValor = getFechaRegistro(item);
  if (!fechaValor) return false;

  const fecha = new Date(fechaValor);
  if (Number.isNaN(fecha.getTime())) return false;

  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  desde.setDate(desde.getDate() - dias);

  return fecha >= desde;
};

export default function DashboardUsuarios() {
  const [resumen, setResumen] = useState<ResumenDashboard>(emptyResumen);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoDashboard>("7d");

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({ periodo });
        const res = await fetch(`/api/dashboard/usuario?${params.toString()}`);
        const data = await parseJsonResponse(res);

        if (res.ok && data?.ok) {
          setResumen({
            ...emptyResumen,
            ...data.resumen,
          });
          return;
        }

        if (res.status !== 404) {
          throw new Error(data?.mensaje || "No se pudo cargar el resumen");
        }

        const [paquetesRes, solicitudesRes] = await Promise.all([
          fetch("/api/paquetes"),
          fetch("/api/solicitudes/listar"),
        ]);

        const paquetesData = await parseJsonResponse(paquetesRes);
        const solicitudesData = await parseJsonResponse(solicitudesRes);

        if (!paquetesRes.ok || !solicitudesRes.ok || !Array.isArray(paquetesData) || !Array.isArray(solicitudesData)) {
          throw new Error("No se pudo cargar el resumen desde endpoints existentes");
        }

        const paquetesFiltrados = paquetesData.filter((paquete: any) =>
          estaEnPeriodo(paquete, periodo)
        );
        const solicitudesFiltradas = solicitudesData.filter((solicitud: any) =>
          estaEnPeriodo(solicitud, periodo)
        );

        const paquetesDigitados = paquetesFiltrados.filter(
          (paquete: any) => normalizeText(paquete.estado) === "digitado"
        );
        const clientesConDigitados = new Set(
          paquetesDigitados
            .map((paquete: any) => paquete.codigo_referencia)
            .filter(Boolean)
        );

        const solicitudesAgrupadas = solicitudesFiltradas.filter((solicitud: any) => {
          const guiaAgrupada = normalizeText(solicitud.guia_agrupada);
          const hawbsAgrupados = normalizeText(solicitud.hawbs_agrupados);
          return Boolean(guiaAgrupada || hawbsAgrupados);
        });

        const solicitudesSinAgrupar = solicitudesFiltradas.filter((solicitud: any) => {
          const guiaAgrupada = normalizeText(solicitud.guia_agrupada);
          const hawbsAgrupados = normalizeText(solicitud.hawbs_agrupados);
          const hawbsNormales = normalizeText(solicitud.hawbs_normales);
          return Boolean(hawbsNormales) && !guiaAgrupada && !hawbsAgrupados;
        });

        setResumen({
          paquetesDigitados: paquetesDigitados.length,
          solicitudesSinAgrupar: solicitudesSinAgrupar.length,
          solicitudesAgrupadas: solicitudesAgrupadas.length,
          clientesConPaquetesDigitados: clientesConDigitados.size,
        });
      } catch (err) {
        console.error("Error cargando resumen dashboard:", err);
        setError("No se pudo cargar el resumen operativo.");
      } finally {
        setLoading(false);
      }
    };

    cargarResumen();
  }, [periodo]);

  const periodoSeleccionado = useMemo(
    () => periodosDashboard.find((item) => item.value === periodo) || periodosDashboard[0],
    [periodo]
  );

  const tarjetas = useMemo(
    () => [
      {
        title: "Paquetes digitados",
        value: resumen.paquetesDigitados,
        detail: "Estado actual: Digitado",
        icon: iconPackage,
        accent: "from-red-950 to-red-800",
        ring: "ring-red-900/15",
      },
      {
        title: "Solicitudes sin agrupar",
        value: resumen.solicitudesSinAgrupar,
        detail: "Creadas para envio",
        icon: iconRequest,
        accent: "from-slate-950 to-slate-700",
        ring: "ring-slate-900/15",
      },
      {
        title: "Solicitudes agrupadas",
        value: resumen.solicitudesAgrupadas,
        detail: "Con HAWB padre asociado",
        icon: iconGroup,
        accent: "from-emerald-900 to-emerald-700",
        ring: "ring-emerald-900/15",
      },
      {
        title: "Clientes activos",
        value: resumen.clientesConPaquetesDigitados,
        detail: "Con al menos 1 paquete digitado",
        icon: iconClients,
        accent: "from-red-900 to-slate-900",
        ring: "ring-red-900/15",
      },
    ],
    [resumen]
  );

  return (
    <UserDashboardLayout scrollable>
      <div className="min-h-full bg-slate-200 px-5 py-8 text-slate-900 lg:px-10">
        <section className="mx-auto w-full max-w-7xl">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-red-900">
                Centro operativo
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-700 sm:text-4xl">
                Dashboard de Usuarios
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
                Monitorea digitacion, solicitudes de envio, agrupaciones y clientes con operacion activa.
              </p>
            </div>

            <div className="relative w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/90 p-1 shadow-xl shadow-slate-400/20 ring-1 ring-red-900/10">
              <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-white to-gray-600" />
              <div className="relative rounded-[1.1rem] border border-white/80 bg-gradient-to-br from-white via-slate-50 to-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-900 to-slate-900 text-white shadow-lg shadow-red-900/20">
                      <CalendarRange className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-900">
                        Rango
                      </p>
                      <p className="text-sm font-black text-gray-700">
                        {periodoSeleccionado.detail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={periodo}
                    onChange={(event) => setPeriodo(event.target.value as PeriodoDashboard)}
                    className="h-12 w-full appearance-none rounded-2xl border border-slate-200 px-4 pr-11 text-sm font-black text-gray-600 shadow-inner outline-none transition hover:border-red-900/40 focus:border-red-900 focus:ring-4 focus:ring-red-950/15"
                  >
                    {periodosDashboard.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-700" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tarjetas.map((card) => (
              <article
                key={card.title}
                className={`group relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-400/20 ring-1 ${card.ring} transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-red-900/5 blur-3xl transition group-hover:bg-red-900/10" />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {card.title}
                    </p>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="text-4xl font-black leading-none text-gray-700">
                        {loading ? "--" : card.value.toLocaleString("es-CO")}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-500">
                      {card.detail}
                    </p>
                  </div>

                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} shadow-lg`}>
                    <img src={card.icon} alt="" className="h-6 w-6 brightness-0 invert" />
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/90 shadow-xl shadow-slate-400/20">
            <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-red-900">
                  Lectura rapida
                </p>
                <h2 className="mt-2 text-xl font-black text-gray-700">
                  Flujo operativo filtrado
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Usa estas tarjetas para priorizar digitacion pendiente, solicitudes listas para agrupar y clientes dentro del rango seleccionado.
                </p>
              </div>

              <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Total visible
                </p>
                <p className="mt-2 text-3xl font-black text-red-900">
                  {(resumen.solicitudesSinAgrupar + resumen.solicitudesAgrupadas).toLocaleString("es-CO")}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Solicitudes con paquetes asociados
                </p>
              </div>
            </div>
          </div>

                    <section className="mt-6 overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/95 shadow-xl shadow-slate-400/20">
            <div className="relative border-b border-slate-200 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-red-700 to-slate-300" />
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-red-950/5" />

              <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-red-900">
                    Ruta de estados
                  </p>
                  <h2 className="mt-2 text-xl font-black text-gray-700">
                    Linea de tiempo operativa del paquete
                  </h2>
                </div>
                <p className="max-w-xl text-sm font-semibold leading-5 text-slate-500">
                  Secuencia esperada desde digitacion hasta entrega final al destinatario.
                </p>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-white via-slate-50 to-white p-6">
              <div className="pointer-events-none absolute left-10 right-10 top-[4.9rem] hidden h-px bg-gradient-to-r from-red-950/10 via-red-900/45 to-emerald-800/20 xl:block" />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {flujoEstadosPaquete.map((estado, index) => {
                  const esFinal = index === flujoEstadosPaquete.length - 1;
                  const accent = esFinal
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : index === 0
                    ? "border-red-900/15 bg-red-50 text-red-950"
                    : "border-slate-200 bg-white text-gray-600";

                  return (
                    <article
                      key={estado}
                      className={`group relative min-h-[112px] overflow-hidden rounded-2xl border p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${accent}`}
                    >
                      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-current opacity-[0.04]" />
                      <div className="relative flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black shadow-sm ${
                          esFinal
                            ? "bg-emerald-800 text-white"
                            : index === 0
                            ? "bg-red-950 text-white"
                            : "bg-slate-900 text-white"
                        }`}>
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-55">
                            Estado
                          </p>
                          <h3 className="mt-1 text-sm font-black leading-5">
                            {estado}
                          </h3>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </section>
      </div>
    </UserDashboardLayout>
  );
}
