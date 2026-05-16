import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  CheckCircle2,
  Loader2,
  PackagePlus,
  RefreshCcw,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import iconHome from "../../assets/home-svgrepo-com.svg";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";

type Despacho = {
  id: number;
  codigo: string;
  nombre?: string | null;
  observaciones?: string | null;
  oficina_id?: number | null;
  oficina?: string | null;
  transportadora_id?: number | null;
  transportadora_nombre?: string | null;
  fecha_operativa?: string | null;
  estado: "abierto" | "cerrado" | string;
  creado_por?: string | null;
  fecha_creacion?: string | null;
  fecha_cierre?: string | null;
  cantidad_hawbs?: number;
  peso_total?: number;
};

type PaqueteDespacho = {
  despacho_paquete_id: number;
  paquete_id: number;
  hawb: string;
  tracking?: string | null;
  contenido?: string | null;
  tienda?: string | null;
  peso?: number | string | null;
  solicitud_id?: number | null;
  hawb_padre?: string | null;
  estado_actual?: string | null;
  codigo_referencia?: string | null;
  cliente?: string | null;
  fecha_agregado?: string | null;
  agregado_por?: string | null;
};

type DetalleDespacho = {
  despacho: Despacho;
  paquetes: PaqueteDespacho[];
};

const KG_POR_LIBRA = 0.45359237;

const estadoClasses = (estado?: string) => {
  const cerrado = estado?.toLowerCase() === "cerrado";

  return cerrado
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-green-200 bg-green-50 text-green-800";
};

export default function ArmarDespachos() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [detalle, setDetalle] = useState<DetalleDespacho | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [hawb, setHawb] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [guardandoHawb, setGuardandoHawb] = useState(false);

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "{}");
    } catch {
      return {};
    }
  }, []);

  const usuarioActual = usuario?.nombre || usuario?.email || "Usuario del sistema";

  const resumen = useMemo(() => {
    const abiertos = despachos.filter(
      (despacho) => despacho.estado?.toLowerCase() === "abierto"
    ).length;
    const hawbs = despachos.reduce(
      (total, despacho) => total + Number(despacho.cantidad_hawbs || 0),
      0
    );
    const pesoLb = despachos.reduce(
      (total, despacho) => total + Number(despacho.peso_total || 0),
      0
    );

    return { abiertos, hawbs, pesoLb };
  }, [despachos]);

  const detalleResumen = useMemo(() => {
    const paquetes = detalle?.paquetes || [];
    const pesoLb = paquetes.reduce(
      (total, paquete) => total + Number(paquete.peso || 0),
      0
    );

    return {
      hawbs: paquetes.length,
      pesoLb,
      pesoKg: pesoLb * KG_POR_LIBRA,
    };
  }, [detalle]);

  const cargarDespachos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (busqueda.trim()) params.set("q", busqueda.trim());
      params.set("estado", "abierto");
      if (fechaDesde) params.set("fechaDesde", fechaDesde);
      if (fechaHasta) params.set("fechaHasta", fechaHasta);

      const query = params.toString();
      const { data } = await axios.get(`/api/despachos${query ? `?${query}` : ""}`);
      const despachosAbiertos = Array.isArray(data.despachos)
        ? data.despachos.filter(
            (despacho: Despacho) =>
              despacho.estado?.trim().toLowerCase() === "abierto"
          )
        : [];

      setDespachos(despachosAbiertos);
    } catch (error) {
      console.error("Error cargando despachos:", error);
      Swal.fire("Error", "No se pudieron cargar los despachos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (despachoId: string | number) => {
    setLoadingDetalle(true);
    try {
      const { data } = await axios.get(`/api/despachos/${despachoId}`);
      setDetalle({
        despacho: data.despacho,
        paquetes: Array.isArray(data.paquetes) ? data.paquetes : [],
      });
    } catch (error: any) {
      console.error("Error cargando detalle del despacho:", error);
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo cargar el despacho",
        "error"
      );
      navigate("/armar-despachos");
    } finally {
      setLoadingDetalle(false);
    }
  };

  useEffect(() => {
    if (id) {
      cargarDetalle(id);
      return;
    }

    setDetalle(null);
    cargarDespachos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const buscarDespachos = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    cargarDespachos();
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
    setTimeout(() => cargarDespachos(), 0);
  };

  const abrirDespacho = (despacho: Despacho) => {
    navigate(`/armar-despachos/${despacho.id}`);
  };

  const agregarHawb = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!detalle?.despacho?.id || !hawb.trim()) {
      Swal.fire("Aviso", "Ingresa el HAWB que deseas agregar", "warning");
      return;
    }

    setGuardandoHawb(true);
    try {
      await axios.post(`/api/despachos/${detalle.despacho.id}/hawbs`, {
        hawb: hawb.trim(),
        responsable: usuarioActual,
      });

      setHawb("");
      await cargarDetalle(detalle.despacho.id);
      Swal.fire("Listo", "HAWB agregado al despacho correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo agregar el HAWB",
        "error"
      );
    } finally {
      setGuardandoHawb(false);
    }
  };

  const quitarHawb = async (paquete: PaqueteDespacho) => {
    if (!detalle?.despacho?.id) return;

    const confirmacion = await Swal.fire({
      title: "Retirar HAWB",
      text: `Se retirara ${paquete.hawb} de este despacho.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Retirar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#991b1b",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.delete(`/api/despachos/${detalle.despacho.id}/hawbs/${paquete.hawb}`);
      await cargarDetalle(detalle.despacho.id);
      Swal.fire("Listo", "HAWB retirado correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo retirar el HAWB",
        "error"
      );
    }
  };

  const despachoCerrado = detalle?.despacho.estado?.toLowerCase() === "cerrado";

  return (
    <UserDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 pb-8 text-gray-800 animate-fade-in sm:px-6 lg:px-8">
        <h1 className="mb-1 text-3xl font-bold text-red-900">Armar Despachos</h1>

        <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="cursor-pointer font-semibold text-gray-700 hover:underline"
          >
            Dashboard
          </button>
          &gt; Armar Despachos
        </p>

        {!id ? (
          <>
            <section className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_22px_55px_rgba(17,24,39,0.10)] sm:p-6">
              <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-red-950/5" />
              <div className="pointer-events-none absolute -bottom-28 left-1/3 h-52 w-52 rounded-full border border-red-950/10" />

              <div className="relative grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                    Ensamble operativo
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                    Busca el despacho y alimenta sus HAWB
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                    Solo se muestran despachos abiertos. Selecciona una fila para agregar
                    los HAWB correspondientes.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-700">
                      Abiertos
                    </p>
                    <p className="mt-1 text-2xl font-black text-green-800">
                      {resumen.abiertos}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                      HAWB
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-700">
                      {resumen.hawbs}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                      Lbs
                    </p>
                    <p className="mt-1 text-2xl font-black text-gray-600">
                      {resumen.pesoLb.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={buscarDespachos}
                className="relative mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-slate-50/80 p-5 lg:grid-cols-[minmax(320px,1.5fr)_minmax(170px,0.6fr)_minmax(170px,0.6fr)_auto] lg:items-end"
              >
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Busqueda
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-gray-800 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                      placeholder="Codigo, descripcion, oficina, transportadora..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </button>
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-600 shadow-sm transition hover:border-red-900/30 hover:text-red-950"
                    title="Limpiar filtros"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </button>
                </div>
              </form>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
              <div className="flex flex-col gap-3 border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                    Despachos creados
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-800">
                    Selecciona una fila para armar
                  </h3>
                </div>
                <button
                  onClick={() => cargarDespachos()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:border-red-900/30 hover:text-red-950 "
                >
                  <RefreshCcw className="h-4 w-4" />
                  Actualizar
                </button>
              </div>

              <div className="w-full max-w-full overflow-x-auto">
                <table className="w-full min-w-[1060px] border-collapse">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-xs font-black uppercase tracking-[0.14em] text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">Codigo</th>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Descripcion</th>
                      <th className="px-4 py-3 text-left">Transportadora</th>
                      <th className="px-4 py-3 text-center">HAWB</th>
                      <th className="px-4 py-3 text-center">Peso lbs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-red-900 border-t-transparent" />
                        </td>
                      </tr>
                    ) : despachos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center">
                          <p className="font-semibold text-gray-500">
                            No hay despachos con los filtros seleccionados.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      despachos.map((despacho) => (
                        <tr
                          key={despacho.id}
                          onClick={() => abrirDespacho(despacho)}
                          className="group cursor-pointer text-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-red-950 hover:via-red-900 hover:to-red-800 hover:shadow-[0_12px_28px_rgba(91,0,13,0.22)] [&:hover_p]:!text-white [&:hover_span]:!text-white [&:hover_td]:!text-white"
                        >
                          <td className="relative px-4 py-3 font-mono font-bold text-red-950 transition-colors duration-200 group-hover:!text-white">
                            <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                            <span className="relative">{despacho.id}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-700 transition-colors duration-200 group-hover:!text-white">
                            {despacho.codigo}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-600 transition-colors duration-200 group-hover:!text-white">
                            {despacho.fecha_creacion || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-700 transition-colors duration-200 group-hover:!text-white">
                              {despacho.nombre || "Sin descripcion"}
                            </p>
                            <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-400 transition-colors duration-200 group-hover:!text-white">
                              {despacho.observaciones || despacho.oficina || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-600 transition-colors duration-200 group-hover:!text-white">
                            {despacho.transportadora_nombre || "-"}
                          </td>
                          <td className="px-4 py-3 text-center font-black text-gray-700 transition-colors duration-200 group-hover:!text-white">
                            {despacho.cantidad_hawbs || 0}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-gray-700 transition-colors duration-200 group-hover:!text-white">
                            {Number(despacho.peso_total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="space-y-6">
            <button
              onClick={() => navigate("/armar-despachos")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-black text-gray-700 shadow-sm transition hover:border-red-900/30 hover:text-red-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a despachos
            </button>

            {loadingDetalle || !detalle ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-red-900 border-t-transparent" />
                <p className="mt-4 font-semibold text-gray-500">Cargando despacho...</p>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-red-700 to-slate-300" />
                  <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full border border-red-950/10" />

                  <div className="relative grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                        Detalle del despacho
                      </p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-800">
                        {detalle.despacho.nombre || detalle.despacho.codigo}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-red-900/10 bg-red-50 px-3 py-1 text-xs font-black text-red-950">
                          {detalle.despacho.codigo}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${estadoClasses(detalle.despacho.estado)}`}>
                          {detalle.despacho.estado}
                        </span>
                        <span className="rounded-full border border-gray-200 bg-slate-50 px-3 py-1 text-xs font-black text-gray-600">
                          {detalle.despacho.oficina || "Sin oficina"}
                        </span>
                      </div>
                      <p className="mt-4 max-w-3xl text-sm font-medium leading-6 text-gray-500">
                        {detalle.despacho.observaciones || "Sin observaciones registradas."}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                        <Box className="mb-2 h-5 w-5 text-red-950" />
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
                          HAWB
                        </p>
                        <p className="mt-1 text-2xl font-black text-gray-800">
                          {detalleResumen.hawbs}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                        <Truck className="mb-2 h-5 w-5 text-red-950" />
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
                          Lbs
                        </p>
                        <p className="mt-1 text-2xl font-black text-gray-800">
                          {detalleResumen.pesoLb.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                        <CalendarDays className="mb-2 h-5 w-5 text-red-950" />
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
                          Kgs
                        </p>
                        <p className="mt-1 text-2xl font-black text-gray-800">
                          {detalleResumen.pesoKg.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative border-t border-gray-200 bg-gradient-to-r from-slate-50 via-white to-red-50/30 px-5 py-4">
                    <dl className="grid gap-4 text-sm md:grid-cols-3">
                      <div>
                        <dt className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                          Transportadora
                        </dt>
                        <dd className="mt-1 font-black text-gray-700">
                          {detalle.despacho.transportadora_nombre || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                          Creado por
                        </dt>
                        <dd className="mt-1 font-black text-gray-700">
                          {detalle.despacho.creado_por || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                          Fecha
                        </dt>
                        <dd className="mt-1 font-black text-gray-700">
                          {detalle.despacho.fecha_creacion || detalle.despacho.fecha_operativa || "-"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <form
                  onSubmit={agregarHawb}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
                >
                  <div className="flex flex-col gap-3 border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                        Alimentar despacho
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-800">
                        Agregar HAWB al despacho
                      </h3>
                    </div>
                    {despachoCerrado && (
                      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-900">
                        Despacho cerrado
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 p-5 md:grid-cols-[1fr_auto]">
                    <input
                      value={hawb}
                      onChange={(e) => setHawb(e.target.value.toUpperCase())}
                      disabled={despachoCerrado}
                      className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-black uppercase tracking-wide text-gray-800 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                      placeholder="Ingresa el HAWB a importar"
                    />
                    <button
                      type="submit"
                      disabled={guardandoHawb || despachoCerrado}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {guardandoHawb ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PackagePlus className="h-4 w-4" />
                      )}
                      Agregar HAWB
                    </button>
                  </div>
                </form>

                <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                  <div className="border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                      HAWB importados
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-gray-800">
                      Paquetes dentro del despacho
                    </h3>
                  </div>

                  <div className="w-full max-w-full overflow-x-auto">
                    <table className="w-full min-w-[1120px] border-collapse">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-xs font-black uppercase tracking-[0.14em] text-gray-600">
                        <tr>
                          <th className="px-4 py-4 text-left">Opciones</th>
                          <th className="px-4 py-4 text-left">HAWB</th>
                          <th className="px-4 py-4 text-left">Tracking</th>
                          <th className="px-4 py-4 text-left">Cliente</th>
                          <th className="px-4 py-4 text-left">Contenido</th>
                          <th className="px-4 py-4 text-left">Tienda</th>
                          <th className="px-4 py-4 text-center">Peso</th>
                          <th className="px-4 py-4 text-left">Estado</th>
                          <th className="px-4 py-4 text-left">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detalle.paquetes.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center">
                              <p className="font-semibold text-gray-500">
                                Este despacho aun no tiene HAWB agregados.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          detalle.paquetes.map((paquete) => (
                            <tr key={paquete.despacho_paquete_id} className="text-sm transition hover:bg-red-50/40">
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => quitarHawb(paquete)}
                                  disabled={despachoCerrado}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-900 text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                  title="Retirar HAWB"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                              <td className="px-4 py-3 font-black text-red-950">
                                {paquete.hawb}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-600">
                                {paquete.tracking || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-black text-gray-700">
                                  {paquete.cliente || "-"}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-gray-400">
                                  {paquete.codigo_referencia || "-"}
                                </p>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-600">
                                {paquete.contenido || "-"}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-600">
                                {paquete.tienda || "-"}
                              </td>
                              <td className="px-4 py-3 text-center font-black text-gray-700">
                                {Number(paquete.peso || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {paquete.estado_actual || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-600">
                                {paquete.fecha_agregado || "-"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </section>
        )}
      </div>
    </UserDashboardLayout>
  );
}
