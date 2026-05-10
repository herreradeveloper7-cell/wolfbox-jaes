import { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function ModalCrearTRM({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {

  const hoy = new Date().toISOString().split("T")[0]; 

  const [fecha, setFecha] = useState(hoy);
  const [valor, setValor] = useState("");

  const handleGuardar = async () => {
    if (!valor.trim() || isNaN(Number(valor))) {
      Swal.fire("Valor inválido", "Ingresa un número válido para TRM (COP)", "warning");
      return;
    }

    try {
      await axios.post("/api/trm", {
        fecha,
        valor: Number(valor)
      });

      await onSave();
      Swal.fire("OK", "TRM registrado correctamente", "success");

    } catch (e: any) {
      Swal.fire("Error", "No se pudo guardar el TRM", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] sm:w-[430px] p-7 animate-fade-in">

        <h2 className="text-2xl font-bold text-red-900 mb-5">Nuevo TRM</h2>

        <label className="block font-semibold text-gray-700 mb-1">Fecha *</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border border-gray-300 rounded-lg w-full p-2 text-gray-800 focus:ring-2 focus:ring-red-900/40 outline-none mb-4"
        />

        <label className="block font-semibold text-gray-700 mb-1">Valor (COP) *</label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="border border-gray-300 rounded-lg w-full p-2 text-gray-800 focus:ring-2 focus:ring-red-900/40 outline-none"
          placeholder="Ej: 3980 (COP por USD)"
        />

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="bg-gray-200 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="bg-red-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-950 shadow-md"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
