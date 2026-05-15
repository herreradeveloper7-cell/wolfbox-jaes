import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";

interface EstadoHistorial {
  id: number;
  fecha: string;
  estado: string;
  observaciones: string;
  responsable: string;
}

interface Props {
  hawb: string;
  onClose: () => void;
}

const ModalHistorialGuia: React.FC<Props> = ({ hawb, onClose }) => {
  const [historial, setHistorial] = useState<EstadoHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 10);
    fetchHistorial();
  }, [hawb]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fetchHistorial = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/paquetes/tracking/hawb/${hawb}`
      );

      if (!response.ok) throw new Error("No se pudo obtener el historial");

      const data = await response.json();
      const guia = data[0];

      if (!guia) {
        setHistorial([]);
        Swal.fire(
          "⚠️ Sin historial",
          "La guía no tiene estados registrados.",
          "info"
        );
        return;
      }

      const historialOrdenado =
        guia.estados?.sort(
          (a: any, b: any) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        ) || [];

      setHistorial(historialOrdenado);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo cargar el historial de la guía", "error");
      setHistorial([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return createPortal (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/70 px-4 py-6 backdrop-blur-md transition-opacity duration-300 ${
        isVisible && !isClosing ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.7rem] border border-white/20 bg-gray-50 shadow-[0_30px_90px_rgba(0,0,0,0.45)] transition-all duration-300 ${
          isVisible && !isClosing
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />

        <button
          onClick={handleClose}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-red-900/10 bg-white/90 text-lg font-black text-red-950 shadow-md transition-all duration-200 hover:scale-105 hover:bg-red-950 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-900/20"
        >
          ✕
        </button>

        <header className="relative shrink-0 overflow-hidden border-b border-gray-200/70 bg-gradient-to-br from-white via-red-50/30 to-gray-50 px-6 py-8 sm:px-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-red-900/10 bg-red-900/5" />
          <div className="absolute bottom-0 right-0 h-32 w-96 rounded-tl-full bg-red-950/5" />
          <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-white/70 to-transparent" />

          <div className="relative pr-12">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-900/20 bg-red-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-red-950">
                Historial de estados
              </span>

              <span className="rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 font-mono text-xs font-bold text-gray-700 shadow-sm">
                HAWB {hawb}
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-gray-600">
              Trazabilidad de la guía
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-semibold text-gray-600">
              Consulta cronológica de los estados registrados, observaciones y
              responsable de cada movimiento.
            </p>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {loading ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-red-900/20 border-r-red-900 border-t-red-900" />
              <p className="text-lg font-black text-gray-800">
                Cargando historial...
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-500">
                Estamos consultando los movimientos de la guía.
              </p>
            </div>
          ) : historial.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-red-900/20 bg-white/80 p-8 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl font-black text-red-950">
                !
              </div>
              <p className="text-xl font-black text-gray-600">
                No hay historial para esta guía.
              </p>
              <p className="mt-2 max-w-md text-sm font-semibold text-gray-500">
                Cuando se registren estados asociados al HAWB, aparecerán en
                esta sección.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_18px_45px_rgba(17,24,39,0.08)]">
              <div className="flex flex-col gap-2 border-b border-gray-200/70 bg-gradient-to-r from-red-950 to-red-900 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-100/70">
                    Movimientos registrados
                  </p>
                  <h3 className="mt-1 text-lg font-black">
                    Estados de la guía
                  </h3>
                </div>

                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-bold text-red-100 backdrop-blur-md">
                  {historial.length} registros
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50">
                    <tr className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                      <th className="px-5 py-4 text-left font-black">Fecha</th>
                      <th className="px-5 py-4 text-left font-black">Estado</th>
                      <th className="px-5 py-4 text-left font-black">
                        Observaciones
                      </th>
                      <th className="px-5 py-4 text-left font-black">
                        Responsable
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {historial.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-white transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/70 hover:to-transparent"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-gray-700">
                          {item.fecha}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-red-900/15 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-950">
                            {item.estado || "Sin estado"}
                          </span>
                        </td>

                        <td className="max-w-md px-5 py-4 text-sm font-medium leading-relaxed text-gray-600">
                          {item.observaciones || "—"}
                        </td>

                        <td className="px-5 py-4 font-bold text-gray-800">
                          {item.responsable || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        <footer className="shrink-0 border-t border-gray-200/70 bg-gradient-to-r from-white via-gray-50 to-white px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-gray-500">
              Información generada desde el historial operativo del sistema.
            </p>

            <button
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:from-red-900 hover:to-red-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-900/20"
            >
              Cerrar
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default ModalHistorialGuia;