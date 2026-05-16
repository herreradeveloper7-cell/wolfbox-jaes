import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import * as XLSX from "xlsx";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";
import ModalEditarDespacho from "../../components/despachos/ModalEditarDespacho";
import {
  Ban,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FilePlus2,
  Pencil,
  Power,
  PowerOff,
  RefreshCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";

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

type Oficina = {
  id: number;
  nombre: string;
};

type Transportadora = {
  id: number;
  oficina_id: number;
  nombre: string;
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

const limpiarNombreArchivo = (valor: string) =>
  valor.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "_");

const obtenerMensajeError = (error: any, fallback: string) =>
  error?.response?.data?.mensaje ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export default function CrearDespachos() {
  const navigate = useNavigate();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [oficinaId, setOficinaId] = useState("");
  const [oficina, setOficina] = useState("");
  const [transportadoraId, setTransportadoraId] = useState("");
  const [activo, setActivo] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [despachoEditar, setDespachoEditar] = useState<Despacho | null>(null);
  const [oficinasCatalogo, setOficinasCatalogo] = useState<Oficina[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [loadingTransportadoras, setLoadingTransportadoras] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "{}");
    } catch {
      return {};
    }
  }, []);

  const usuarioActual = usuario?.nombre || usuario?.email || "Usuario del sistema";

  const fechaDespacho = useMemo(() => {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const hh = String(fecha.getHours()).padStart(2, "0");
    const min = String(fecha.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }, []);

  const resumen = useMemo(() => {
    const abiertos = despachos.filter(
      (d) => d.estado?.toLowerCase() === "abierto"
    ).length;
    const cerrados = despachos.filter(
      (d) => d.estado?.toLowerCase() === "cerrado"
    ).length;
    const hawbs = despachos.reduce(
      (total, d) => total + Number(d.cantidad_hawbs || 0),
      0
    );

    return { abiertos, cerrados, hawbs };
  }, [despachos]);

  const cargarDespachos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/despachos");
      setDespachos(Array.isArray(data.despachos) ? data.despachos : []);
    } catch (error) {
      console.error("Error cargando despachos:", error);
      Swal.fire("Error", "No se pudieron cargar los despachos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const { data } = await axios.get("/api/oficinas");
      setOficinasCatalogo(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando catalogos de despacho:", error);
      Swal.fire("Error", "No se pudieron cargar los catalogos", "error");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    cargarDespachos();
    cargarCatalogos();
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setObservaciones("");
    setOficinaId("");
    setOficina("");
    setTransportadoraId("");
    setTransportadoras([]);
    setActivo(true);
  };

  const cargarTransportadoras = async (nextOficinaId: string) => {
    if (!nextOficinaId) {
      setTransportadoras([]);
      return;
    }

    setLoadingTransportadoras(true);
    try {
      const { data } = await axios.get(
        `/api/transportadoras?oficina_id=${nextOficinaId}`
      );
      setTransportadoras(
        Array.isArray(data.transportadoras) ? data.transportadoras : []
      );
    } catch (error) {
      console.error("Error cargando transportadoras:", error);
      setTransportadoras([]);
      Swal.fire("Error", "No se pudieron cargar las transportadoras", "error");
    } finally {
      setLoadingTransportadoras(false);
    }
  };

  const seleccionarOficina = (nextOficinaId: string) => {
    const oficinaSeleccionada = oficinasCatalogo.find(
      (item) => String(item.id) === nextOficinaId
    );

    setOficinaId(nextOficinaId);
    setOficina(oficinaSeleccionada?.nombre || "");
    setTransportadoraId("");
    cargarTransportadoras(nextOficinaId);
  };

  const crearDespacho = async () => {
    if (!nombre.trim() || !oficinaId || !transportadoraId) {
      Swal.fire("Aviso", "Completa los campos requeridos del despacho", "warning");
      return;
    }

    setGuardando(true);
    try {
      const { data } = await axios.post("/api/despachos", {
        nombre: nombre.trim(),
        observaciones,
        oficina_id: Number(oficinaId),
        oficina,
        transportadora_id: Number(transportadoraId),
        fecha: fechaDespacho,
        responsable: usuarioActual,
      });

      if (!activo && data.despacho?.id) {
        await axios.patch(`/api/despachos/${data.despacho.id}/estado`, {
          estado: "cerrado",
        });
      }

      limpiarFormulario();
      setMostrarFormulario(false);
      await cargarDespachos();
      Swal.fire("Listo", "Despacho creado correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo crear el despacho",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalEditar = (despacho: Despacho) => {
    const cerrado = despacho.estado?.toLowerCase() === "cerrado";

    if (cerrado) {
      Swal.fire("Aviso", "No puedes editar un despacho cerrado", "warning");
      return;
    }

    setDespachoEditar(despacho);
  };

  const cambiarEstadoDespacho = async (despacho: Despacho) => {
    const cerrado = despacho.estado?.toLowerCase() === "cerrado";
    const nuevoEstado = cerrado ? "abierto" : "cerrado";

    const confirmacion = await Swal.fire({
      title: cerrado ? "Abrir despacho" : "Cerrar despacho",
      text: cerrado
        ? "El despacho volvera a quedar activo."
        : "Al cerrarlo no se podra editar, eliminar ni agregar HAWB.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: cerrado ? "Abrir" : "Cerrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#5B000D",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.patch(`/api/despachos/${despacho.id}/estado`, {
        estado: nuevoEstado,
      });
      await cargarDespachos();
      Swal.fire("Listo", `Despacho ${nuevoEstado} correctamente`, "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo cambiar el estado",
        "error"
      );
    }
  };

  const eliminarDespacho = async (despacho: Despacho) => {
    const cerrado = despacho.estado?.toLowerCase() === "cerrado";

    if (cerrado) {
      Swal.fire("Aviso", "No puedes eliminar un despacho cerrado", "warning");
      return;
    }

    const confirmacion = await Swal.fire({
      title: "Eliminar despacho",
      text: `Se eliminara ${despacho.codigo}. Solo se permite si no tiene HAWB asociados.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#991b1b",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.delete(`/api/despachos/${despacho.id}`);
      await cargarDespachos();
      Swal.fire("Listo", "Despacho eliminado correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo eliminar el despacho",
        "error"
      );
    }
  };

  const cargarDetalleDespacho = async (despacho: Despacho) => {
    const { data } = await axios.get(`/api/despachos/${despacho.id}`);

    return {
      despacho: data.despacho,
      paquetes: Array.isArray(data.paquetes) ? data.paquetes : [],
    } as DetalleDespacho;
  };

  const descargarExcelDespacho = async (despacho: Despacho) => {
    const cerrado = despacho.estado?.toLowerCase() === "cerrado";
    if (!cerrado) return;

    try {
      const detalle = await cargarDetalleDespacho(despacho);
      const totalPesoLb = detalle.paquetes.reduce(
        (total, paquete) => total + Number(paquete.peso || 0),
        0
      );
      const resumenRows = [
        ["Campo", "Valor"],
        ["Codigo", detalle.despacho.codigo || "-"],
        ["Descripcion", detalle.despacho.nombre || "-"],
        ["Transportadora", detalle.despacho.transportadora_nombre || "-"],
        ["Oficina", detalle.despacho.oficina || "-"],
        ["Estado", detalle.despacho.estado || "-"],
        ["Creado por", detalle.despacho.creado_por || "-"],
        ["Fecha creacion", detalle.despacho.fecha_creacion || "-"],
        ["Fecha cierre", detalle.despacho.fecha_cierre || "-"],
        ["Total HAWB", detalle.paquetes.length],
        ["Peso total lbs", Number(totalPesoLb.toFixed(2))],
        ["Peso total kgs", Number((totalPesoLb * KG_POR_LIBRA).toFixed(2))],
        ["Observaciones", detalle.despacho.observaciones || "-"],
      ];
      const hawbRows = detalle.paquetes.map((paquete) => {
        const pesoLb = Number(paquete.peso || 0);

        return {
          HAWB: paquete.hawb || "-",
          Tracking: paquete.tracking || "-",
          Cliente: paquete.cliente || "-",
          Casillero: paquete.codigo_referencia || "-",
          Contenido: paquete.contenido || "-",
          Tienda: paquete.tienda || "-",
          "Peso lbs": Number(pesoLb.toFixed(2)),
          "Peso kgs": Number((pesoLb * KG_POR_LIBRA).toFixed(2)),
          Estado: paquete.estado_actual || "-",
          "Fecha agregado": paquete.fecha_agregado || "-",
          "Agregado por": paquete.agregado_por || "-",
        };
      });
      const workbook = XLSX.utils.book_new();
      const resumenSheet = XLSX.utils.aoa_to_sheet(resumenRows);
      const hawbSheet = XLSX.utils.json_to_sheet(hawbRows);

      resumenSheet["!cols"] = [{ wch: 22 }, { wch: 48 }];
      hawbSheet["!cols"] = [
        { wch: 18 },
        { wch: 28 },
        { wch: 32 },
        { wch: 16 },
        { wch: 45 },
        { wch: 24 },
        { wch: 12 },
        { wch: 12 },
        { wch: 28 },
        { wch: 20 },
        { wch: 24 },
      ];

      XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");
      XLSX.utils.book_append_sheet(workbook, hawbSheet, "HAWB");
      XLSX.writeFile(
        workbook,
        `Despacho_${limpiarNombreArchivo(detalle.despacho.codigo)}.xlsx`
      );
    } catch (error: any) {
      console.error("Error generando Excel de despacho:", error);
      Swal.fire(
        "Error",
        obtenerMensajeError(error, "No se pudo generar el Excel"),
        "error"
      );
    }
  };

  const descargarManifiestoPdf = async (despacho: Despacho) => {
    const cerrado = despacho.estado?.toLowerCase() === "cerrado";
    if (!cerrado) return;

    try {
      const detalle = await cargarDetalleDespacho(despacho);
      const doc = new jsPDF("l", "mm", "a4");
      const pesoLb = detalle.paquetes.reduce(
        (total, paquete) => total + Number(paquete.peso || 0),
        0
      );

      doc.setFillColor(91, 0, 13);
      doc.rect(0, 0, 297, 26, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("MANIFIESTO DE ENTREGA A TRANSPORTADORA", 14, 11);
      doc.setFontSize(10);
      doc.text(`Despacho: ${detalle.despacho.codigo}`, 14, 19);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Descripcion:", 14, 35);
      doc.text("Transportadora:", 14, 42);
      doc.text("Oficina:", 14, 49);
      doc.text("Fecha cierre:", 160, 35);
      doc.text("Total HAWB:", 160, 42);
      doc.text("Peso total:", 160, 49);

      doc.setFont("helvetica", "normal");
      doc.text(detalle.despacho.nombre || "-", 40, 35);
      doc.text(detalle.despacho.transportadora_nombre || "-", 43, 42);
      doc.text(detalle.despacho.oficina || "-", 30, 49);
      doc.text(detalle.despacho.fecha_cierre || detalle.despacho.fecha_creacion || "-", 188, 35);
      doc.text(String(detalle.paquetes.length), 184, 42);
      doc.text(`${pesoLb.toFixed(2)} lbs / ${(pesoLb * KG_POR_LIBRA).toFixed(2)} kgs`, 184, 49);

      autoTable(doc, {
        startY: 58,
        head: [[
          "HAWB",
          "Tracking",
          "Cliente",
          "Casillero",
          "Contenido",
          "Tienda",
          "Peso lbs",
          "Estado",
        ]],
        body: detalle.paquetes.map((paquete) => [
          paquete.hawb || "-",
          paquete.tracking || "-",
          paquete.cliente || "-",
          paquete.codigo_referencia || "-",
          paquete.contenido || "-",
          paquete.tienda || "-",
          Number(paquete.peso || 0).toFixed(2),
          paquete.estado_actual || "-",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [91, 0, 13],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 36 },
          2: { cellWidth: 38 },
          3: { cellWidth: 24 },
          4: { cellWidth: 52 },
          5: { cellWidth: 30 },
          6: { cellWidth: 20, halign: "right" },
          7: { cellWidth: 42 },
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 170;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Entrega transportadora", 24, finalY + 22);
      doc.text("Responsable WolfBox", 115, finalY + 22);
      doc.text("Fecha y hora", 210, finalY + 22);
      doc.line(18, finalY + 17, 82, finalY + 17);
      doc.line(108, finalY + 17, 172, finalY + 17);
      doc.line(202, finalY + 17, 266, finalY + 17);

      doc.save(`Manifiesto_${limpiarNombreArchivo(detalle.despacho.codigo)}.pdf`);
    } catch (error: any) {
      console.error("Error generando manifiesto de despacho:", error);
      Swal.fire(
        "Error",
        obtenerMensajeError(error, "No se pudo generar el manifiesto"),
        "error"
      );
    }
  };

  return (
    <UserDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden text-gray-600 px-6 lg:px-10 pb-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Crear Despachos</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Crear Despachos
        </p>

        <section className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_22px_55px_rgba(17,24,39,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-red-950/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-slate-900/5" />

          <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                Control de planillas
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                Crear nuevo despacho operativo
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                Administra los despachos creados desde una tabla centralizada.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-700">
                  Abiertos
                </p>
                <p className="mt-1 text-2xl font-black text-green-800">
                  {resumen.abiertos}
                </p>
              </div>
              <div className="rounded-xl border border-red-900/10 bg-red-50 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-950">
                  Cerrados
                </p>
                <p className="mt-1 text-2xl font-black text-red-950">
                  {resumen.cerrados}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                  HAWB
                </p>
                <p className="mt-1 text-2xl font-black text-gray-600">
                  {resumen.hawbs}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setMostrarFormulario((prev) => !prev)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800"
            >
              {mostrarFormulario ? (
                <>
                  <X className="h-4 w-4" />
                  Ocultar formulario
                </>
              ) : (
                <>
                  <FilePlus2 className="h-4 w-4" />
                  Crear despacho
                </>
              )}
            </button>
          </div>

          {mostrarFormulario && (
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-red-700 to-slate-300" />
              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full border border-red-950/10" />
              <div className="relative border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                      Nueva planilla
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-gray-600">
                      Datos operativos del despacho
                    </h3>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    * Campos requeridos
                  </span>
                </div>
              </div>

              <div className="relative grid gap-4 p-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Descripcion *
                  </label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                    placeholder="Ej: Despacho operativo del dia"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Fecha
                  </label>
                  <input
                    value={fechaDespacho}
                    readOnly
                    className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-green-700">
                    Usuario *
                  </label>
                  <input
                    value={usuarioActual}
                    readOnly
                    className="w-full rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-gray-700 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Oficina *
                  </label>
                  <select
                    value={oficinaId}
                    onChange={(e) => seleccionarOficina(e.target.value)}
                    disabled={loadingCatalogos}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {loadingCatalogos ? "Cargando..." : "Seleccionar oficina"}
                    </option>
                    {oficinasCatalogo.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Transportadora *
                  </label>
                  <select
                    value={transportadoraId}
                    onChange={(e) => setTransportadoraId(e.target.value)}
                    disabled={!oficinaId || loadingTransportadoras}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {loadingTransportadoras
                        ? "Cargando..."
                        : oficinaId
                          ? "Seleccionar transportadora"
                          : "Selecciona una oficina"}
                    </option>
                    {transportadoras.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Estado del despacho
                  </label>
                  <label className="flex h-[46px] cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-slate-50/80 px-4">
                    <span className={`text-sm font-black ${activo ? "text-green-700" : "text-gray-500"}`}>
                      {activo ? "Activo" : "Inactivo"}
                    </span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="relative h-8 w-16 rounded-full bg-gray-400 shadow-inner transition peer-checked:bg-green-500">
                      <span
                        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                          activo ? "translate-x-8" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </label>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                    placeholder="Notas internas del despacho"
                  />
                </div>
              </div>

              <div className="relative flex flex-col gap-2 border-t border-gray-200 bg-gradient-to-r from-slate-50 via-white to-red-50/30 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    limpiarFormulario();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-black text-gray-600 shadow-sm transition hover:border-gray-300"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  onClick={crearDespacho}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  <Save className="h-4 w-4" />
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
          <div className="flex flex-col gap-3 border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                Despachos
              </p>
              <h3 className="mt-1 text-lg font-semibold text-gray-800">
                Planillas creadas
              </h3>
            </div>
            <button
              onClick={cargarDespachos}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm transition hover:border-red-900/30 hover:text-red-950"
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </button>
          </div>

          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-xs font-black uppercase tracking-[0.14em] text-gray-600">
                <tr>
                  <th className="px-4 py-4 text-left">Opciones</th>
                  <th className="px-4 py-4 text-center">ID</th>
                  <th className="px-4 py-4 text-left">Fecha</th>
                  <th className="px-4 py-4 text-left">Descripcion</th>
                  <th className="px-4 py-4 text-left">Usuario</th>
                  <th className="px-4 py-4 text-left">Transportadora</th>
                  <th className="px-4 py-4 text-center">HAWB</th>
                  <th className="px-4 py-4 text-center">Peso (lbs)</th>
                  <th className="px-4 py-4 text-center">Peso (kgs)</th>
                  <th className="px-4 py-4 text-center">Activo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-red-900 border-t-transparent" />
                    </td>
                  </tr>
                ) : despachos.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <p className="font-semibold text-gray-500">
                        Aun no hay despachos creados.
                      </p>
                    </td>
                  </tr>
                ) : (
                  despachos.map((despacho) => {
                    const cerrado = despacho.estado?.toLowerCase() === "cerrado";
                    const pesoLb = Number(despacho.peso_total || 0);
                    const pesoKg = pesoLb * KG_POR_LIBRA;

                    return (
                      <tr
                        key={despacho.id}
                        className="text-sm transition hover:bg-red-50/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => abrirModalEditar(despacho)}
                              disabled={cerrado}
                              title="Editar despacho"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-black text-white shadow-sm transition hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => cambiarEstadoDespacho(despacho)}
                              title={cerrado ? "Abrir despacho" : "Cerrar despacho"}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white shadow-sm transition ${
                                cerrado ? "bg-green-600 hover:bg-green-700" : "bg-slate-600 hover:bg-slate-700"
                              }`}
                            >
                              {cerrado ? (
                                <Power className="h-4 w-4" />
                              ) : (
                                <PowerOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => eliminarDespacho(despacho)}
                              disabled={cerrado}
                              title="Eliminar despacho"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-900 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => descargarExcelDespacho(despacho)}
                              disabled={!cerrado}
                              title={cerrado ? "Descargar Excel" : "Disponible al cerrar el despacho"}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => descargarManifiestoPdf(despacho)}
                              disabled={!cerrado}
                              title={cerrado ? "Descargar manifiesto PDF" : "Disponible al cerrar el despacho"}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-black text-red-950">
                          {despacho.id}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-600">
                          {despacho.fecha_creacion || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-black text-gray-600">
                            {despacho.nombre || despacho.codigo}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs font-semibold text-gray-400">
                            {despacho.observaciones || despacho.codigo}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-600">
                          {despacho.creado_por || "-"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-600">
                          {despacho.transportadora_nombre || "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-gray-700">
                          {despacho.cantidad_hawbs || 0}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">
                          {pesoLb.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700">
                          {pesoKg.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => cambiarEstadoDespacho(despacho)}
                            className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${
                              cerrado
                                ? "border-red-500 bg-white text-red-500"
                                : "border-green-600 bg-green-500 text-white shadow-[0_0_0_4px_rgba(34,197,94,0.12)]"
                            }`}
                            title={cerrado ? "Inactivo" : "Activo"}
                          >
                            {cerrado ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {despachoEditar && (
          <ModalEditarDespacho
            despacho={despachoEditar}
            oficinasCatalogo={oficinasCatalogo}
            onClose={() => setDespachoEditar(null)}
            onUpdated={cargarDespachos}
          />
        )}
      </div>
    </UserDashboardLayout>
  );
}
