import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { BellPlus, ChevronDown, ClipboardList, PackagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import ClientDashboardLayout from "../../layouts/ClientDashboardLayout";
import ModalEditarPrealerta, { PrealertaEditable } from "../../components/prealertas/ModalEditarPrealerta";

type Cliente = {
  id: number;
  nombre: string;
  codigoReferencia?: string;
  codigo_referencia?: string;
};

type Prealerta = {
  id: number;
  tracking: string;
  peso_lbs: number;
  contenido: string;
  valor_declarado: number;
  valor_asegurado: number;
  observaciones: string | null;
  estado: string;
  fecha_creacion: string;
};

const initialForm = {
  tracking: "",
  peso_lbs: "",
  contenido: "",
  valor_declarado: "",
  valor_asegurado: "",
  observaciones: "",
};

const formatearFecha = (fecha?: string) => {
  if (!fecha) return "-";
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatearUSD = (valor: number) =>
  Number(valor || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function PrealertasCliente() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [prealertas, setPrealertas] = useState<Prealerta[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prealertaEditar, setPrealertaEditar] = useState<Prealerta | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const stored = localStorage.getItem("cliente") || sessionStorage.getItem("cliente");
    if (!stored) return;

    try {
      setCliente(JSON.parse(stored));
    } catch (error) {
      console.error("Error leyendo cliente:", error);
    }
  }, []);

  const codigoCasillero = useMemo(
    () => cliente?.codigoReferencia || cliente?.codigo_referencia || "-",
    [cliente]
  );

  const cargarPrealertas = async () => {
    setLoading(true);

    try {
      const { data } = await axios.get("/api/prealertas");
      setPrealertas(Array.isArray(data.prealertas) ? data.prealertas : []);
    } catch (error) {
      console.error("Error cargando prealertas:", error);
      setPrealertas([]);
      Swal.fire("Error", "No se pudieron cargar las prealertas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPrealertas();
  }, []);

  const actualizarCampo = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "tracking" ? value.toUpperCase() : value,
    }));
  };

  const crearPrealerta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.tracking.trim() ||
      !form.peso_lbs ||
      !form.contenido.trim() ||
      !form.valor_declarado ||
      !form.valor_asegurado
    ) {
      Swal.fire("Campos requeridos", "Completa la informacion obligatoria de la prealerta.", "warning");
      return;
    }

    setSaving(true);

    try {
      await axios.post("/api/prealertas", {
        tracking: form.tracking.trim(),
        peso_lbs: Number(form.peso_lbs),
        contenido: form.contenido.trim(),
        valor_declarado: Number(form.valor_declarado),
        valor_asegurado: Number(form.valor_asegurado),
        observaciones: form.observaciones.trim() || undefined,
      });

      Swal.fire("Prealerta creada", "Tu paquete fue prealertado correctamente.", "success");
      setForm(initialForm);
      setMostrarFormulario(false);
      await cargarPrealertas();
    } catch (error: any) {
      console.error("Error creando prealerta:", error);
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo crear la prealerta",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const editarPrealerta = async (datos: Omit<PrealertaEditable, "id">) => {
    if (!prealertaEditar) return;
    setSaving(true);
    try {
      await axios.put(`/api/prealertas/${prealertaEditar.id}`, datos);
      setPrealertaEditar(null);
      await cargarPrealertas();
      Swal.fire("Actualizada", "La prealerta fue actualizada correctamente.", "success");
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.mensaje || "No se pudo actualizar la prealerta", "error");
    } finally {
      setSaving(false);
    }
  };

  const eliminarPrealerta = async (prealerta: Prealerta) => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar prealerta?",
      text: `Se eliminará el tracking ${prealerta.tracking}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#5a0c0c",
    });
    if (!confirmacion.isConfirmed) return;

    try {
      await axios.delete(`/api/prealertas/${prealerta.id}`);
      await cargarPrealertas();
      Swal.fire("Eliminada", "La prealerta fue eliminada correctamente.", "success");
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.mensaje || "No se pudo eliminar la prealerta", "error");
    }
  };

  return (
    <ClientDashboardLayout scrollable>
      <div className="mx-auto w-full max-w-7xl px-2 pb-10 text-gray-800">
        <section className="relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-6 text-white shadow-xl shadow-slate-400/20 sm:p-8">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                Casillero {codigoCasillero}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Prealertas
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/75">
                Registra tus compras antes de que lleguen a bodega para agilizar la identificacion del paquete.
              </p>
            </div>

            <button
              onClick={() => setMostrarFormulario((prev) => !prev)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-red-950 transition hover:bg-red-50"
            >
              {mostrarFormulario ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {mostrarFormulario ? "Cerrar formulario" : "Crear prealerta"}
            </button>
          </div>
        </section>

        {mostrarFormulario && (
          <section className="mt-6 rounded-[1.35rem] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-400/20">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-950">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                  Nueva prealerta
                </p>
                <h2 className="text-xl font-black text-gray-800">Informacion del paquete</h2>
              </div>
            </div>

            <form onSubmit={crearPrealerta} className="grid gap-4 lg:grid-cols-2">
              <Campo label="Tracking" name="tracking" value={form.tracking} onChange={actualizarCampo} required />
              <Campo label="Peso en lbs" name="peso_lbs" type="number" value={form.peso_lbs} onChange={actualizarCampo} required min="0.01" step="0.01" />
              <Campo label="Contenido" name="contenido" value={form.contenido} onChange={actualizarCampo} required />
              <Campo label="Vl. declarado" name="valor_declarado" type="number" value={form.valor_declarado} onChange={actualizarCampo} required min="0" step="0.01" />
              <Campo label="Vl. asegurado" name="valor_asegurado" type="number" value={form.valor_asegurado} onChange={actualizarCampo} required min="0" step="0.01" />

              <label className="lg:col-span-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  Observaciones
                </span>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={actualizarCampo}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                  placeholder="Notas adicionales para identificar tu paquete"
                />
              </label>

              <div className="lg:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  <BellPlus className="h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar prealerta"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-[1.35rem] border border-white/70 bg-white/95 p-6 shadow-xl shadow-slate-400/20">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-950">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                  Historial
                </p>
                <h2 className="text-xl font-black text-gray-800">Mis prealertas</h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-900/10 bg-red-50 px-3 py-1 text-xs font-black text-red-950">
              {prealertas.length} registros
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-[11px] font-black uppercase tracking-[0.14em] text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Tracking</th>
                  <th className="px-4 py-3 text-left">Contenido</th>
                  <th className="px-4 py-3 text-center">Peso</th>
                  <th className="px-4 py-3 text-right">Vl. declarado</th>
                  <th className="px-4 py-3 text-right">Vl. asegurado</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-center">Opciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm font-semibold text-gray-500">
                      Cargando prealertas...
                    </td>
                  </tr>
                ) : prealertas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm font-semibold text-gray-500">
                      No tienes prealertas registradas
                    </td>
                  </tr>
                ) : (
                  prealertas.map((prealerta) => (
                    <tr key={prealerta.id} className="text-sm transition hover:bg-red-50/40">
                      <td className="px-4 py-3 font-mono font-black text-red-950">{prealerta.tracking}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{prealerta.contenido}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">{Number(prealerta.peso_lbs || 0).toFixed(2)} lb</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatearUSD(prealerta.valor_declarado)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">{formatearUSD(prealerta.valor_asegurado)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${prealerta.estado === "Digitado" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                          {prealerta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-600">{formatearFecha(prealerta.fecha_creacion)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button type="button" title="Editar prealerta" onClick={() => setPrealertaEditar(prealerta)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-950 shadow-sm transition hover:bg-red-50"><Pencil size={16} /></button>
                          <button type="button" title="Eliminar prealerta" onClick={() => eliminarPrealerta(prealerta)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-800 shadow-sm transition hover:bg-red-100"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        <ModalEditarPrealerta prealerta={prealertaEditar} guardando={saving} onClose={() => setPrealertaEditar(null)} onSave={editarPrealerta} />
      </div>
    </ClientDashboardLayout>
  );
}

function Campo({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        {label} {required && <span className="text-red-900">*</span>}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        className="w-full rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
      />
    </label>
  );
}
