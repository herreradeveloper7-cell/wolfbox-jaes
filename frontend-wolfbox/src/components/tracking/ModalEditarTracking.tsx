import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrackingEstadoEditable } from "../tracking/TablaResultadosTracking";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trackingActual?: TrackingEstadoEditable;
  onSuccess?: () => void;
}

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

  const opcionesEstadoFinal: Record<string, string[]> = {
    "Casilleros bodega": [
      "Llega bodega Bogotá",
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
    "Tránsito aéreo": [
      "Consolidado",
      "Erolinea Miami",
      "Manifestado",
      "Arribo aeropuerto destino",
      "Pendiente de aduanas",
      "Faltante en descargue",
    ],
    "Tránsito terrestre": [
      "Entregado a transportadora",
      "Entregado a destinatario",
      "Novedad en tránsito",
      "Intento de entrega",
      "Devolución",
    ],
  };

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
      alert("No se encontró información del estado a editar.");
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
          responsable
        }
      );

      alert("✅ Estado editado correctamente");
      onSuccess?.();
      onClose();
    } catch (error) {
      alert("❌ Error al actualizar el estado.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg animate-fade-in">
        <div className="border-b px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            ✏️ Editar Estado
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleGuardar} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Punto de control *
            </label>
            <select
              value={puntoControl}
              onChange={(e) => {
                setPuntoControl(e.target.value);
                setEstadoFinal("");
              }}
              className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
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
            <label className="block text-sm font-medium text-gray-700">
              Estado final *
            </label>
            <select
              value={estadoFinal}
              onChange={(e) => setEstadoFinal(e.target.value)}
              disabled={!puntoControl}
              required
              className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Seleccionar</option>
              {opcionesEstadoFinal[puntoControl]?.map((op, i) => (
                <option key={i} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
              placeholder="Motivo del cambio"
            />
          </div>

          <div className="flex justify-end mt-6 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!estadoFinal || loading}
              className={`px-4 py-2 rounded text-white ${
                loading
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarTracking;
