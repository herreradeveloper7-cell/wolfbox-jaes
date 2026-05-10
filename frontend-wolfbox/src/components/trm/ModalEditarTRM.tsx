import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function ModalEditarTRM({
  fila,
  onClose,
  onSave
}: {
  fila: any;
  onClose: () => void;
  onSave: () => void;
}) {
  const [valor, setValor] = useState("");
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    if (fila) {
      setValor(String(fila.valor));
      setFecha(fila.fecha?.split("T")[0] || "");
    }
  }, [fila]);

  const handleActualizar = async () => {
    if (!valor.trim() || isNaN(Number(valor))) {
      Swal.fire("Valor inválido", "Ingresa un número válido", "warning");
      return;
    }

    if (!fecha.trim()) {
      Swal.fire("Fecha requerida", "Selecciona una fecha", "warning");
      return;
    }

    try {
      await axios.put(`/api/trm/${fila.id}`, {
        valor: Number(valor),
        fecha: fecha    // <-- manda la fecha exacta
      });

      await onSave();
      Swal.fire("Actualizado", "TRM actualizado correctamente", "success");

    } catch (e) {
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] sm:w-[430px] p-7 animate-fade-in">

        <h2 className="text-2xl font-bold text-red-900 mb-5">Editar TRM</h2>

        <label className="block font-semibold text-gray-700 mb-1">Fecha *</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg w-full p-2 mb-4 text-gray-800 focus:ring-2 focus:ring-red-900/40 outline-none"
        />

        <label className="block font-semibold text-gray-700 mb-1">Valor (COP) *</label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="border border-gray-300 rounded-lg w-full p-2 text-gray-800 focus:ring-2 focus:ring-red-900/40 outline-none"
        />

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="bg-gray-200 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleActualizar}
            className="bg-red-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-950 shadow-md"
          >
            Guardar cambios
          </button>
        </div>

      </div>
    </div>
  );
}
