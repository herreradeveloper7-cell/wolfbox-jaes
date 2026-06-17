import { useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { exportarExcel, filasDesdeObjetos } from "../../../utils/exportarExcel";
import { CalendarDays, Download, FileSpreadsheet, Loader2, UsersRound } from "lucide-react";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout"
import { useNavigate } from "react-router-dom";
import iconHome from "../../../assets/home-svgrepo-com.svg";

type TipoCliente = "todos" | "personal" | "empresarial";

type ClienteReporte = {
  id: number;
  codigo_referencia?: string | null;
  tipo_cliente?: string | null;
  nombre?: string | null;
  nombre_empresa?: string | null;
  tipo_identificacion?: string | null;
  numero_identificacion?: string | null;
  correo?: string | null;
  pais?: string | null;
  region?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  indicativo?: string | null;
  celular?: string | null;
  telefono_fijo?: string | null;
  genero?: string | null;
  fecha_creacion?: string | null;
};

const limpiarNombreArchivo = (valor: string) =>
  valor.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");

export default function ReporteClientesCasilleros() {
    const navigate = useNavigate();
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [tipoCliente, setTipoCliente] = useState<TipoCliente>("todos");
    const [descargando, setDescargando] = useState(false);

    const resumenTipo = useMemo(() => {
      if (tipoCliente === "personal") return "Clientes personales";
      if (tipoCliente === "empresarial") return "Clientes empresariales";
      return "Todos los clientes";
    }, [tipoCliente]);

    const descargarReporte = async () => {
      if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
        Swal.fire("Aviso", "La fecha inicial no puede ser mayor a la fecha final", "warning");
        return;
      }

      setDescargando(true);
      try {
        const params = new URLSearchParams();
        if (fechaDesde) params.set("fechaDesde", fechaDesde);
        if (fechaHasta) params.set("fechaHasta", fechaHasta);
        params.set("tipo_cliente", tipoCliente);

        const { data } = await axios.get(`/api/clientes/reporte-casilleros?${params.toString()}`);
        const clientes: ClienteReporte[] = Array.isArray(data.clientes) ? data.clientes : [];

        if (clientes.length === 0) {
          Swal.fire("Sin datos", "No hay clientes para los filtros seleccionados", "info");
          return;
        }

        const rows = clientes.map((cliente) => ({
          ID: cliente.id,
          Casillero: cliente.codigo_referencia || "-",
          "Tipo cliente": cliente.tipo_cliente || "-",
          Nombre: cliente.nombre || "-",
          Empresa: cliente.nombre_empresa || "-",
          "Tipo identificacion": cliente.tipo_identificacion || "-",
          Identificacion: cliente.numero_identificacion || "-",
          Correo: cliente.correo || "-",
          Pais: cliente.pais || "-",
          Region: cliente.region || "-",
          Ciudad: cliente.ciudad || "-",
          Direccion: cliente.direccion || "-",
          Indicativo: cliente.indicativo || "-",
          Celular: cliente.celular || "-",
          "Telefono fijo": cliente.telefono_fijo || "-",
          Genero: cliente.genero || "-",
          "Fecha creacion": cliente.fecha_creacion || "-",
        }));
        const resumen = [
          ["Reporte", "Clientes Casilleros"],
          ["Tipo", resumenTipo],
          ["Fecha inicial", fechaDesde || "Sin filtro"],
          ["Fecha final", fechaHasta || "Sin filtro"],
          ["Total clientes", clientes.length],
          ["Generado", new Date().toLocaleString("es-CO")],
        ];
        await exportarExcel(
          `Reporte_Clientes_Casilleros_${limpiarNombreArchivo(tipoCliente)}_${new Date().toISOString().slice(0, 10)}.xlsx`,
          [
            { nombre: "Resumen", filas: resumen, anchos: [20, 38] },
            {
              nombre: "Clientes",
              filas: filasDesdeObjetos(rows),
              anchos: [10, 18, 16, 34, 34, 20, 20, 34, 16, 18, 18, 44, 12, 18, 18, 14, 20],
            },
          ]
        );

        Swal.fire("Listo", "Reporte descargado correctamente", "success");
      } catch (error: any) {
        console.error("Error descargando reporte de clientes:", error);
        Swal.fire(
          "Error",
          error.response?.data?.mensaje || error.message || "No se pudo descargar el reporte",
          "error"
        );
      } finally {
        setDescargando(false);
      }
    };

    return (
    <UserDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 pb-8 text-gray-800 animate-fade-in sm:px-6 lg:px-8">
        <h1 className="mb-1 text-3xl font-bold text-red-900">Reporte Clientes Casilleros</h1>

        <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="cursor-pointer font-semibold text-gray-700 hover:underline"
          >
            Dashboard
          </button>
          &gt; Reporte Clientes Casilleros
        </p>

        <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_22px_55px_rgba(17,24,39,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-red-950/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full border border-red-950/10" />

          <div className="relative grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                Reportería operativa
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                Exportar clientes de casilleros
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                Filtra por fecha de creación y tipo de cliente para descargar un archivo Excel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-red-900/10 bg-red-50 p-3">
                <UsersRound className="mb-2 h-5 w-5 text-red-950" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-950">
                  Segmento
                </p>
                <p className="mt-1 text-sm font-black text-gray-700">{resumenTipo}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3">
                <FileSpreadsheet className="mb-2 h-5 w-5 text-red-950" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                  Formato
                </p>
                <p className="mt-1 text-sm font-black text-gray-700">Excel .xlsx</p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-red-700 to-slate-300" />
            <div className="border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                Filtros del reporte
              </p>
              <h3 className="mt-1 text-lg font-semibold text-gray-800">
                Configura la descarga
              </h3>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  <CalendarDays className="h-4 w-4 text-red-950" />
                  Fecha inicial
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  <CalendarDays className="h-4 w-4 text-red-950" />
                  Fecha final
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  Tipo de cliente
                </label>
                <select
                  value={tipoCliente}
                  onChange={(e) => setTipoCliente(e.target.value as TipoCliente)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                >
                  <option value="todos">Todos</option>
                  <option value="personal">Personal</option>
                  <option value="empresarial">Empresarial</option>
                </select>
              </div>

              <button
                onClick={descargarReporte}
                disabled={descargando}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {descargando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {descargando ? "Descargando..." : "Descargar reporte"}
              </button>
            </div>
          </div>
        </section>
    </div>
    </UserDashboardLayout>
  );
}
