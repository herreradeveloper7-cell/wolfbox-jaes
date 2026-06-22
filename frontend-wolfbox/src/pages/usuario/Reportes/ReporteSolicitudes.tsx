import { useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { exportarExcel, filasDesdeObjetos } from "../../../utils/exportarExcel";
import { CalendarDays, Download, FileSpreadsheet, Loader2, ShieldCheck } from "lucide-react";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout"
import { useNavigate } from "react-router-dom";
import iconHome from "../../../assets/home-svgrepo-com.svg";

type FiltroDesbloqueo = "todas" | "desbloqueadas" | "sin_desbloquear";

type SolicitudReporte = {
  id: number;
  fecha?: string | null;
  estado_solicitud?: string | null;
  medio_pago?: string | null;
  observaciones?: string | null;
  valor_estimado_usd?: number | string | null;
  valor_moneda_local?: number | string | null;
  trm_liquidacion?: number | string | null;
  flete_usd?: number | string | null;
  seguro_usd?: number | string | null;
  cargos_usd?: number | string | null;
  cargos_cop?: number | string | null;
  codigo_casillero?: string | null;
  cliente?: string | null;
  destinatario?: string | null;
  servicio?: string | null;
  cantidad_paquetes?: number | string | null;
  peso_total?: number | string | null;
  hawbs?: string | null;
  desbloqueada?: number | boolean | null;
};

const REPORTE_SOLICITUDES_VERSION = "solicitudes-main-20260604-2";

const limpiarNombreArchivo = (valor: string) =>
  valor.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");

export default function ReporteSolicitudes() {
  const navigate = useNavigate();
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [desbloqueo, setDesbloqueo] = useState<FiltroDesbloqueo>("todas");
  const [descargando, setDescargando] = useState(false);

  const resumenFiltro = useMemo(() => {
    if (desbloqueo === "desbloqueadas") return "Solicitudes desbloqueadas";
    if (desbloqueo === "sin_desbloquear") return "Solicitudes sin desbloquear";
    return "Todas las solicitudes";
  }, [desbloqueo]);

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
      params.set("desbloqueo", desbloqueo);

      const { data } = await axios.get(`/api/solicitudes/reporte?${params.toString()}`);
      const solicitudes: SolicitudReporte[] = Array.isArray(data.solicitudes)
        ? data.solicitudes
        : [];

      if (solicitudes.length === 0) {
        Swal.fire("Sin datos", "No hay solicitudes para los filtros seleccionados", "info");
        return;
      }

      const totalPeso = solicitudes.reduce(
        (total, solicitud) => total + Number(solicitud.peso_total || 0),
        0
      );
      const totalCargosUsd = solicitudes.reduce(
        (total, solicitud) => total + Number(solicitud.cargos_usd || 0),
        0
      );
      const totalCargosCop = solicitudes.reduce(
        (total, solicitud) => total + Number(solicitud.cargos_cop || 0),
        0
      );
      const rows = solicitudes.map((solicitud) => ({
        "Solicitud ID": solicitud.id,
        Fecha: solicitud.fecha || "-",
        "Estado solicitud": solicitud.estado_solicitud || "-",
        Desbloqueada: Number(solicitud.desbloqueada || 0) === 1 ? "Si" : "No",
        Casillero: solicitud.codigo_casillero || "-",
        Cliente: solicitud.cliente || "-",
        Destinatario: solicitud.destinatario || "-",
        Servicio: solicitud.servicio || "-",
        "Medio pago": solicitud.medio_pago || "-",
        "Cantidad paquetes": Number(solicitud.cantidad_paquetes || 0),
        "Peso total": Number(Number(solicitud.peso_total || 0).toFixed(2)),
        "Flete USD": Number(Number(solicitud.flete_usd || 0).toFixed(2)),
        "Seguro USD": Number(Number(solicitud.seguro_usd || 0).toFixed(2)),
        "Cargos USD": Number(Number(solicitud.cargos_usd || 0).toFixed(2)),
        "Valor USD": Number(Number(solicitud.valor_estimado_usd || 0).toFixed(2)),
        "TRM liquidacion": Number(Number(solicitud.trm_liquidacion || 0).toFixed(2)),
        "Cargos COP": Number(Number(solicitud.cargos_cop || 0).toFixed(2)),
        "Valor COP": Number(Number(solicitud.valor_moneda_local || 0).toFixed(2)),
        HAWB: solicitud.hawbs || "-",
        Observaciones: solicitud.observaciones || "-",
      }));
      const resumen = [
        ["Reporte", "Solicitudes"],
        ["Version reporte", REPORTE_SOLICITUDES_VERSION],
        ["Filtro", resumenFiltro],
        ["Fecha inicial", fechaDesde || "Sin filtro"],
        ["Fecha final", fechaHasta || "Sin filtro"],
        ["Total solicitudes", solicitudes.length],
        ["Peso total", Number(totalPeso.toFixed(2))],
        ["Total cargos USD", Number(totalCargosUsd.toFixed(2))],
        ["Total cargos COP", Number(totalCargosCop.toFixed(2))],
        ["Generado", new Date().toLocaleString("es-CO")],
      ];
      await exportarExcel(
        `Reporte_Solicitudes_${limpiarNombreArchivo(desbloqueo)}_${REPORTE_SOLICITUDES_VERSION}_${new Date().toISOString().slice(0, 10)}.xlsx`,
        [
          { nombre: "Resumen", filas: resumen, anchos: [22, 42] },
          {
            nombre: "Solicitudes",
            filas: filasDesdeObjetos(rows),
            anchos: [14, 20, 18, 14, 18, 34, 34, 24, 18, 18, 14, 14, 14, 14, 14, 18, 14, 16, 42, 42],
          },
        ]
      );

      Swal.fire("Listo", "Reporte descargado correctamente", "success");
    } catch (error: any) {
      console.error("Error descargando reporte de solicitudes:", error);
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
        <h1 className="mb-1 text-3xl font-bold text-red-900">Reporte Solicitudes</h1>

        <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="cursor-pointer font-semibold text-gray-700 hover:underline"
          >
            Dashboard
          </button>
          &gt; Reporte Solicitudes
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
                Exportar solicitudes creadas
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                Descarga un Excel con las solicitudes creadas en el sistema.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-red-900/10 bg-red-50 p-3">
                <ShieldCheck className="mb-2 h-5 w-5 text-red-950" />
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-950">
                  Filtro
                </p>
                <p className="mt-1 text-sm font-black text-gray-700">{resumenFiltro}</p>
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
                  Estado de desbloqueo
                </label>
                <select
                  value={desbloqueo}
                  onChange={(e) => setDesbloqueo(e.target.value as FiltroDesbloqueo)}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                >
                  <option value="todas">Todas</option>
                  <option value="desbloqueadas">Desbloqueadas</option>
                  <option value="sin_desbloquear">Sin desbloquear</option>
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

