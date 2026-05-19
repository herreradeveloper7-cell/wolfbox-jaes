import { type ChangeEvent, useEffect, useState } from "react";
import { Building2, Mail, MapPin, Phone, Save, UserRound, X } from "lucide-react";
import Swal from "sweetalert2";

type Oficina = {
  id: number;
  nombre: string;
};

type TransportadoraForm = {
  oficina_id: string;
  nombre: string;
  nit: string;
  contacto: string;
  telefono: string;
  email: string;
  activo: boolean;
};

type Props = {
  isOpen: boolean;
  modo: "crear" | "editar";
  initialData?: any;
  oficinas: Oficina[];
  onClose: () => void;
  onSave: (data: {
    oficina_id: number;
    nombre: string;
    nit: string;
    contacto: string;
    telefono: string;
    email: string;
    activo: boolean;
  }) => Promise<void>;
};

const formInicial: TransportadoraForm = {
  oficina_id: "",
  nombre: "",
  nit: "",
  contacto: "",
  telefono: "",
  email: "",
  activo: true,
};

export default function ModalTransportadora({
  isOpen,
  modo,
  initialData,
  oficinas,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<TransportadoraForm>(formInicial);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setForm({
        oficina_id: initialData.oficina_id ? String(initialData.oficina_id) : "",
        nombre: initialData.nombre || "",
        nit: initialData.nit || "",
        contacto: initialData.contacto || "",
        telefono: initialData.telefono || "",
        email: initialData.email || "",
        activo: Number(initialData.activo ?? 1) === 1,
      });
      return;
    }

    setForm(formInicial);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const inputBase =
    "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/15";

  const labelBase = "text-xs font-bold uppercase tracking-[0.16em] text-gray-500";

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.oficina_id || !form.nombre.trim()) {
      Swal.fire("Campos requeridos", "Selecciona una oficina y escribe el nombre de la transportadora.", "warning");
      return;
    }

    try {
      setGuardando(true);
      await onSave({
        oficina_id: Number(form.oficina_id),
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        contacto: form.contacto.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        activo: form.activo,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-950 via-red-800 to-gray-300" />

        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-900">
              Configuracion operativa
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {modo === "crear" ? "Nueva transportadora" : "Editar transportadora"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-900"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Oficina *</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-900" />
              <select
                name="oficina_id"
                value={form.oficina_id}
                onChange={handleChange}
                className={`${inputBase} cursor-pointer pl-10`}
              >
                <option value="">Seleccionar oficina</option>
                {oficinas.map((oficina) => (
                  <option key={oficina.id} value={oficina.id}>
                    {oficina.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Nombre *</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-900" />
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`${inputBase} pl-10`}
                placeholder="Nombre de la transportadora"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelBase}>NIT</label>
            <input
              name="nit"
              value={form.nit}
              onChange={handleChange}
              className={inputBase}
              placeholder="NIT o identificacion"
            />
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Contacto</label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-900" />
              <input
                name="contacto"
                value={form.contacto}
                onChange={handleChange}
                className={`${inputBase} pl-10`}
                placeholder="Persona de contacto"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Telefono</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-900" />
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className={`${inputBase} pl-10`}
                placeholder="Telefono"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Correo</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-900" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`${inputBase} pl-10`}
                placeholder="correo@transportadora.com"
              />
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 md:col-span-2">
            <span>
              <span className="block text-sm font-bold text-gray-800">Transportadora activa</span>
              <span className="text-xs text-gray-500">
                Disponible para crear y editar despachos.
              </span>
            </span>
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, activo: e.target.checked }))
              }
              className="h-5 w-5 rounded border-gray-300 text-red-900 focus:ring-red-900"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {guardando ? "Guardando..." : modo === "crear" ? "Crear transportadora" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
