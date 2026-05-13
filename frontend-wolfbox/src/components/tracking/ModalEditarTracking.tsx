import React, { useEffect, useState } from "react";
import axios from "axios";
import { TrackingEstadoEditable } from "../tracking/TablaResultadosTracking";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackingActual?: TrackingEstadoEditable;
  onSuccess?: () => void;
}

const opcionesEstadoFinal: Record<string, string[]> = {
  "Casilleros bodega": [
    "Llega bodega Bogot\u00e1",
    "Llega bodega Miami",
    "Reajuste liberado",
    "Digitado",
  ],
  "Otras operaciones": [
    "Facturado pendiente de pago",
    "Editada",
    "Reajuste aduanero",
    "Planilla de despacho",
    "Se retira del despacho",
    "Novedad",
    "Desbloqueado",
  ],
  "Tr\u00e1nsito a\u00e9reo": [
    "Consolidado",
    "Erolinea Miami",
    "Manifestado",
    "Arribo aeropuerto destino",
    "Pendiente de aduanas",
    "Faltante en descargue",
  ],
  "Tr\u00e1nsito terrestre": [
    "Entregado a transportadora",
    "Entregado a destinatario",
    "Novedad en tr\u00e1nsito",
    "Intento de entrega",
    "Devoluci\u00f3n",
  ],
};

const ModalEditarTracking: React.FC<Props> = ({
  isOpen,
  onClose,
  trackingActual,
  onSuccess,
}) => {
  const [puntoControl, setPuntoControl] = useState("");
  const [estadoFinal, setEstadoFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackingActual) return;

    setObservaciones(trackingActual.observaciones || "");
    setEstadoFinal(trackingActual.estado);

    for (const key in opcionesEstadoFinal) {
      if (opcionesEstadoFinal[key].includes(trackingActual.estado)) {
        setPuntoControl(key);
        break;
      }
    }
  }, [trackingActual]);

  if (!isOpen) return null;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingActual?.id || !trackingActual?.hawb) {
      alert("No se encontro informacion del estado a editar.");
      return;
    }

    try {
      setLoading(true);

      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
      const responsable = usuario.nombre || "Usuario desconocido";

      await axios.put(
        `/api/paquetes/tracking/estado/historial/${trackingActual.id}`,
        {
          estado: estadoFinal,
          punto_control: puntoControl,
          observaciones: observaciones.trim(),
          responsable,
        }
      );

      alert("Estado editado correctamente");
      onSuccess?.();
      onClose();
    } catch (error) {
      alert("Error al actualizar el estado.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[1.35rem] border border-white/20 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.45)] animate-fade-in">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-red-700 to-slate-300" />

        <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 px-5 py-4 text-white">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -left-20 bottom-0 h-36 w-36 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                Tracking operacional
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight">
                Editar estado
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white/85">
                  HAWB: {trackingActual?.hawb || "-"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-white/85">
                  Estado actual: {trackingActual?.estado || "-"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 transition hover:bg-white hover:text-red-950 focus:outline-none focus:ring-4 focus:ring-white/20 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4 bg-gradient-to-br from-white via-slate-50 to-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Punto de control *
              </label>
              <select
                value={puntoControl}
                onChange={(e) => {
                  setPuntoControl(e.target.value);
                  setEstadoFinal("");
                }}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-red-900 focus:ring-4 focus:ring-red-900/10"
                required
              >
                <option value="">Seleccionar</option>
                {Object.keys(opcionesEstadoFinal).map((pc) => (
                  <option key={pc} value={pc}>
                    {pc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                Estado final *
              </label>
              <select
                value={estadoFinal}
                onChange={(e) => setEstadoFinal(e.target.value)}
                disabled={!puntoControl}
                required
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold shadow-sm outline-none transition focus:ring-4 ${
                  !puntoControl
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "cursor-pointer border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-red-900 focus:ring-red-900/10"
                }`}
              >
                <option value="">Seleccionar</option>
                {opcionesEstadoFinal[puntoControl]?.map((op, i) => (
                  <option key={i} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-red-900 focus:ring-4 focus:ring-red-900/10"
              placeholder="Motivo del cambio"
            />
          </div>

          <div className="rounded-2xl border border-red-900/10 bg-red-50/70 px-4 py-3">
            <p className="text-xs font-semibold leading-relaxed text-slate-600">
              El cambio quedara registrado en el historial del HAWB con el usuario responsable de la sesion.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!estadoFinal || loading}
              className={`rounded-xl px-6 py-2.5 text-sm font-black text-white shadow-lg transition ${
                !estadoFinal || loading
                  ? "cursor-not-allowed bg-slate-400 shadow-none"
                  : "bg-red-900 shadow-red-950/20 hover:-translate-y-0.5 hover:bg-red-950 cursor-pointer"
              }`}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarTracking;
