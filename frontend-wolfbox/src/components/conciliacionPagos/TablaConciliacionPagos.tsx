import { useState } from "react";
import uploadIcon from "../../assets/upload-svgrepo-com.svg";
import printIcon from "../../assets/print2-svgrepo-com.svg";
import Swal from "sweetalert2";

interface SolicitudConciliacion {
  solicitud_id: number;
  fecha: string;
  codigo_referencia: string;
  nombre_cliente: string;
  totalUSD: number;
  totalCOP: number;
  trm: number;
  estado_paquete?: string | null;
  comprobante?: string;
}

interface Props {
  solicitudes: SolicitudConciliacion[];
  onSubirComprobante: (id: number, archivo: File) => void;
  onAutorizar: (id: number, estadoActual?: string) => void;
  onImprimir?: (solicitud: SolicitudConciliacion) => void;
}

export default function TablaConciliacionPagos({
  solicitudes,
  onSubirComprobante,
  onAutorizar,
  onImprimir,
}: Props) {
  const [files, setFiles] = useState<{ [key: number]: File | null }>({});
  const [openUploadId, setOpenUploadId] = useState<number | null>(null);

  const formatearCOP = (valor: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(valor || 0);
  };

  const formatearUSD = (valor: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-CO");
  };

  const descargarComprobante = async (solicitudId: number) => {
    try {
      const response = await fetch(`/api/conciliacion/comprobante/${solicitudId}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.mensaje || "No se pudo descargar el comprobante");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition") || "";
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      const fileName = match?.[1] || `comprobante-${solicitudId}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      Swal.fire("Error", error.message || "No se pudo descargar el comprobante", "error");
    }
  };

  const seleccionarArchivo = (
    solicitudId: number,
    file?: File
  ) => {
    if (!file) return;

    const tiposPermitidos = ["image/jpeg", "image/png", "application/pdf"];

    if (!tiposPermitidos.includes(file.type)) {
      Swal.fire("Archivo no valido", "Solo se permiten archivos JPG, PNG o PDF.", "warning");
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [solicitudId]: file,
    }));
  };




  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5" />
      <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-gray-900/5" />

      <div className="relative flex flex-col gap-3 border-b border-gray-200/70 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-red-950">
            Conciliación de pagos
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-700">
            Resultados de conciliación
          </h2>
        </div>

        <span className="w-fit rounded-full border border-red-900/15 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-950 shadow-sm">
          {solicitudes.length} registros
        </span>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gradient-to-r from-gray-100 via-white to-gray-50">
            <tr className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              <th className="px-5 py-4 text-left font-black">Solicitud</th>
              <th className="px-5 py-4 text-left font-black">Cliente</th>
              <th className="px-5 py-4 text-center font-black">Casillero</th>
              <th className="px-5 py-4 text-center font-black">USD</th>
              <th className="px-5 py-4 text-center font-black">COP</th>
              <th className="px-5 py-4 text-center font-black">TRM</th>
              <th className="px-5 py-4 text-center font-black">Fecha</th>
              <th className="px-5 py-4 text-center font-black">Comprobante</th>
              <th className="px-5 py-4 text-center font-black">Imprimir</th>
              <th className="px-5 py-4 text-center font-black">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {solicitudes.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-semibold text-red-950">
                      !
                    </div>
                    <p className="font-semibold text-gray-800">
                      No hay resultados para los filtros seleccionados
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-500">
                      Ajusta los filtros e intenta nuevamente.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              solicitudes.map((sol, index) => (
                <tr
                  key={`${sol.solicitud_id}-${index}`}
                  className="group bg-white transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/80 hover:via-white hover:to-transparent"
                >
                  <td className="px-5 py-4 align-middle">
                    <span className="inline-flex rounded-xl border border-red-900/10 bg-red-50 px-3 py-1.5 font-mono text-xs font-semibold text-red-950">
                      #{sol.solicitud_id}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <p className="max-w-[220px] truncate font-semibold text-gray-900">
                      {sol.nombre_cliente || "-"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <span className="inline-flex rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-xs font-semibold text-gray-700">
                      {sol.codigo_referencia || "-"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center align-middle font-mono text-xs font-semibold text-red-950">
                    {formatearUSD(sol.totalUSD)}
                  </td>

                  <td className="px-5 py-4 text-center align-middle font-mono text-xs font-semibold text-gray-900">
                    {formatearCOP(sol.totalCOP)}
                  </td>

                  <td className="px-5 py-4 text-center align-middle font-mono text-xs font-bold text-gray-600">
                    {sol.trm ? Number(sol.trm).toLocaleString("es-CO") : "-"}
                  </td>

                  <td className="px-5 py-4 text-center align-middle font-mono text-xs font-bold text-gray-600">
                    {formatearFecha(sol.fecha)}
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    {sol.comprobante ? (
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => descargarComprobante(sol.solicitud_id)}
                          className="rounded-xl bg-gradient-to-r from-green-700 to-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition hover:scale-105 hover:from-green-600 hover:to-green-500"
                        >
                          Ver comprobante
                        </button>

                        <button
                          onClick={() =>
                            setOpenUploadId(
                              openUploadId === sol.solicitud_id ? null : sol.solicitud_id
                            )
                          }
                          className="text-xs font-bold text-gray-500 transition hover:text-red-950"
                        >
                          Reemplazar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setOpenUploadId(
                            openUploadId === sol.solicitud_id ? null : sol.solicitud_id
                          )
                        }
                        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 shadow-md transition hover:scale-105 hover:from-red-950 hover:to-red-900"
                        title="Subir comprobante"
                      >
                        <img src={uploadIcon} className="h-4 w-4" />
                      </button>
                    )}

                    {openUploadId === sol.solicitud_id && (
                      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                          className="w-full text-xs font-semibold text-gray-600"
                          onChange={(e) =>
                            seleccionarArchivo(sol.solicitud_id, e.target.files?.[0])
                          }
                        />

                        <button
                          onClick={() => {
                            const file = files[sol.solicitud_id];

                            if (file) {
                              onSubirComprobante(sol.solicitud_id, file);

                              setFiles((prev) => ({
                                ...prev,
                                [sol.solicitud_id]: null,
                              }));

                              setOpenUploadId(null);
                            }
                          }}
                          className="mt-2 w-full rounded-lg bg-gradient-to-r from-green-700 to-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:from-green-600 hover:to-green-500"
                        >
                          {sol.comprobante ? "Reemplazar" : "Guardar"}
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <button
                      onClick={() => {
                        if (!sol.solicitud_id) {
                          console.error("Solicitud sin ID", sol);
                          Swal.fire("Error", "La solicitud no tiene ID válido", "error");
                          return;
                        }

                        if (onImprimir) onImprimir(sol);
                      }}
                      title="Imprimir solicitud"
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 text-white shadow-lg shadow-red-950/20 transition hover:scale-105 hover:from-red-900 hover:to-red-800"
                    >
                      <img src={printIcon} alt="Imprimir" className="h-5 w-5 opacity-90" />
                    </button>
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <button
                      onClick={() =>
                        onAutorizar(sol.solicitud_id, sol.estado_paquete ?? undefined)
                      }
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:scale-105 ${
                        sol.estado_paquete === "Autorizado"
                          ? "bg-gradient-to-r from-green-700 to-green-600 text-white"
                          : "bg-gradient-to-r from-gray-200 to-gray-100 text-gray-700 hover:from-red-50 hover:to-white hover:text-red-950"
                      }`}
                      title="Autorizar pago"
                    >
                      A
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
