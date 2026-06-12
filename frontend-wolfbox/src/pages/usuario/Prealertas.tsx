import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  BellPlus,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import BuscarClientes from "../../components/clientes/BuscarClientes";
import iconHome from "../../assets/home-svgrepo-com.svg";
import ModalEditarPrealerta, { PrealertaEditable } from "../../components/prealertas/ModalEditarPrealerta";

type Cliente = {
  id: number;
  nombre: string;
  codigo_referencia: string;
};

type Prealerta = {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  codigo_referencia: string;
  tracking: string;
  peso_lbs: number;
  contenido: string;
  valor_declarado: number;
  valor_asegurado: number;
  observaciones: string | null;
  estado: string;
  fecha_creacion: string;
};

type Filtros = {
  tracking: string;
  cliente: string;
  contenido: string;
  fecha_desde: string;
  fecha_hasta: string;
};

const filtrosIniciales: Filtros = {
  tracking: "",
  cliente: "",
  contenido: "",
  fecha_desde: "",
  fecha_hasta: "",
};

const formularioInicial = {
  tracking: "",
  peso_lbs: "",
  contenido: "",
  valor_declarado: "",
  valor_asegurado: "",
  observaciones: "",
};

const formatearFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha));

const formatearUSD = (valor: number) =>
  Number(valor || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function Prealertas() {
  const navigate = useNavigate();
  const [prealertas, setPrealertas] = useState<Prealerta[]>([]);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [filtrosAplicados, setFiltrosAplicados] = useState(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteBusqueda, setClienteBusqueda] = useState("");
  const [form, setForm] = useState(formularioInicial);
  const [prealertaEditar, setPrealertaEditar] = useState<Prealerta | null>(null);
  const usuarioGuardado = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
  const esAdmin = usuarioGuardado ? JSON.parse(usuarioGuardado).tipo === "admin" : false;

  const cargarPrealertas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pagina: String(pagina),
        limite: String(limite),
      });

      Object.entries(filtrosAplicados).forEach(([clave, valor]) => {
        if (valor.trim()) params.set(clave, valor.trim());
      });

      const { data } = await axios.get(`/api/prealertas?${params.toString()}`);
      setPrealertas(Array.isArray(data.prealertas) ? data.prealertas : []);
      setTotal(Number(data.paginacion?.total || 0));
      setTotalPaginas(Number(data.paginacion?.total_paginas || 1));
    } catch (error) {
      console.error("Error cargando prealertas:", error);
      setPrealertas([]);
      Swal.fire("Error", "No se pudieron cargar las prealertas", "error");
    } finally {
      setLoading(false);
    }
  }, [filtrosAplicados, limite, pagina]);

  useEffect(() => {
    cargarPrealertas();
  }, [cargarPrealertas]);

  const buscar = (event: FormEvent) => {
    event.preventDefault();
    setPagina(1);
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosIniciales);
    setFiltrosAplicados(filtrosIniciales);
    setPagina(1);
  };

  const crearPrealerta = async (event: FormEvent) => {
    event.preventDefault();

    if (!clienteSeleccionado) {
      Swal.fire("Cliente requerido", "Selecciona el cliente al que pertenece la prealerta.", "warning");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/prealertas", {
        cliente_id: clienteSeleccionado.id,
        tracking: form.tracking.trim(),
        peso_lbs: Number(form.peso_lbs),
        contenido: form.contenido.trim(),
        valor_declarado: Number(form.valor_declarado),
        valor_asegurado: Number(form.valor_asegurado),
        observaciones: form.observaciones.trim() || undefined,
      });

      await Swal.fire("Prealerta creada", "La prealerta fue registrada correctamente.", "success");
      setForm(formularioInicial);
      setClienteSeleccionado(null);
      setClienteBusqueda("");
      setMostrarFormulario(false);
      setPagina(1);
      await cargarPrealertas();
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.mensaje || "No se pudo crear la prealerta", "error");
    } finally {
      setSaving(false);
    }
  };

  const editarPrealerta = async (datos: Omit<PrealertaEditable, "id">) => {
    if (!prealertaEditar || !esAdmin) return;
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
    if (!esAdmin) return;
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

  const inicio = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const fin = Math.min(pagina * limite, total);

  return (
    <UserDashboardLayout scrollable>
      <div className="overflow-x-hidden px-4 py-4 text-gray-800 animate-fade-in sm:px-6 lg:px-10">
        <h1 className="mb-2 text-3xl font-bold text-red-900">Prealertas</h1>
        <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button onClick={() => navigate("/dashboardUsuario")} className="cursor-pointer font-semibold text-gray-700 hover:underline">
            Dashboard
          </button>
          &gt; Prealertas
        </p>

        {mostrarFormulario && (
          <section className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5 pointer-events-none" />
            <div className="relative p-6">
              <div className="mb-6 flex items-center justify-between border-b border-gray-200/70 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-950">
                    <PackagePlus size={21} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-950">Registro manual</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-700">Nueva prealerta</h2>
                    <p className="mt-1 text-xs font-semibold text-gray-500">Asocia el paquete prealertado con un cliente registrado.</p>
                  </div>
                </div>
                <button type="button" title="Cerrar formulario" onClick={() => setMostrarFormulario(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-100 hover:text-red-950">
                  <X size={18} />
                </button>
              </div>

            <form onSubmit={crearPrealerta} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <label className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm xl:col-span-3">
                <Etiqueta>Cliente</Etiqueta>
                <BuscarClientes
                  value={clienteBusqueda}
                  onChange={(valor) => {
                    setClienteBusqueda(valor);
                    if (clienteSeleccionado && valor !== clienteSeleccionado.codigo_referencia) {
                      setClienteSeleccionado(null);
                    }
                  }}
                  onSelect={setClienteSeleccionado}
                />
                {clienteSeleccionado && (
                  <p className="mt-2 text-xs font-bold text-emerald-700">
                    {clienteSeleccionado.nombre} · {clienteSeleccionado.codigo_referencia}
                  </p>
                )}
              </label>
              <Campo panel label="Tracking" name="tracking" value={form.tracking} onChange={setForm} form={form} required />
              <Campo panel label="Peso en lbs" name="peso_lbs" type="number" value={form.peso_lbs} onChange={setForm} form={form} required min="0.01" step="0.01" />
              <Campo panel label="Contenido" name="contenido" value={form.contenido} onChange={setForm} form={form} required />
              <Campo panel label="Vl. declarado" name="valor_declarado" type="number" value={form.valor_declarado} onChange={setForm} form={form} required min="0" step="0.01" />
              <Campo panel label="Vl. asegurado" name="valor_asegurado" type="number" value={form.valor_asegurado} onChange={setForm} form={form} required min="0" step="0.01" />
              <label className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                <Etiqueta>Observaciones</Etiqueta>
                <input
                  value={form.observaciones}
                  onChange={(event) => setForm((actual) => ({ ...actual, observaciones: event.target.value }))}
                  className={inputClase}
                  placeholder="Opcional"
                />
              </label>
              <div className="flex justify-end border-t border-gray-200/70 pt-5 md:col-span-2 xl:col-span-3">
                <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:scale-[1.02] disabled:opacity-60">
                  <BellPlus size={17} />
                  {saving ? "Guardando..." : "Guardar prealerta"}
                </button>
              </div>
            </form>
            </div>
          </section>
        )}

        <section className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5 pointer-events-none" />
          <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-gray-900/5 pointer-events-none" />
          <div className="relative p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-gray-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-950">Módulo de casillero</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-700">Filtros de Prealertas</h2>
                <p className="mt-1 text-xs font-semibold text-gray-500">Consulta por fecha, tracking, cliente, casillero o contenido.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 md:flex">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  <span className="text-xs font-semibold text-gray-600">Módulo activo</span>
                </div>
                <button type="button" onClick={() => setMostrarFormulario(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:scale-[1.02]">
                  <Plus size={17} /> Crear prealerta
                </button>
              </div>
            </div>

          <form onSubmit={buscar} className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <Filtro panel label="Fecha inicial" type="date" value={filtros.fecha_desde} onChange={(valor) => setFiltros({ ...filtros, fecha_desde: valor })} />
            <Filtro panel label="Fecha final" type="date" value={filtros.fecha_hasta} onChange={(valor) => setFiltros({ ...filtros, fecha_hasta: valor })} />
            <Filtro panel label="Tracking" value={filtros.tracking} onChange={(valor) => setFiltros({ ...filtros, tracking: valor })} placeholder="Buscar tracking" />
            <Filtro panel label="Cliente / Casillero" value={filtros.cliente} onChange={(valor) => setFiltros({ ...filtros, cliente: valor })} placeholder="Nombre o código" />
            <Filtro panel label="Contenido" value={filtros.contenido} onChange={(valor) => setFiltros({ ...filtros, contenido: valor })} placeholder="Contenido del paquete" />
            <div className="flex gap-3 border-t border-gray-200/70 pt-5 md:col-span-2 xl:col-span-5 xl:justify-end">
              <button type="button" onClick={limpiarFiltros} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100">
                <RotateCcw size={16} /> Limpiar
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:scale-[1.02]">
                <Search size={16} /> Buscar
              </button>
            </div>
          </form>
          </div>
        </section>

        <section className="relative mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5 pointer-events-none" />
          <div className="flex flex-col gap-3 border-b border-gray-200/70 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-red-950">Gestión de prealertas</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-700">Resultados de prealertas</h2>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
              <span className="rounded-full border border-red-900/15 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-950 shadow-sm">{total} registros</span>
              <select
                value={limite}
                onChange={(event) => {
                  setLimite(Number(event.target.value));
                  setPagina(1);
                }}
                className="h-9 rounded-xl border border-gray-300 bg-white px-3 text-xs font-bold outline-none focus:border-red-950"
                aria-label="Registros por pagina"
              >
                {[10, 20, 50, 100].map((cantidad) => <option key={cantidad} value={cantidad}>{cantidad} por página</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-gray-100 via-white to-gray-50 text-[10px] font-black uppercase tracking-[0.18em] text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Tracking</th>
                  <th className="px-4 py-3 text-left">Contenido</th>
                  <th className="px-4 py-3 text-center">Peso</th>
                  <th className="px-4 py-3 text-right">Declarado</th>
                  <th className="px-4 py-3 text-right">Asegurado</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Opciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="h-40 text-center text-sm font-bold text-gray-500">Cargando prealertas...</td></tr>
                ) : prealertas.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-12 text-center"><div className="mx-auto flex max-w-md flex-col items-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-semibold text-red-950">!</div><p className="font-semibold text-gray-800">No hay resultados para los filtros seleccionados</p><p className="mt-1 text-sm font-semibold text-gray-500">Ajusta los filtros e intenta nuevamente.</p></div></td></tr>
                ) : prealertas.map((prealerta) => (
                  <tr key={prealerta.id} className="transition hover:bg-red-50/40">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600">{formatearFecha(prealerta.fecha_creacion)}</td>
                    <td className="px-4 py-3">
                      <p className="font-black text-gray-800">{prealerta.cliente_nombre || "Cliente"}</p>
                      <p className="mt-1 font-mono text-xs font-bold text-red-900">{prealerta.codigo_referencia}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-red-950">{prealerta.tracking}</td>
                    <td className="max-w-[260px] px-4 py-3 font-semibold text-gray-700"><span className="line-clamp-2">{prealerta.contenido}</span></td>
                    <td className="px-4 py-3 text-center font-bold">{Number(prealerta.peso_lbs).toFixed(2)} lb</td>
                    <td className="px-4 py-3 text-right font-bold">{formatearUSD(prealerta.valor_declarado)}</td>
                    <td className="px-4 py-3 text-right font-bold">{formatearUSD(prealerta.valor_asegurado)}</td>
                    <td className="px-4 py-3 text-center"><span className={`rounded-full border px-3 py-1 text-xs font-black ${prealerta.estado === "Digitado" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{prealerta.estado}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" title={esAdmin ? "Editar prealerta" : "Solo los administradores pueden editar"} disabled={!esAdmin} onClick={() => setPrealertaEditar(prealerta)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-red-950 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"><Pencil size={16} /></button>
                        <button type="button" title={esAdmin ? "Eliminar prealerta" : "Solo los administradores pueden eliminar"} disabled={!esAdmin} onClick={() => eliminarPrealerta(prealerta)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-800 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50/60 px-6 py-4 text-sm font-semibold text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Mostrando {inicio} a {fin} de {total}</span>
            <div className="flex items-center gap-2">
              <button type="button" title="Página anterior" disabled={pagina <= 1 || loading} onClick={() => setPagina((actual) => actual - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"><ChevronLeft size={17} /></button>
              <span className="min-w-28 text-center font-black text-gray-700">Página {pagina} de {totalPaginas}</span>
              <button type="button" title="Página siguiente" disabled={pagina >= totalPaginas || loading} onClick={() => setPagina((actual) => actual + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"><ChevronRight size={17} /></button>
            </div>
          </div>
        </section>
        <ModalEditarPrealerta prealerta={prealertaEditar} guardando={saving} onClose={() => setPrealertaEditar(null)} onSave={editarPrealerta} />
      </div>
    </UserDashboardLayout>
  );
}

const inputClase = "mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-gray-500">{children}</span>;
}

function Campo({ label, name, form, onChange, panel, ...props }: any) {
  return (
    <label className={panel ? "rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm" : ""}>
      <Etiqueta>{label}</Etiqueta>
      <input
        name={name}
        className={inputClase}
        onChange={(event) => onChange({ ...form, [name]: name === "tracking" ? event.target.value.toUpperCase() : event.target.value })}
        {...props}
      />
    </label>
  );
}

function Filtro({ label, value, onChange, type = "text", panel = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; panel?: boolean; placeholder?: string }) {
  return (
    <label className={panel ? "rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm" : ""}>
      <Etiqueta>{label}</Etiqueta>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className={inputClase} />
    </label>
  );
}
