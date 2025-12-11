import React, { useState, useEffect } from "react";
import axios from "axios";

interface ModalEditarGuiaProps {
  guiaSeleccionada: any;
  onClose: () => void;
  onActualizado: () => void;
}

const ModalEditarGuia: React.FC<ModalEditarGuiaProps> = ({
  guiaSeleccionada,
  onClose,
  onActualizado,
}) => {
  const [formData, setFormData] = useState({
    tracking: "",
    contenido: "",
    notas: "",
  });

  useEffect(() => {
    if (guiaSeleccionada) {
      setFormData({
        tracking: guiaSeleccionada.tracking || "",
        contenido: guiaSeleccionada.contenido || "",
        notas: guiaSeleccionada.notas || "",
      });
    }
  }, [guiaSeleccionada]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarCambios = async () => {
    try {
      if (!guiaSeleccionada?.id) {
        alert("❌ No se encontró el ID de la guía seleccionada.");
        return;
      }

      const guiaId = guiaSeleccionada.id.toString().split(":")[0];

      await axios.put(`http://localhost:3000/api/paquetes/editar-basico/${guiaId}`, formData);


      alert("✅ Guía actualizada correctamente");
      onActualizado(); 
      onClose(); 
    } catch (error: any) {
      alert("Error al actualizar la guía. Revisa la consola para más detalles.");
    }
  };

  if (!guiaSeleccionada) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[500px] relative animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Editar Guía</h2>

        <div className="flex flex-col gap-3">
          <label className="text-sm text-gray-700">
            Tracking:
            <input
              name="tracking"
              value={formData.tracking}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>

          <label className="text-sm text-gray-700">
            Contenido:
            <input
              name="contenido"
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>

          <label className="text-sm text-gray-700">
            Notas:
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1 mt-1"
              rows={3}
            />
          </label>
        </div>

        <div className="flex justify-end mt-5 gap-2">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardarCambios}
            className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarGuia;
