import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BadgePercent,
  Clock3,
  ExternalLink,
  MapPinned,
  PackageCheck,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import ClientDashboardLayout from "../layouts/ClientDashboardLayout";

type Cliente = {
  id?: number;
  nombre: string;
  genero?: string;
  codigoReferencia?: string;
  codigo_referencia?: string;
};

type Promocion = {
  id: number;
  tienda: string;
  titulo: string;
  descripcion: string;
  categoria?: string | null;
  evento?: string | null;
  url_destino: string;
  imagen?: string | null;
  fecha_fin: string;
  destacada: boolean;
};

const procesos = [
  {
    titulo: "Compra recibida",
    detalle: "Tu paquete llega a casillero Miami y queda listo para validacion.",
    icono: ShoppingBag,
  },
  {
    titulo: "Digitacion",
    detalle: "Registramos HAWB, tracking, contenido, peso y datos principales.",
    icono: PackageCheck,
  },
  {
    titulo: "Solicitud de despacho",
    detalle: "Seleccionas los paquetes disponibles y eliges destinatario.",
    icono: Truck,
  },
  {
    titulo: "Transito internacional",
    detalle: "Consolidamos, manifestamos y actualizamos puntos de control.",
    icono: Plane,
  },
  {
    titulo: "Entrega",
    detalle: "El despacho finaliza con entrega o novedad informada.",
    icono: MapPinned,
  },
];

export default function DashboardClients() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargandoPromociones, setCargandoPromociones] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cliente") || sessionStorage.getItem("cliente");

    if (!stored) {
      navigate("/login");
      return;
    }

    try {
      setCliente(JSON.parse(stored));
    } catch (error) {
      console.error("Error al parsear cliente:", error);
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const cargarPromociones = async () => {
      try {
        const { data } = await axios.get("/api/promociones/activas");
        setPromociones(Array.isArray(data.promociones) ? data.promociones : []);
      } catch (error) {
        console.error("Error cargando promociones:", error);
        setPromociones([]);
      } finally {
        setCargandoPromociones(false);
      }
    };
    cargarPromociones();
  }, []);

  const codigoCasillero = useMemo(
    () => cliente?.codigoReferencia || cliente?.codigo_referencia || "No disponible",
    [cliente]
  );

  if (!cliente) {
    return (
      <ClientDashboardLayout>
        <div className="flex h-full items-center justify-center text-gray-600">
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-center shadow-sm">
            <Clock3 className="mx-auto mb-3 h-7 w-7 text-red-950" />
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">
              Cargando casillero
            </p>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  return (
    <ClientDashboardLayout scrollable>
      <div className="mx-auto w-full max-w-7xl px-2 pb-10 text-gray-800">
        <section className="relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-6 text-white shadow-xl shadow-slate-400/20 sm:p-8">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                Portal cliente
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Hola, {cliente.nombre}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/75">
                Gestiona tus paquetes disponibles, solicita despachos, registra destinatarios y consulta el avance de tus envios desde tu casillero.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                Codigo de casillero
              </p>
              <p className="mt-2 break-all font-mono text-2xl font-black text-white">
                {codigoCasillero}
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                Cuenta activa
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_390px]">
          <div className="rounded-[1.35rem] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-400/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                  Linea de tiempo
                </p>
                <h2 className="mt-1 text-xl font-black text-gray-800">
                  Proceso de tu envio
                </h2>
              </div>
              <p className="max-w-md text-sm font-semibold leading-6 text-gray-500">
                Esta guia visual resume el recorrido normal de tus paquetes dentro de WolfBox.
              </p>
            </div>

            <div className="mt-7 grid gap-4">
              {procesos.map((paso, index) => {
                const Icon = paso.icono;
                const isLast = index === procesos.length - 1;

                return (
                  <div key={paso.titulo} className="relative grid grid-cols-[48px_1fr] gap-4">
                    {!isLast && (
                      <span className="absolute left-6 top-12 h-[calc(100%+1rem)] w-px bg-gradient-to-b from-red-200 to-gray-200" />
                    )}
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-900/10 bg-red-50 text-red-950 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-slate-50/80 px-4 py-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-black text-gray-800">{paso.titulo}</h3>
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                          Paso {index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-6 text-gray-500">
                        {paso.detalle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-[1.35rem] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-400/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                  Tiendas USA
                </p>
                <h2 className="mt-1 text-xl font-black text-gray-800">
                  Promociones
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-950">
                <BadgePercent className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {cargandoPromociones ? (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-gray-100 bg-slate-50 text-sm font-bold text-gray-500">
                  Cargando promociones...
                </div>
              ) : promociones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50/80 px-5 py-8 text-center">
                  <BadgePercent className="mx-auto h-7 w-7 text-gray-300" />
                  <p className="mt-3 text-sm font-black text-gray-700">No hay ofertas activas</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-gray-500">Publicaremos aquí las próximas temporadas y descuentos especiales.</p>
                </div>
              ) : promociones.slice(0, 3).map((promo) => (
                <div
                  key={promo.id}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {promo.imagen && <img src={promo.imagen} alt={promo.titulo} loading="lazy" className="h-32 w-full object-cover" />}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-950">{promo.tienda}</p>
                      <span className="rounded-full border border-red-900/10 bg-red-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-red-950">{promo.evento || promo.categoria || "Oferta"}</span>
                    </div>
                    <h3 className="mt-2 text-base font-black text-gray-800">{promo.titulo}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-gray-500">{promo.descripcion}</p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold text-gray-400">Hasta {new Date(promo.fecha_fin).toLocaleDateString("es-CO")}</span>
                      <a href={promo.url_destino} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-red-950 hover:underline">Ver oferta <ExternalLink size={13} /></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </ClientDashboardLayout>
  );
}
