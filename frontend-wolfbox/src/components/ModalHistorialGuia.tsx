import React, { useEffect, useState } from "react";
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

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/paquetes/tracking/hawb/${hawb}`
      );

      if (!response.ok) throw new Error("No se pudo obtener el historial");

      const data = await response.json();
      const guia = data[0];

      if (!guia) {
        setHistorial([]);
        Swal.fire("⚠️ Sin historial", "La guía no tiene estados registrados.", "info");
        return;
      }

      const historialOrdenado = guia.estados?.sort(
        (a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
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

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/40 z-50 transition-opacity duration-300 ${
        isVisible && !isClosing ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative transform transition-all duration-300 ${
          isVisible && !isClosing ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()} 
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Historial de Estados — {hawb}
        </h2>

        {loading ? (
          <p className="text-gray-500 text-center">Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p className="text-gray-500 text-center">No hay historial para esta guía.</p>
        ) : (
          <div className="overflow-x-auto max-h-96 border rounded-lg">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left border">Fecha</th>
                  <th className="px-3 py-2 text-left border">Estado</th>
                  <th className="px-3 py-2 text-left border">Observaciones</th>
                  <th className="px-3 py-2 text-left border">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-gray-50 transition">
                    <td className="px-3 py-2 border">{item.fecha}</td>
                    <td className="px-3 py-2 border">{item.estado}</td>
                    <td className="px-3 py-2 border">{item.observaciones}</td>
                    <td className="px-3 py-2 border">{item.responsable}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalHistorialGuia;
