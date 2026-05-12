import { useEffect, useMemo, useState } from "react";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import iconPackage from "../assets/lockers-storage-svgrepo-com.svg";
import iconRequest from "../assets/file-ui-svgrepo-com.svg";
import iconGroup from "../assets/sort-random-svgrepo-com.svg";
import iconClients from "../assets/profile-circle-svgrepo-com.svg";

type ResumenDashboard = {
  paquetesDigitados: number;
  solicitudesSinAgrupar: number;
  solicitudesAgrupadas: number;
  clientesConPaquetesDigitados: number;
};

const emptyResumen: ResumenDashboard = {
  paquetesDigitados: 0,
  solicitudesSinAgrupar: 0,
  solicitudesAgrupadas: 0,
  clientesConPaquetesDigitados: 0,
};

const parseJsonResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return res.json();
};

const normalizeText = (value: unknown) => String(value || "").trim().toLowerCase();

export default function DashboardUsuarios() {
  const [resumen, setResumen] = useState<ResumenDashboard>(emptyResumen);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarResumen = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/dashboard/usuario");
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

        const paquetesDigitados = paquetesData.filter(
          (paquete: any) => normalizeText(paquete.estado) === "digitado"
        );
        const clientesConDigitados = new Set(
          paquetesDigitados
            .map((paquete: any) => paquete.codigo_referencia)
            .filter(Boolean)
        );

        const solicitudesAgrupadas = solicitudesData.filter((solicitud: any) => {
          const guiaAgrupada = normalizeText(solicitud.guia_agrupada);
          const hawbsAgrupados = normalizeText(solicitud.hawbs_agrupados);
          return Boolean(guiaAgrupada || hawbsAgrupados);
        });

        const solicitudesSinAgrupar = solicitudesData.filter((solicitud: any) => {
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
  }, []);

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
                      <span className="text-4xl font-black leading-none text-slate-950">
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
                  Flujo operativo del dia
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Usa estas tarjetas para priorizar digitacion pendiente, solicitudes listas para agrupar y clientes que ya tienen paquetes en estado digitado.
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
        </section>
      </div>
    </UserDashboardLayout>
  );
}
