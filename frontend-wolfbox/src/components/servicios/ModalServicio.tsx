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
  tarifa_por_libra: number;
  porcentaje_seguro: number;
  seguro_minimo_usd: number;
  tarifa_fija_1lb?: number;
  tarifa_fija_2a5?: number;
  tarifa_fija_6a10?: number;
  tarifa_por_libra_extra?: number;
  aplica_minimo?: boolean;
  peso_minimo?: number;
  tarifa_minima_usd?: number;
  aplica_peso_maximo?: boolean;
  peso_maximo?: number;
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
    tarifa_por_libra: 0,
    porcentaje_seguro: 0,
    seguro_minimo_usd: 0,
    tarifa_fija_1lb: 0,
    tarifa_fija_2a5: 0,
    tarifa_fija_6a10: 0,
    tarifa_por_libra_extra: 0,
    aplica_minimo: false,
    peso_minimo: 0,
    tarifa_minima_usd: 0,
    aplica_peso_maximo: false,
    peso_maximo: 0,
  });

  const [tipoTarifa, setTipoTarifa] = useState<"libra" | "rango">("libra");


  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        codigo: initialData.codigo || "",
        nombre: initialData.nombre || "",
        descripcion: initialData.descripcion || "",
        tipo: initialData.tipo || "",

        tarifa_por_libra: Number(initialData.tarifa_por_libra_cc || 0),

        porcentaje_seguro: Number(initialData.porcentaje_seguro || 0),
        seguro_minimo_usd: Number(initialData.seguro_minimo_usd || 0),

        tarifa_fija_1lb: Number(initialData.tarifa_fija_1lb || 0),
        tarifa_fija_2a5: Number(initialData.tarifa_fija_2a5 || 0),
        tarifa_fija_6a10: Number(initialData.tarifa_fija_6a10 || 0),
        tarifa_por_libra_extra: Number(initialData.tarifa_por_libra_extra || 0),

        aplica_minimo: Boolean(initialData.aplica_minimo),
        peso_minimo: Number(initialData.peso_minimo || 0),
        tarifa_minima_usd: Number(initialData.tarifa_minima_usd || 0),

        aplica_peso_maximo: Boolean(initialData.aplica_peso_maximo),
        peso_maximo: Number(initialData.peso_maximo || 0),
      });

      if (Number(initialData.tarifa_por_libra_cc || 0) > 0) {
        setTipoTarifa("libra");
      } else {
        setTipoTarifa("rango");
      }
    } else {
      setForm({
        codigo: "",
        nombre: "",
        descripcion: "",
        tipo: "",
        tarifa_por_libra: 0,
        porcentaje_seguro: 0,
        seguro_minimo_usd: 0,
        tarifa_fija_1lb: 0,
        tarifa_fija_2a5: 0,
        tarifa_fija_6a10: 0,
        tarifa_por_libra_extra: 0,
        aplica_minimo: false,
        peso_minimo: 0,
        tarifa_minima_usd: 0,
        aplica_peso_maximo: false,
        peso_maximo: 0,
      });

      setTipoTarifa("libra");
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    const camposNumericos = [
      "tarifa_por_libra",
      "porcentaje_seguro",
      "seguro_minimo_usd",
      "tarifa_fija_1lb",
      "tarifa_fija_2a5",
      "tarifa_fija_6a10",
      "tarifa_por_libra_extra",
      "peso_minimo",
      "tarifa_minima_usd",
      "peso_maximo"
    ];

    const valorFinal = camposNumericos.includes(name)
      ? Number(value)
      : value;

    setForm((prev) => {

      if (
        name === "peso_minimo" &&
        prev.aplica_peso_maximo &&
        Number(prev.peso_maximo) === Number(prev.peso_minimo)
      ) {
        return {
          ...prev,
          peso_minimo: Number(value),
          peso_maximo: Number(value),
        };
      }

      return {
        ...prev,
        [name]: valorFinal,
      };
    });
  };

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setForm((prev) => {
      if (name === "aplica_minimo") {
        return {
          ...prev,
          aplica_minimo: checked,
          peso_minimo: checked ? prev.peso_minimo : 0,
          tarifa_minima_usd: checked ? prev.tarifa_minima_usd : 0,

          aplica_peso_maximo: checked ? prev.aplica_peso_maximo : false,
          peso_maximo: checked ? prev.peso_maximo : 0,
        };
      }

      return {
        ...prev,
        [name]: checked,
      };
    });
  };


  const validate = () => {
    let errs: any = {};

    if (!form.codigo.trim()) {
      errs.codigo = "El código del servicio es obligatorio";
    }

    if (!form.nombre.trim()) {
      errs.nombre = "El nombre del servicio es obligatorio";
    }

    const usaTarifaFijaMinima =
      form.aplica_minimo &&
      Number(form.peso_minimo) > 0 &&
      Number(form.tarifa_minima_usd) > 0;

    if (!usaTarifaFijaMinima && Number(form.tarifa_por_libra) <= 0) {
      errs.tarifa_por_libra =
        "La tarifa por libra debe ser mayor a 0 si no usas tarifa fija mínima";
    }

    if (tipoTarifa === "rango" && !usaTarifaFijaMinima) {
      if (Number(form.tarifa_fija_1lb) <= 0) {
        errs.tarifa_fija_1lb = "La tarifa 1 lb debe ser mayor a 0";
      }

      if (Number(form.tarifa_fija_2a5) <= 0) {
        errs.tarifa_fija_2a5 = "La tarifa 2 a 5 lb debe ser mayor a 0";
      }

      if (Number(form.tarifa_fija_6a10) <= 0) {
        errs.tarifa_fija_6a10 = "La tarifa 6 a 10 lb debe ser mayor a 0";
      }

      if (Number(form.tarifa_por_libra_extra) <= 0) {
        errs.tarifa_por_libra_extra = "La libra extra debe ser mayor a 0";
      }
    }

    if (Number(form.porcentaje_seguro) < 0) {
      errs.porcentaje_seguro = "El porcentaje de seguro no puede ser negativo";
    }

    if (Number(form.seguro_minimo_usd) < 0) {
      errs.seguro_minimo_usd = "El seguro mínimo no puede ser negativo";
    }

    if (form.aplica_minimo) {
      if (Number(form.peso_minimo) <= 0) {
        errs.peso_minimo = "El peso mínimo debe ser mayor a 0";
      }

      if (Number(form.tarifa_minima_usd) <= 0) {
        errs.tarifa_minima_usd = "La tarifa mínima debe ser mayor a 0";
      }
    }

    if (form.aplica_peso_maximo) {
      if (Number(form.peso_maximo) <= 0) {
        errs.peso_maximo = "El peso máximo debe ser mayor a 0";
      }

      if (
        form.aplica_minimo &&
        Number(form.peso_maximo) < Number(form.peso_minimo)
      ) {
        errs.peso_maximo = "El peso máximo no puede ser menor al peso mínimo";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Swal.fire("Error", "Por favor revisa los campos marcados", "error");
      return;
    }

    const payload = {
      ...form,
      tipo: form.nombre,

      tarifa_por_libra_cc:
        tipoTarifa === "libra" ? form.tarifa_por_libra : null,

      tarifa_fija_1lb:
        tipoTarifa === "rango" ? form.tarifa_fija_1lb : null,

      tarifa_fija_2a5:
        tipoTarifa === "rango" ? form.tarifa_fija_2a5 : null,

      tarifa_fija_6a10:
        tipoTarifa === "rango" ? form.tarifa_fija_6a10 : null,

      tarifa_por_libra_extra:
        tipoTarifa === "rango" ? form.tarifa_por_libra_extra : null,
      
      aplica_minimo: form.aplica_minimo ? 1 : 0,
      peso_minimo: form.aplica_minimo ? form.peso_minimo : 0,
      tarifa_minima_usd: form.aplica_minimo ? form.tarifa_minima_usd : 0,

      aplica_peso_maximo: form.aplica_peso_maximo ? 1 : 0,
      peso_maximo: form.aplica_peso_maximo ? form.peso_maximo : 0,
    };

    await onSave(payload);
    onClose();
  };

return (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
    <div className="relative bg-white/95 border border-gray-200 shadow-2xl rounded-2xl w-full max-w-4xl p-8 animate-fade-in max-h-[90vh] overflow-y-auto">

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-600 tracking-wide">
            {modo === "crear" ? "CREAR SERVICIO" : "EDITAR SERVICIO"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Configura el servicio, tarifa por libra y reglas de seguro
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-green-900"></span>
          <span className="text-xs font-semibold text-gray-600">
            Configuración de tarifas
          </span>
        </div>
      </div>

      <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
          Información general
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => setTipoTarifa("libra")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              tipoTarifa === "libra"
                ? "border-red-900 bg-red-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-400"
            }`}
          >
            <p className="text-sm font-bold text-gray-800">Tarifa por libra</p>
            <p className="text-xs text-gray-500 mt-1">
              Calcula el valor según cada libra registrada.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setTipoTarifa("rango")}
            className={`rounded-2xl border px-4 py-3 text-left transition ${
              tipoTarifa === "rango"
                ? "border-red-900 bg-red-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-400"
            }`}
          >
            <p className="text-sm font-bold text-gray-800">Tarifa por rangos</p>
            <p className="text-xs text-gray-500 mt-1">
              Usa tarifa fija para 1 lb, 2 a 5 lb, 6 a 10 lb y libra extra.
            </p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 tracking-wide">
              Código
            </label>
            <input
              type="text"
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                errors.codigo
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                  : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
              } focus:outline-none`}
              placeholder="Ej: US-CO-N"
            />
            {errors.codigo && (
              <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 tracking-wide">
              Nombre del servicio
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                errors.nombre
                  ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                  : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
              } focus:outline-none`}
              placeholder="Ej: US-CO Clientes N"
            />
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600 tracking-wide">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400 resize-none h-24"
              placeholder="Descripción del servicio..."
            />
          </div>
        </div>
      </div>

      <div className="mt-5 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
          Tarifa del servicio
        </h3>
        

        {tipoTarifa === "libra" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 tracking-wide">
                Tarifa por libra USD
              </label>
              <input
                type="number"
                name="tarifa_por_libra"
                value={form.tarifa_por_libra || 0}
                onChange={handleChange}
                disabled={!!form.aplica_minimo}
                className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                  errors.tarifa_por_libra
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                    : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
                } focus:outline-none`}
                min="0"
                step="0.01"
                placeholder="Ej: 4.50"
              />
              {errors.tarifa_por_libra && (
                <p className="text-red-500 text-xs mt-1">{errors.tarifa_por_libra}</p>
              )}
            </div>
          </div>
        )}

        {tipoTarifa === "rango" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Tarifa fija 1 lb", name: "tarifa_fija_1lb", placeholder: "Ej: 7" },
              { label: "Tarifa fija 2 a 5 lb", name: "tarifa_fija_2a5", placeholder: "Ej: 15" },
              { label: "Tarifa fija 6 a 10 lb", name: "tarifa_fija_6a10", placeholder: "Ej: 20" },
              { label: "Libra extra", name: "tarifa_por_libra_extra", placeholder: "Ej: 2" },
            ].map((item) => (
              <div key={item.name} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 tracking-wide">
                  {item.label}
                </label>

                <input
                  type="number"
                  name={item.name}
                  value={form[item.name as keyof ServicioForm] as number}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                    errors[item.name]
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                      : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
                  } focus:outline-none`}
                  min="0"
                  step="0.01"
                  placeholder={item.placeholder}
                />

                {errors[item.name] && (
                  <p className="text-red-500 text-xs mt-1">{errors[item.name]}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-red-950/10 bg-red-950/[0.03] p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-red-950">
              Tarifa mínima facturable
            </h4>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Define un peso máximo donde se cobrará siempre un valor fijo de flete.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <input
              type="checkbox"
              name="aplica_minimo"
              checked={!!form.aplica_minimo}
              onChange={handleCheckChange}
              className="h-4 w-4 accent-red-950"
            />
            <span className="text-xs font-bold text-gray-700">
              Aplicar tarifa mínima
            </span>
          </label>
          </div>

        {form.aplica_minimo && (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wide text-gray-600">
                Hasta cuántas libras
              </label>

              <input
                type="number"
                name="peso_minimo"
                value={form.peso_minimo || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 5"
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none ${
                  errors.peso_minimo
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                    : "border-gray-300 hover:border-gray-400 focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
                }`}
              />

              {errors.peso_minimo && (
                <p className="mt-1 text-xs text-red-500">{errors.peso_minimo}</p>
              )}
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <input
                type="checkbox"
                checked={
                  !!form.aplica_peso_maximo &&
                  Number(form.peso_maximo) === Number(form.peso_minimo)
                }
                onChange={(e) => {
                  const checked = e.target.checked;

                  setForm((prev) => ({
                    ...prev,
                    aplica_peso_maximo: checked,
                    peso_maximo: checked ? Number(prev.peso_minimo || 0) : 0,
                  }));
                }}
                className="h-4 w-4 accent-red-950"
              />

              <div>
                <p className="text-xs font-bold text-gray-700">
                  Bloquear pesos superiores a este mínimo
                </p>
                <p className="text-xs font-semibold text-gray-500">
                  Si está activo, el servicio solo permitirá paquetes hasta {form.peso_minimo || 0} lb.
                </p>
              </div>
            </label>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold tracking-wide text-gray-600">
                Valor fijo USD
              </label>

              <input
                type="number"
                name="tarifa_minima_usd"
                value={form.tarifa_minima_usd || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 80"
                className={`w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none ${
                  errors.tarifa_minima_usd
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                    : "border-gray-300 hover:border-gray-400 focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
                }`}
              />

              {errors.tarifa_minima_usd && (
                <p className="mt-1 text-xs text-red-500">{errors.tarifa_minima_usd}</p>
              )}
            </div>
          </div>
        )}
        </div>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-red-950">
                Límite máximo de peso
              </h4>
              <p className="mt-1 text-xs font-semibold text-gray-500">
                Define si este servicio solo aplica hasta cierto peso.
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
              <input
                type="checkbox"
                name="aplica_peso_maximo"
                checked={form.aplica_peso_maximo}
                onChange={(e) => {
                  const checked = e.target.checked;

                  setForm((prev) => ({
                    ...prev,
                    aplica_peso_maximo: checked,

                    peso_maximo: checked
                      ? Number(prev.peso_minimo || 0)
                      : 0,
                  }));
                }}
                className="h-4 w-4 accent-red-950"
              />

              <span className="text-xs font-bold text-gray-700">
                Aplicar peso máximo
              </span>
            </label>
          </div>

          {form.aplica_peso_maximo && (
            <div className="mt-4">
              <label className="text-xs font-semibold tracking-wide text-gray-600">
                Peso máximo permitido
              </label>

              <input
                type="number"
                name="peso_maximo"
                value={form.peso_maximo || 0}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Ej: 5"
                className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none ${
                  errors.peso_maximo
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                    : "border-gray-300 hover:border-gray-400 focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
                }`}
              />

              {errors.peso_maximo && (
                <p className="mt-1 text-xs text-red-500">{errors.peso_maximo}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-gray-200 pt-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
            Seguro del servicio
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 tracking-wide">
                Porcentaje seguro %
              </label>
              <input
                type="number"
                name="porcentaje_seguro"
                value={form.porcentaje_seguro}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                  errors.porcentaje_seguro
                    ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                    : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
                } focus:outline-none`}
                min="0"
                step="0.01"
                placeholder="Ej: 10"
              />
              {errors.porcentaje_seguro && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.porcentaje_seguro}
                </p>
              )}
          </div>

          <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 tracking-wide">
                  Seguro mínimo USD
                </label>
                <input
                  type="number"
                  name="seguro_minimo_usd"
                  value={form.seguro_minimo_usd}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                    errors.seguro_minimo_usd
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                      : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
                  } focus:outline-none`}
                  min="0"
                  step="0.01"
                  placeholder="Ej: 5"
                />
                {errors.seguro_minimo_usd && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.seguro_minimo_usd}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide mb-3">
              Vista previa del cálculo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-500">
                  Ejemplo con 10 lb
                  {form.aplica_peso_maximo && Number(form.peso_maximo) > 0
                    ? ` / Máx. ${form.peso_maximo} lb`
                    : ""}
                </p>
                <p className="font-bold text-gray-800">
                  {(() => {
                  const pesoEjemplo = 10;

                  if (
                    form.aplica_peso_maximo &&
                    Number(form.peso_maximo) > 0 &&
                    pesoEjemplo > Number(form.peso_maximo)
                  ) {
                    return (
                      <span className="text-red-700">
                        No aplica para {pesoEjemplo} lb
                      </span>
                    );
                  }

                  if (
                    form.aplica_minimo &&
                    Number(form.peso_minimo) > 0 &&
                    Number(form.tarifa_minima_usd) > 0 &&
                    pesoEjemplo <= Number(form.peso_minimo)
                  ) {
                    return <>USD {Number(form.tarifa_minima_usd).toFixed(2)}</>;
                  }

                  if (tipoTarifa === "rango") {
                    if (pesoEjemplo <= 1) {
                      return <>USD {Number(form.tarifa_fija_1lb || 0).toFixed(2)}</>;
                    }

                    if (pesoEjemplo <= 5) {
                      return <>USD {Number(form.tarifa_fija_2a5 || 0).toFixed(2)}</>;
                    }

                    if (pesoEjemplo <= 10) {
                      return <>USD {Number(form.tarifa_fija_6a10 || 0).toFixed(2)}</>;
                    }

                    return (
                      <>
                        USD{" "}
                        {(
                          Number(form.tarifa_fija_6a10 || 0) +
                          (pesoEjemplo - 10) * Number(form.tarifa_por_libra_extra || 0)
                        ).toFixed(2)}
                      </>
                    );
                  }

                    return <>USD {(Number(form.tarifa_por_libra || 0) * pesoEjemplo).toFixed(2)}</>;
                  })()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-500">Seguro mínimo</p>
                <p className="font-bold text-gray-800">
                  USD {Number(form.seguro_minimo_usd || 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-500">Seguro %</p>
                <p className="font-bold text-gray-800">
                  {Number(form.porcentaje_seguro || 0).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm border bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
        >
          Cancelar
        </button>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md bg-red-900 text-white hover:bg-red-950 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          {modo === "crear" ? "Crear Servicio" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  </div>
);
}
