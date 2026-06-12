import { FormEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  BellPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  PackagePlus,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import BuscarClientes from "../../components/clientes/BuscarClientes";

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

  const inicio = total === 0 ? 0 : (pagina - 1) * limite + 1;
  const fin = Math.min(pagina * limite, total);

  return (
    <UserDashboardLayout scrollable>
      <div className="mx-auto w-full max-w-[1500px] pb-10 text-gray-800">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500">Casillero &gt; Prealertas</p>
            <h1 className="mt-2 text-3xl font-black text-red-950">Prealertas</h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Consulta y registra los paquetes anunciados por los clientes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMostrarFormulario((actual) => !actual)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-950 px-5 text-sm font-black text-white shadow-lg shadow-red-950/15 transition hover:bg-red-900"
          >
            {mostrarFormulario ? <X size={17} /> : <Plus size={17} />}
            {mostrarFormulario ? "Cerrar formulario" : "Crear prealerta"}
          </button>
        </header>

        {mostrarFormulario && (
          <section className="mb-6 border-t-4 border-red-950 bg-white p-6 shadow-lg">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-950">
                <PackagePlus size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-900">Registro manual</p>
                <h2 className="text-xl font-black">Nueva prealerta</h2>
              </div>
            </div>

            <form onSubmit={crearPrealerta} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="xl:col-span-3">
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
              <Campo label="Tracking" name="tracking" value={form.tracking} onChange={setForm} form={form} required />
              <Campo label="Peso en lbs" name="peso_lbs" type="number" value={form.peso_lbs} onChange={setForm} form={form} required min="0.01" step="0.01" />
              <Campo label="Contenido" name="contenido" value={form.contenido} onChange={setForm} form={form} required />
              <Campo label="Vl. declarado" name="valor_declarado" type="number" value={form.valor_declarado} onChange={setForm} form={form} required min="0" step="0.01" />
              <Campo label="Vl. asegurado" name="valor_asegurado" type="number" value={form.valor_asegurado} onChange={setForm} form={form} required min="0" step="0.01" />
              <label>
                <Etiqueta>Observaciones</Etiqueta>
                <input
                  value={form.observaciones}
                  onChange={(event) => setForm((actual) => ({ ...actual, observaciones: event.target.value }))}
                  className={inputClase}
                  placeholder="Opcional"
                />
              </label>
              <div className="flex justify-end md:col-span-2 xl:col-span-3">
                <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-950 px-6 text-sm font-black text-white disabled:opacity-60">
                  <BellPlus size={17} />
                  {saving ? "Guardando..." : "Guardar prealerta"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mb-6 border-t-4 border-red-950 bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <Filter size={19} className="text-red-950" />
            <h2 className="text-lg font-black">Filtrar prealertas</h2>
          </div>
          <form onSubmit={buscar} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Filtro label="Tracking" value={filtros.tracking} onChange={(valor) => setFiltros({ ...filtros, tracking: valor })} />
            <Filtro label="Cliente o casillero" value={filtros.cliente} onChange={(valor) => setFiltros({ ...filtros, cliente: valor })} />
            <Filtro label="Contenido" value={filtros.contenido} onChange={(valor) => setFiltros({ ...filtros, contenido: valor })} />
            <Filtro label="Fecha desde" type="date" value={filtros.fecha_desde} onChange={(valor) => setFiltros({ ...filtros, fecha_desde: valor })} />
            <Filtro label="Fecha hasta" type="date" value={filtros.fecha_hasta} onChange={(valor) => setFiltros({ ...filtros, fecha_hasta: valor })} />
            <div className="flex gap-2 md:col-span-2 xl:col-span-5 xl:justify-end">
              <button type="button" onClick={limpiarFiltros} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50">
                <RotateCcw size={16} /> Limpiar
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-950 px-5 text-sm font-black text-white hover:bg-red-900">
                <Search size={16} /> Buscar
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden bg-white shadow-lg">
          <div className="flex flex-col gap-3 border-t-4 border-red-950 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList size={21} className="text-red-950" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-900">Resultados</p>
                <h2 className="text-xl font-black">Prealertas registradas</h2>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
              <span>{total} registros</span>
              <select
                value={limite}
                onChange={(event) => {
                  setLimite(Number(event.target.value));
                  setPagina(1);
                }}
                className="h-9 rounded-lg border border-gray-300 bg-white px-3 font-bold outline-none focus:border-red-950"
                aria-label="Registros por pagina"
              >
                {[10, 20, 50, 100].map((cantidad) => <option key={cantidad} value={cantidad}>{cantidad} por página</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse">
              <thead className="bg-gray-100 text-[10px] font-black uppercase tracking-[0.14em] text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Tracking</th>
                  <th className="px-4 py-3 text-left">Contenido</th>
                  <th className="px-4 py-3 text-center">Peso</th>
                  <th className="px-4 py-3 text-right">Declarado</th>
                  <th className="px-4 py-3 text-right">Asegurado</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={8} className="h-40 text-center text-sm font-bold text-gray-500">Cargando prealertas...</td></tr>
                ) : prealertas.length === 0 ? (
                  <tr><td colSpan={8} className="h-40 text-center text-sm font-bold text-gray-500">No se encontraron prealertas</td></tr>
                ) : prealertas.map((prealerta) => (
                  <tr key={prealerta.id} className="text-sm transition hover:bg-red-50/40">
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
                    <td className="px-4 py-3 text-center"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">{prealerta.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm font-semibold text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Mostrando {inicio} a {fin} de {total}</span>
            <div className="flex items-center gap-2">
              <button type="button" title="Página anterior" disabled={pagina <= 1 || loading} onClick={() => setPagina((actual) => actual - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"><ChevronLeft size={17} /></button>
              <span className="min-w-28 text-center font-black text-gray-700">Página {pagina} de {totalPaginas}</span>
              <button type="button" title="Página siguiente" disabled={pagina >= totalPaginas || loading} onClick={() => setPagina((actual) => actual + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"><ChevronRight size={17} /></button>
            </div>
          </div>
        </section>
      </div>
    </UserDashboardLayout>
  );
}

const inputClase = "h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-red-950 focus:ring-4 focus:ring-red-950/10";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-gray-500">{children}</span>;
}

function Campo({ label, name, form, onChange, ...props }: any) {
  return (
    <label>
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

function Filtro({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <Etiqueta>{label}</Etiqueta>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={inputClase} />
    </label>
  );
}
