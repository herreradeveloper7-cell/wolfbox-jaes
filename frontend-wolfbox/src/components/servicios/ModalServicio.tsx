import { useEffect, useState } from "react";
import Swal from "sweetalert2";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
  modo?: "crear" | "editar";
};

type ServicioForm = {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  tarifa_fija_1lb: number;
  tarifa_fija_2a5: number;
  tarifa_fija_6a10: number;
  tarifa_por_libra_extra: number;
  tarifa_por_libra_cc: number;
  porcentaje_seguro: number;
};


export default function ModalServicio({
  isOpen,
  onClose,
  onSave,
  initialData,
  modo = "crear",
}: Props) {

const [form, setForm] = useState<ServicioForm>({
codigo: "",
nombre: "",
descripcion: "",
tipo: "",
tarifa_fija_1lb: 0,
tarifa_fija_2a5: 0,
tarifa_fija_6a10: 0,
tarifa_por_libra_extra: 0,
tarifa_por_libra_cc: 0,
porcentaje_seguro: 0,
});


  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name.includes("tarifa") || name.includes("porcentaje")
        ? Number(value)
        : value,
    }));
  };

  // ---------------------------
  // VALIDACIÓN LOCAL
  // ---------------------------
  const validate = () => {
    let errs: any = {};

    if (!form.codigo.trim()) errs.codigo = "El código es obligatorio";
    if (!form.nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (!form.tipo.trim()) errs.tipo = "Seleccione un tipo de servicio";

    if (form.tipo === "US-CO") {
      if (form.tarifa_fija_1lb <= 0) errs.tarifa_fija_1lb = "Requerido";
      if (form.tarifa_fija_2a5 <= 0) errs.tarifa_fija_2a5 = "Requerido";
      if (form.tarifa_fija_6a10 <= 0) errs.tarifa_fija_6a10 = "Requerido";
      if (form.tarifa_por_libra_extra <= 0) errs.tarifa_por_libra_extra = "Requerido";
    }

    if (form.tipo === "CC-Casilleros") {
      if (form.tarifa_por_libra_cc <= 0) errs.tarifa_por_libra_cc = "Requerido";
    }

    if (form.porcentaje_seguro <= 0) {
      errs.porcentaje_seguro = "El porcentaje de seguro debe ser mayor a 0";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Swal.fire("Error", "Por favor revisa los campos marcados", "error");
      return;
    }

    await onSave(form);
    onClose();
  };

  return (
    <div className="    fixed inset-0 
    bg-black/40 
    backdrop-blur-sm 
    flex items-center justify-center 
    z-[9999]
    overflow-hidden">
      <div className="    bg-white 
    rounded-2xl 
    shadow-2xl 
    w-[90%] 
    max-w-3xl 
    p-8 
    animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 text-red-900">
          {modo === "crear" ? "Crear Servicio" : "Editar Servicio"}
        </h2>

        {/* ------- FORM ------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className="font-semibold text-gray-700">Código</label>
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className="input-base"
            />
            {errors.codigo && <p className="text-red-500 text-sm">{errors.codigo}</p>}
          </div>

          <div>
            <label className="font-semibold text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input-base"
            />
            {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-gray-700">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="input-base h-20"
            />
          </div>

          <div>
            <label className="font-semibold text-gray-700">Tipo de servicio</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="input-base"
            >
              <option value="">Seleccione</option>
              <option value="US-CO">US-CO Casilleros</option>
              <option value="CC-Casilleros">CC Casilleros</option>
            </select>
            {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo}</p>}
          </div>
        </div>

        {/* =========================
            SECCIÓN DE TARIFAS US-CO
        ========================= */}
        {form.tipo === "US-CO" && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold text-red-900 mb-3">Tarifas US-CO</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Tarifa 1 lb", name: "tarifa_fija_1lb" },
                { label: "Tarifa 2 a 5 lb", name: "tarifa_fija_2a5" },
                { label: "Tarifa 6 a 10 lb", name: "tarifa_fija_6a10" },
                { label: "Tarifa por libra extra", name: "tarifa_por_libra_extra" },
              ].map((item) => (
                <div key={item.name}>
                  <label className="font-semibold text-gray-700">{item.label}</label>
                  <input
                    type="number"
                    name={item.name}
                    value={form[item.name as keyof ServicioForm]}
                    onChange={handleChange}
                    className="input-base"
                  />
                  {errors[item.name] && (
                    <p className="text-red-500 text-sm">{errors[item.name]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================
            TARIFAS CC-CASILLEROS
        ================================ */}
        {form.tipo === "CC-Casilleros" && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-bold text-red-900 mb-3">Tarifa CC Casilleros</h3>

            <div>
              <label className="font-semibold text-gray-700">$/libra</label>
              <input
                type="number"
                name="tarifa_por_libra_cc"
                value={form.tarifa_por_libra_cc}
                onChange={handleChange}
                className="input-base"
              />
              {errors.tarifa_por_libra_cc && (
                <p className="text-red-500 text-sm">{errors.tarifa_por_libra_cc}</p>
              )}
            </div>
          </div>
        )}

        {/* ================================
            SEGURO
        ================================ */}
        <div className="mt-6">
          <label className="font-semibold text-gray-700">Porcentaje Seguro (%)</label>
          <input
            type="number"
            name="porcentaje_seguro"
            value={form.porcentaje_seguro}
            onChange={handleChange}
            className="input-base"
          />
          {errors.porcentaje_seguro && (
            <p className="text-red-500 text-sm">{errors.porcentaje_seguro}</p>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg font-semibold shadow-md"
          >
            {modo === "crear" ? "Crear" : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
