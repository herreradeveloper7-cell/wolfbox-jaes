import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { CalendarDays, Download, FileSpreadsheet, Loader2, MapPin, Route } from "lucide-react";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout"
import { useNavigate } from "react-router-dom";
import iconHome from "../../../assets/home-svgrepo-com.svg";

type CatalogoEstado = {
  oficina_id: number;
  oficina: string;
  punto_control_id: number;
  punto_control: string;
  estado_id: number;
  estado: string;
};

type PaqueteReporte = {
  id: number;
  hawb?: string | null;
  tracking?: string | null;
  referencia?: string | null;
  tienda?: string | null;
  contenido?: string | null;
  peso?: number | string | null;
  codigo_referencia?: string | null;
  digitado_por?: string | null;
  fecha_registro?: string | null;
  estado?: string | null;
  punto_control?: string | null;
  oficina?: string | null;
  servicio?: string | null;
  destinatario?: string | null;
  cliente?: string | null;
};

const limpiarNombreArchivo = (valor: string) =>
  valor.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");

export default function ReporteEstadoGuia() {
  const navigate = useNavigate();
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [oficinaId, setOficinaId] = useState("");
  const [puntoControlId, setPuntoControlId] = useState("");
  const [estadoId, setEstadoId] = useState("");
  const [catalogoEstados, setCatalogoEstados] = useState<CatalogoEstado[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const oficinas = useMemo(() => {
    const mapa = new Map<number, string>();
    catalogoEstados.forEach((item) => mapa.set(item.oficina_id, item.oficina));
    return Array.from(mapa, ([id, nombre]) => ({ id, nombre }));
  }, [catalogoEstados]);

  const puntosControl = useMemo(() => {
    const mapa = new Map<number, string>();
    catalogoEstados
      .filter((item) => !oficinaId || String(item.oficina_id) === oficinaId)
      .forEach((item) => mapa.set(item.punto_control_id, item.punto_control));
    return Array.from(mapa, ([id, nombre]) => ({ id, nombre }));
  }, [catalogoEstados, oficinaId]);

  const estadosGuia = useMemo(
    () =>
      catalogoEstados.filter(
        (item) =>
          (!oficinaId || String(item.oficina_id) === oficinaId) &&
          (!puntoControlId || String(item.punto_control_id) === puntoControlId)
      ),
    [catalogoEstados, oficinaId, puntoControlId]
  );

  const resumenFiltro = useMemo(() => {
    const oficina = oficinas.find((item) => String(item.id) === oficinaId)?.nombre;
    const punto = puntosControl.find((item) => String(item.id) === puntoControlId)?.nombre;
    const estado = estadosGuia.find((item) => String(item.estado_id) === estadoId)?.estado;

    return estado || punto || oficina || "Todos los estados actuales";
  }, [estadoId, estadosGuia, oficinaId, oficinas, puntoControlId, puntosControl]);

  useEffect(() => {
    const cargarCatalogo = async () => {
      setCargandoCatalogo(true);
      try {
        const { data } = await axios.get("/api/paquetes/catalogo-estados");
        setCatalogoEstados(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando catalogo de estados:", error);
        Swal.fire("Error", "No se pudo cargar el catalogo de estados", "error");
      } finally {
        setCargandoCatalogo(false);
      }
    };

    cargarCatalogo();
  }, []);

  const seleccionarOficina = (value: string) => {
    setOficinaId(value);
    setPuntoControlId("");
    setEstadoId("");
  };

  const seleccionarPuntoControl = (value: string) => {
    setPuntoControlId(value);
    setEstadoId("");
  };

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
      if (oficinaId) params.set("oficina_id", oficinaId);
      if (puntoControlId) params.set("punto_control_id", puntoControlId);
      if (estadoId) params.set("estado_id", estadoId);

      const { data } = await axios.get(`/api/paquetes/reporte-estado-guia?${params.toString()}`);
      const paquetes: PaqueteReporte[] = Array.isArray(data.paquetes) ? data.paquetes : [];

      if (paquetes.length === 0) {
        Swal.fire("Sin datos", "No hay HAWB para los filtros seleccionados", "info");
        return;
      }

      const totalPeso = paquetes.reduce(
        (total, paquete) => total + Number(paquete.peso || 0),
        0
      );
      const rows = paquetes.map((paquete) => ({
        ID: paquete.id,
        HAWB: paquete.hawb || "-",
        Tracking: paquete.tracking || "-",
        Referencia: paquete.referencia || "-",
        Casillero: paquete.codigo_referencia || "-",
        Cliente: paquete.cliente || "-",
        Destinatario: paquete.destinatario || "-",
        Oficina: paquete.oficina || "-",
        "Punto de control": paquete.punto_control || "-",
        "Estado actual": paquete.estado || "-",
        Servicio: paquete.servicio || "-",
        Tienda: paquete.tienda || "-",
        Contenido: paquete.contenido || "-",
        Peso: Number(Number(paquete.peso || 0).toFixed(2)),
        "Digitado por": paquete.digitado_por || "-",
        "Fecha registro": paquete.fecha_registro || "-",
      }));
      const resumen = [
        ["Reporte", "Estado Guia"],
        ["Filtro", resumenFiltro],
        ["Fecha inicial", fechaDesde || "Sin filtro"],
        ["Fecha final", fechaHasta || "Sin filtro"],
        ["Total HAWB", paquetes.length],
        ["Peso total", Number(totalPeso.toFixed(2))],
        ["Generado", new Date().toLocaleString("es-CO")],
      ];
      const workbook = XLSX.utils.book_new();
      const resumenSheet = XLSX.utils.aoa_to_sheet(resumen);
      const paquetesSheet = XLSX.utils.json_to_sheet(rows);

      resumenSheet["!cols"] = [{ wch: 22 }, { wch: 44 }];
      paquetesSheet["!cols"] = [
        { wch: 10 },
        { wch: 18 },
        { wch: 28 },
        { wch: 20 },
        { wch: 18 },
        { wch: 34 },
        { wch: 34 },
        { wch: 24 },
        { wch: 28 },
        { wch: 28 },
        { wch: 24 },
        { wch: 24 },
        { wch: 44 },
        { wch: 12 },
        { wch: 24 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");
      XLSX.utils.book_append_sheet(workbook, paquetesSheet, "HAWB");
      XLSX.writeFile(
        workbook,
        `Reporte_Estado_Guia_${limpiarNombreArchivo(resumenFiltro)}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );

      Swal.fire("Listo", "Reporte descargado correctamente", "success");
    } catch (error: any) {
      console.error("Error descargando reporte de estado guia:", error);
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
        <h1 className="mb-1 text-3xl font-bold text-red-900">Reporte Estado Guía</h1>

        <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="cursor-pointer font-semibold text-gray-700 hover:underline"
          >
            Dashboard
          </button>
          &gt; Reporte Estado Guía
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
                Exportar HAWB por estado actual
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                Filtra por fecha de creación, oficina, punto de control y estado guía.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-red-900/10 bg-red-50 p-3">
                <Route className="mb-2 h-5 w-5 text-red-950" />
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

            <div className="grid gap-4 p-5 lg:grid-cols-3">
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
                <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  <MapPin className="h-4 w-4 text-red-950" />
                  Oficina
                </label>
                <select
                  value={oficinaId}
                  onChange={(e) => seleccionarOficina(e.target.value)}
                  disabled={cargandoCatalogo}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">{cargandoCatalogo ? "Cargando..." : "Todas"}</option>
                  {oficinas.map((oficina) => (
                    <option key={oficina.id} value={oficina.id}>
                      {oficina.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  Punto de control
                </label>
                <select
                  value={puntoControlId}
                  onChange={(e) => seleccionarPuntoControl(e.target.value)}
                  disabled={cargandoCatalogo}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Todos</option>
                  {puntosControl.map((punto) => (
                    <option key={punto.id} value={punto.id}>
                      {punto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                  Estado guía
                </label>
                <select
                  value={estadoId}
                  onChange={(e) => setEstadoId(e.target.value)}
                  disabled={cargandoCatalogo}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Todos</option>
                  {estadosGuia.map((estado) => (
                    <option key={estado.estado_id} value={estado.estado_id}>
                      {estado.estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={descargarReporte}
                  disabled={descargando}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-70"
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
          </div>
        </section>
      </div>
    </UserDashboardLayout>
  );
}
