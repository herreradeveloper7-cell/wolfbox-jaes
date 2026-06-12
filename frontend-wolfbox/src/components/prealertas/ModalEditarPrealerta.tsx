import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Save, X } from "lucide-react";

export type PrealertaEditable = {
  id: number;
  tracking: string;
  peso_lbs: number;
  contenido: string;
  valor_declarado: number;
  valor_asegurado: number;
  observaciones: string | null;
};

type Props = {
  prealerta: PrealertaEditable | null;
  guardando: boolean;
  onClose: () => void;
  onSave: (datos: Omit<PrealertaEditable, "id">) => Promise<void>;
};

export default function ModalEditarPrealerta({ prealerta, guardando, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    tracking: "",
    peso_lbs: "",
    contenido: "",
    valor_declarado: "",
    valor_asegurado: "",
    observaciones: "",
  });

  useEffect(() => {
    if (!prealerta) return;
    setForm({
      tracking: prealerta.tracking,
      peso_lbs: String(prealerta.peso_lbs),
      contenido: prealerta.contenido,
      valor_declarado: String(prealerta.valor_declarado),
      valor_asegurado: String(prealerta.valor_asegurado),
      observaciones: prealerta.observaciones || "",
    });
  }, [prealerta]);

  if (!prealerta) return null;

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    await onSave({
      tracking: form.tracking.trim(),
      peso_lbs: Number(form.peso_lbs),
      contenido: form.contenido.trim(),
      valor_declarado: Number(form.valor_declarado),
      valor_asegurado: Number(form.valor_asegurado),
      observaciones: form.observaciones.trim() || null,
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-800 to-gray-300" />
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">Gestión de prealerta</p>
            <h2 className="mt-1 text-xl font-black text-gray-800">Editar información del paquete</h2>
          </div>
          <button type="button" title="Cerrar" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100"><X size={18} /></button>
        </header>

        <form onSubmit={enviar} className="grid gap-4 p-6 md:grid-cols-2">
          <Campo label="Tracking" value={form.tracking} onChange={(valor) => setForm({ ...form, tracking: valor.toUpperCase() })} required />
          <Campo label="Peso en lbs" type="number" value={form.peso_lbs} onChange={(valor) => setForm({ ...form, peso_lbs: valor })} min="0.01" step="0.01" required />
          <Campo label="Contenido" value={form.contenido} onChange={(valor) => setForm({ ...form, contenido: valor })} required />
          <Campo label="Valor declarado" type="number" value={form.valor_declarado} onChange={(valor) => setForm({ ...form, valor_declarado: valor })} min="0" step="0.01" required />
          <Campo label="Valor asegurado" type="number" value={form.valor_asegurado} onChange={(valor) => setForm({ ...form, valor_asegurado: valor })} min="0" step="0.01" required />
          <Campo label="Observaciones" value={form.observaciones} onChange={(valor) => setForm({ ...form, observaciones: valor })} />

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-5 md:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 disabled:opacity-60">
              <Save size={17} /> {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}

type CampoProps = {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
};

function Campo({ label, value, onChange, type = "text", ...props }: CampoProps) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-gray-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-red-950 focus:ring-4 focus:ring-red-950/10" {...props} />
    </label>
  );
}
