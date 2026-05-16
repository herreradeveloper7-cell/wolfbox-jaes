import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Save, X } from "lucide-react";

type Despacho = {
  id: number;
  codigo: string;
  nombre?: string | null;
  observaciones?: string | null;
  oficina_id?: number | null;
  oficina?: string | null;
  transportadora_id?: number | null;
  transportadora_nombre?: string | null;
  fecha_operativa?: string | null;
  estado: "abierto" | "cerrado" | string;
  creado_por?: string | null;
  fecha_creacion?: string | null;
};

type Oficina = {
  id: number;
  nombre: string;
};

type Transportadora = {
  id: number;
  oficina_id: number;
  nombre: string;
};

type Props = {
  despacho: Despacho;
  oficinasCatalogo: Oficina[];
  onClose: () => void;
  onUpdated: () => void;
};

export default function ModalEditarDespacho({
  despacho,
  oficinasCatalogo,
  onClose,
  onUpdated,
}: Props) {
  const [nombre, setNombre] = useState(despacho.nombre || "");
  const [observaciones, setObservaciones] = useState(despacho.observaciones || "");
  const [oficinaId, setOficinaId] = useState(
    despacho.oficina_id ? String(despacho.oficina_id) : ""
  );
  const [oficina, setOficina] = useState(despacho.oficina || "");
  const [transportadoraId, setTransportadoraId] = useState(
    despacho.transportadora_id ? String(despacho.transportadora_id) : ""
  );
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [activo, setActivo] = useState(despacho.estado?.toLowerCase() !== "cerrado");
  const [guardando, setGuardando] = useState(false);
  const [loadingTransportadoras, setLoadingTransportadoras] = useState(false);

  useEffect(() => {
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  useEffect(() => {
    if (oficinaId) {
      cargarTransportadoras(oficinaId, transportadoraId);
      return;
    }

    if (despacho.oficina) {
      const oficinaExistente = oficinasCatalogo.find(
        (item) => item.nombre === despacho.oficina
      );

      if (oficinaExistente) {
        setOficinaId(String(oficinaExistente.id));
        setOficina(oficinaExistente.nombre);
        cargarTransportadoras(
          String(oficinaExistente.id),
          despacho.transportadora_id ? String(despacho.transportadora_id) : ""
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oficinasCatalogo, despacho.id]);

  const cargarTransportadoras = async (
    nextOficinaId: string,
    selectedTransportadoraId = ""
  ) => {
    if (!nextOficinaId) {
      setTransportadoras([]);
      return;
    }

    setLoadingTransportadoras(true);
    try {
      const { data } = await axios.get(
        `/api/transportadoras?oficina_id=${nextOficinaId}`
      );
      const lista = Array.isArray(data.transportadoras)
        ? data.transportadoras
        : [];
      setTransportadoras(lista);

      if (selectedTransportadoraId) {
        const existe = lista.some(
          (item: Transportadora) => String(item.id) === selectedTransportadoraId
        );
        setTransportadoraId(existe ? selectedTransportadoraId : "");
      }
    } catch (error) {
      console.error("Error cargando transportadoras:", error);
      setTransportadoras([]);
      Swal.fire("Error", "No se pudieron cargar las transportadoras", "error");
    } finally {
      setLoadingTransportadoras(false);
    }
  };

  const seleccionarOficina = (value: string) => {
    const oficinaSeleccionada = oficinasCatalogo.find(
      (item) => String(item.id) === value
    );

    setOficinaId(value);
    setOficina(oficinaSeleccionada?.nombre || "");
    setTransportadoraId("");
    cargarTransportadoras(value);
  };

  const guardar = async () => {
    if (!nombre.trim() || !oficinaId || !transportadoraId) {
      Swal.fire("Aviso", "Completa los campos requeridos del despacho", "warning");
      return;
    }

    setGuardando(true);
    try {
      await axios.put(`/api/despachos/${despacho.id}`, {
        nombre: nombre.trim(),
        observaciones,
        oficina_id: Number(oficinaId),
        oficina,
        transportadora_id: Number(transportadoraId),
        fecha: despacho.fecha_operativa || despacho.fecha_creacion,
      });

      const estadoActual = despacho.estado?.toLowerCase();
      const estadoNuevo = activo ? "abierto" : "cerrado";

      if (estadoActual !== estadoNuevo) {
        await axios.patch(`/api/despachos/${despacho.id}/estado`, {
          estado: estadoNuevo,
        });
      }

      Swal.fire("Listo", "Despacho actualizado correctamente", "success");
      onUpdated();
      onClose();
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo actualizar el despacho",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.45)]">
        <div className="relative overflow-hidden bg-gradient-to-r from-red-950 via-red-900 to-slate-950 px-6 py-6 text-white">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition hover:bg-white/20"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>

          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-100/80">
            Edicion operativa
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            Editar despacho
          </h2>
          <p className="mt-1 font-mono text-sm font-bold text-red-50/80">
            {despacho.codigo}
          </p>
        </div>

        <div className="max-h-[calc(92vh-112px)] overflow-y-auto">
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                Descripcion *
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                Fecha
              </label>
              <input
                value={despacho.fecha_operativa || despacho.fecha_creacion || ""}
                readOnly
                className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-green-700">
                Usuario *
              </label>
              <input
                value={despacho.creado_por || "Usuario del sistema"}
                readOnly
                className="w-full rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-gray-700 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                Oficina *
              </label>
              <select
                value={oficinaId}
                onChange={(e) => seleccionarOficina(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
              >
                <option value="">Seleccionar oficina</option>
                {oficinasCatalogo.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                Transportadora *
              </label>
              <select
                value={transportadoraId}
                onChange={(e) => setTransportadoraId(e.target.value)}
                disabled={!oficinaId || loadingTransportadoras}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">
                  {loadingTransportadoras
                    ? "Cargando..."
                    : oficinaId
                      ? "Seleccionar transportadora"
                      : "Selecciona una oficina"}
                </option>
                {transportadoras.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                Estado del despacho
              </label>
              <label className="flex h-[46px] cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-slate-50/80 px-4">
                <span className={`text-sm font-black ${activo ? "text-green-700" : "text-gray-500"}`}>
                  {activo ? "Activo" : "Inactivo"}
                </span>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="sr-only"
                />
                <span className={`relative h-8 w-16 rounded-full shadow-inner transition ${activo ? "bg-green-500" : "bg-gray-400"}`}>
                  <span
                    className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                      activo ? "translate-x-8" : "translate-x-0"
                    }`}
                  />
                </span>
              </label>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-200 bg-gradient-to-r from-slate-50 via-white to-red-50/30 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-black text-gray-600 shadow-sm transition hover:border-gray-300"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              <Save className="h-4 w-4" />
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
