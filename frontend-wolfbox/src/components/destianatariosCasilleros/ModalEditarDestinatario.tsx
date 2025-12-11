import { useState, useEffect } from "react";

interface Props {
  destinatario: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ModalEditarDestinatario({
  destinatario,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "",
  });

  useEffect(() => {
    if (destinatario) {
      setForm({
        nombre: destinatario.nombre || "",
        telefono: destinatario.telefono || "",
        direccion: destinatario.direccion || "",
        ciudad: destinatario.ciudad || "",
        departamento: destinatario.departamento || "",
        pais: destinatario.pais || "",
      });
    }
  }, [destinatario]);

    const handleChange = (campo: string, valor: string) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    };

    const handleSubmit = () => {
    const newErrors: any = {};

    if (!form.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!form.ciudad.trim()) newErrors.ciudad = "La ciudad es obligatoria";
    if (!form.departamento.trim()) newErrors.departamento = "El departamento es obligatorio";
    if (!form.pais.trim()) newErrors.pais = "El país es obligatorio";

    if (form.telefono.trim() && !/^[0-9]{10,}$/.test(form.telefono.trim())) {
        newErrors.telefono = "Debe tener solo números y mínimo 10 dígitos";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrores(newErrors);
        import("sweetalert2").then(({ default: Swal }) => {
        Swal.fire("Verifica los campos", "Algunos campos requieren atención", "warning");
        });
        return;
    }

    onSave(form);
    };


    const [errores, setErrores] = useState<any>({});



  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-[92%] md:w-[60%] lg:w-[45%] p-8 border border-gray-200 scale-100 animate-fade-in">
        
        <h2 className="text-2xl font-extrabold text-red-900 mb-6 tracking-wide">
          Editar Destinatario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Nombre *</label>
            <input
            className={`w-full border rounded-lg p-2 ${
                errores.nombre ? "border-red-500" : "border-gray-300"
            }`}
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            />

            {errores.nombre && (
            <p className="text-red-600 text-xs mt-1">{errores.nombre}</p>
            )}


          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Teléfono</label>
            <input
            className={`w-full border rounded-lg p-2 ${
                errores.telefono ? "border-red-500" : "border-gray-300"
            }`}
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            />

            {errores.telefono && (
            <p className="text-red-600 text-xs mt-1">{errores.telefono}</p>
            )}

          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700 mb-1">Dirección</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-900/40 outline-none transition"
              value={form.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
            />
          </div>

            <div>
            <label className="block text-gray-700 font-semibold mb-1">Departamento *</label>
            <input
                className={`w-full border rounded-lg p-2 ${
                errores.departamento ? "border-red-500" : "border-gray-300"
                }`}
                value={form.departamento}
                onChange={(e) => handleChange("departamento", e.target.value)}
            />
            {errores.departamento && (
                <p className="text-red-600 text-xs mt-1">{errores.departamento}</p>
            )}
            </div>


          <div>
            <label className="block font-semibold text-gray-700 mb-1">Departamento</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-900/40 outline-none transition"
              value={form.departamento}
              onChange={(e) => handleChange("departamento", e.target.value)}
            />
          </div>

            <div>
            <label className="block text-gray-700 font-semibold mb-1">País *</label>
            <input
                className={`w-full border rounded-lg p-2 ${
                errores.pais ? "border-red-500" : "border-gray-300"
                }`}
                value={form.pais}
                onChange={(e) => handleChange("pais", e.target.value)}
            />
            {errores.pais && (
                <p className="text-red-600 text-xs mt-1">{errores.pais}</p>
            )}
            </div>

        </div>

        <div className="flex justify-end gap-4 border-t pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-md bg-red-900 text-white font-bold hover:bg-red-950 transition shadow-md"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
