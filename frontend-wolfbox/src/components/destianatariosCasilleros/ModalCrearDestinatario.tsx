import { useState } from "react";

interface Props {
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ModalCrearDestinatario({ onClose, onSave }: Props) {
  const [closing, setClosing] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",        // celular
    direccion: "",
    ciudad: "",
    departamento: "",
    pais: "",
  });

  const [errores, setErrores] = useState<{
    nombre?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Normalizamos el teléfono a solo dígitos
    if (name === "telefono") {
      const soloDigitos = value.replace(/\D/g, "");
      setForm((f) => ({ ...f, telefono: soloDigitos }));
      // Borramos error al escribir
      if (errores.telefono) setErrores((err) => ({ ...err, telefono: undefined }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
    // Borramos error del campo al escribir
    if (errores[name as keyof typeof errores]) {
      setErrores((err) => ({ ...err, [name]: undefined }));
    }
  };

  const validar = () => {
    const e: typeof errores = {};

    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.telefono.trim()) {
      e.telefono = "El celular es obligatorio";
    } else if (form.telefono.length < 7 || form.telefono.length > 15) {
      e.telefono = "Ingresa entre 7 y 15 dígitos";
    }

    if (!form.direccion.trim()) {
      e.direccion = "La dirección es obligatoria";
    } else if (form.direccion.trim().length < 5) {
      e.direccion = "La dirección es muy corta";
    }

    if (!form.ciudad.trim()) e.ciudad = "La ciudad es obligatoria";
    if (!form.departamento.trim()) e.departamento = "El departamento es obligatorio";
    if (!form.pais.trim()) e.pais = "El país es obligatorio";

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = () => {
    if (!validar()) return;

    setClosing(true);
    setTimeout(() => {
      onSave(form);
    }, 280);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 280);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className={`bg-white w-[95%] sm:w-[550px] rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
      >
        <div className="bg-gradient-to-r from-[#5a0c0c] to-[#7d1111] text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Nuevo Destinatario</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 transition text-2xl font-light"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6 space-y-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d1111]/50 outline-none ${
                  errores.nombre ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ej: Juan Pérez"
              />
              {errores.nombre && (
                <p className="text-red-600 text-xs mt-1">{errores.nombre}</p>
              )}
            </div>

            {/* Celular / Teléfono */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Celular *
              </label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className={`border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d1111]/50 outline-none ${
                  errores.telefono ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="3001234567"
                inputMode="numeric"
              />
              {errores.telefono && (
                <p className="text-red-600 text-xs mt-1">{errores.telefono}</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className={`border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d1111]/50 outline-none ${
                errores.direccion ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Calle 12 # 55 - 10"
            />
            {errores.direccion && (
              <p className="text-red-600 text-xs mt-1">{errores.direccion}</p>
            )}
          </div>

          {/* Ciudad / Departamento / País */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                className={`border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d1111]/50 outline-none ${
                  errores.ciudad ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Bogotá"
              />
              {errores.ciudad && (
                <p className="text-red-600 text-xs mt-1">{errores.ciudad}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Departamento *
              </label>
              <input
                type="text"
                name="departamento"
                value={form.departamento}
                onChange={handleChange}
                className={`border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d1111]/50 outline-none ${
                  errores.departamento ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Cundinamarca"
              />
              {errores.departamento && (
                <p className="text-red-600 text-xs mt-1">{errores.departamento}</p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                País *
              </label>
              <input
                type="text"
                name="pais"
                value={form.pais}
                onChange={handleChange}
                className={`border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-[#7d1111]/50 outline-none ${
                  errores.pais ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Colombia"
              />
              {errores.pais && (
                <p className="text-red-600 text-xs mt-1">{errores.pais}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-200 transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleGuardar}
            className="px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-[#7d1111] to-[#5a0c0c] hover:from-[#8e1515] hover:to-[#410808] shadow-md hover:shadow-lg transition cursor-pointer"
          >
            Guardar Destinatario
          </button>
        </div>
      </div>
    </div>
  );
}
