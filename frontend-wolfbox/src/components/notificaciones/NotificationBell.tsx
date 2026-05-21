import axios from "axios";
import { Archive, Bell, CheckCheck, ExternalLink, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Notificacion = {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  entidad_tipo?: string | null;
  entidad_id?: number | null;
  url?: string | null;
  leida: boolean | number;
  fecha_creacion: string;
};

const tipoStyles = {
  success: {
    dot: "bg-green-900",
    ring: "ring-green-900/15",
    text: "text-green-900",
  },
  warning: {
    dot: "bg-amber-600",
    ring: "ring-amber-500/20",
    text: "text-amber-700",
  },
  danger: {
    dot: "bg-red-900",
    ring: "ring-red-900/15",
    text: "text-red-900",
  },
  info: {
    dot: "bg-slate-500",
    ring: "ring-slate-200",
    text: "text-slate-600",
  },
};

const normalizarLeida = (notificacion: Notificacion) =>
  Boolean(Number(notificacion.leida));

const formatFecha = (fecha: string) => {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const noLeidas = useMemo(
    () => notificaciones.filter((notificacion) => !normalizarLeida(notificacion)).length,
    [notificaciones]
  );

  const cargarNotificaciones = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const { data } = await axios.get("/api/notificaciones");
      setNotificaciones(Array.isArray(data?.notificaciones) ? data.notificaciones : []);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
    const timer = window.setInterval(() => cargarNotificaciones(true), 60000);

    return () => window.clearInterval(timer);
  }, [cargarNotificaciones]);

  const marcarLeida = async (id: number) => {
    setNotificaciones((prev) =>
      prev.map((notificacion) =>
        notificacion.id === id ? { ...notificacion, leida: true } : notificacion
      )
    );

    try {
      await axios.patch(`/api/notificaciones/${id}/leida`);
    } catch (error) {
      console.error("Error marcando notificacion:", error);
      cargarNotificaciones(true);
    }
  };

  const marcarTodas = async () => {
    setNotificaciones((prev) =>
      prev.map((notificacion) => ({ ...notificacion, leida: true }))
    );

    try {
      await axios.patch("/api/notificaciones/leer-todas");
    } catch (error) {
      console.error("Error marcando notificaciones:", error);
      cargarNotificaciones(true);
    }
  };

  const archivar = async (id: number) => {
    const actuales = notificaciones;
    setNotificaciones((prev) => prev.filter((notificacion) => notificacion.id !== id));

    try {
      await axios.patch(`/api/notificaciones/${id}/archivar`);
    } catch (error) {
      console.error("Error archivando notificacion:", error);
      setNotificaciones(actuales);
    }
  };

  const abrirNotificacion = async (notificacion: Notificacion) => {
    if (!normalizarLeida(notificacion)) {
      await marcarLeida(notificacion.id);
    }

    if (notificacion.url) {
      navigate(notificacion.url);
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80] flex flex-col items-end gap-3">
      {open && (
        <section className="w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.20)]">
          <header className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-red-950">
                Notificaciones
              </p>
              <p className="text-sm font-semibold text-slate-500">
                {noLeidas > 0 ? `${noLeidas} pendientes por revisar` : "Todo al dia"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-green-900/30 hover:text-green-900"
                  title="Marcar todas como leidas"
                >
                  <CheckCheck size={17} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-red-900/30 hover:text-red-950"
                title="Cerrar"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          <div className="max-h-[420px] overflow-y-auto p-3">
            {loading ? (
              <div className="flex min-h-36 items-center justify-center text-slate-500">
                <Loader2 className="mr-2 animate-spin" size={18} />
                Cargando notificaciones
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 text-slate-400" size={28} />
                <p className="text-sm font-bold text-slate-700">Sin novedades por ahora</p>
                <p className="mt-1 text-xs text-slate-500">
                  Cuando se cargue un comprobante, aparecera aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notificaciones.map((notificacion) => {
                  const leida = normalizarLeida(notificacion);
                  const styles =
                    tipoStyles[notificacion.tipo as keyof typeof tipoStyles] || tipoStyles.info;

                  return (
                    <article
                      key={notificacion.id}
                      className={`group rounded-2xl border p-3 transition ${
                        leida
                          ? "border-slate-100 bg-white hover:bg-slate-50"
                          : `border-white bg-slate-50 ring-1 ${styles.ring} hover:bg-white`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${styles.dot} ${
                            leida ? "opacity-35" : "shadow-[0_0_0_5px_rgba(15,23,42,.05)]"
                          }`}
                        />

                        <button
                          type="button"
                          onClick={() => abrirNotificacion(notificacion)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3
                              className={`text-sm font-black leading-tight ${
                                leida ? "text-slate-600" : "text-slate-900"
                              }`}
                            >
                              {notificacion.titulo}
                            </h3>
                            <span className="shrink-0 text-[11px] font-semibold text-slate-400">
                              {formatFecha(notificacion.fecha_creacion)}
                            </span>
                          </div>

                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {notificacion.mensaje}
                          </p>

                          {notificacion.url && (
                            <span
                              className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${styles.text}`}
                            >
                              Abrir modulo <ExternalLink size={13} />
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => archivar(notificacion.id)}
                          className="rounded-full p-1.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                          title="Archivar"
                        >
                          <Archive size={15} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative grid h-14 w-14 place-items-center rounded-full bg-red-950 text-white shadow-[0_16px_35px_rgba(69,10,10,.35)] transition hover:-translate-y-0.5 hover:bg-red-900 ${
          noLeidas > 0 ? "motion-safe:animate-bounce" : ""
        }`}
        aria-label="Abrir notificaciones"
      >
        <Bell size={24} />

        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-green-900 px-1.5 text-xs font-black text-white ring-4 ring-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>
    </div>
  );
}
