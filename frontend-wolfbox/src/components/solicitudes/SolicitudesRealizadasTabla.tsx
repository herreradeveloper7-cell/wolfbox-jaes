import { Solicitud } from "../../types/solicitudes";
import type { ChangeEvent } from "react";
import Swal from "sweetalert2";
import iconTrash from "../../assets/trash-svgrepo-com.svg";
import iconEdit from "../../assets/pencil-edit-button-svgrepo-com.svg";
import iconOptions from "../../assets/detail-interface-list-svgrepo-com.svg";
import iconPrinter from "../../assets/printer-free-6-svgrepo-com.svg";
import { BadgeCheck, ReceiptText, UploadCloud } from "lucide-react";

interface Props {
  solicitudes: Solicitud[];
  onEliminar?: (solicitud: Solicitud) => void;
  onVerDetalle?: (solicitud: Solicitud) => void;
  onImprimir?: (solicitud: Solicitud) => void;
  onEditar?: (solicitud: Solicitud) => void;
  onSubirComprobante?: (solicitud: Solicitud, archivo: File) => Promise<void> | void;
  modoCliente?: boolean;
}

export default function SolicitudesRealizadasTabla({
  solicitudes,
  onEliminar,
  onVerDetalle,
  onImprimir,
  onEditar,
  onSubirComprobante,
  modoCliente = false,
}: Props) {
  const listaSegura = Array.isArray(solicitudes) ? solicitudes : [];
  const mostrarCargaComprobante = modoCliente && Boolean(onSubirComprobante);
  const totalColumnas = mostrarCargaComprobante ? 10 : 9;

  const solicitudesFiltradas = listaSegura.filter(
    (s) => (s.estado || "").trim().toLowerCase() !== "anulado"
  );


  const confirmarEliminacion = (solicitud: Solicitud) => {
    Swal.fire({
      title: "Eliminar solicitud?",
      text: `Se eliminara la solicitud N ${solicitud.id} y sus paquetes volveran a estar disponibles.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed && onEliminar) {
        onEliminar(solicitud);
      }
    });
  };

  const validarComprobante = (archivo: File) => {
    const nombre = archivo.name.toLowerCase();
    const extensionValida =
      nombre.endsWith(".pdf") || nombre.endsWith(".jpg") || nombre.endsWith(".jpeg");
    const tipoValido =
      archivo.type === "application/pdf" || archivo.type === "image/jpeg";
    const pesoMaximo = 8 * 1024 * 1024;

    if (!extensionValida || !tipoValido) {
      Swal.fire(
        "Archivo no valido",
        "Solo puedes cargar comprobantes en PDF, JPG o JPEG.",
        "warning"
      );
      return false;
    }

    if (archivo.size > pesoMaximo) {
      Swal.fire(
        "Archivo demasiado pesado",
        "El comprobante no puede superar 8 MB.",
        "warning"
      );
      return false;
    }

    return true;
  };

  const seleccionarComprobante = async (
    solicitud: Solicitud,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    const archivo = input.files?.[0];
    input.value = "";

    if (!archivo || !onSubirComprobante || !validarComprobante(archivo)) return;

    const tieneComprobante = Boolean(
      solicitud.comprobante_pago_url || solicitud.comprobante
    );

    if (tieneComprobante) {
      const result = await Swal.fire({
        title: "Reemplazar comprobante?",
        text: "Esta solicitud ya tiene un comprobante cargado.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#7f1d1d",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Si, reemplazar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) return;
    }

    await onSubirComprobante(solicitud, archivo);
  };

  const actionButton =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";
  const statusIconBase =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm transition";

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) return "-";

    return date
      .toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/\sde\s/g, " ");
  };

  const renderHawbs = (solicitud: Solicitud) => {
    const texto = solicitud.guia_agrupada
      ? solicitud.hawbs_agrupados
      : solicitud.hawbs_normales;

    if (!texto) return <span className="text-gray-400">-</span>;

    return texto.split("\n").map((hawb: string, index: number) => (
      <div key={index} className="border-b border-gray-100 py-0.5 last:border-none">
        {hawb}
      </div>
    ));
  };

  return (
    <section className="relative mt-8 w-full max-w-full overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />

      <div className="relative border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
              {modoCliente ? "Mis solicitudes" : "Historial operativo"}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
              Solicitudes realizadas
            </h3>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[980px] table-fixed border-collapse">
          <colgroup>
            <col className="w-[136px]" />
            <col className="w-[104px]" />
            <col className="w-[92px]" />
            {mostrarCargaComprobante && <col className="w-[138px]" />}
            <col className="w-[112px]" />
            <col className="w-[160px]" />
            <col className="w-[160px]" />
            <col className="w-[220px]" />
            <col className="w-[96px]" />
            <col className="w-[110px]" />
          </colgroup>
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-[11px] uppercase font-black tracking-[0.14em] text-gray-600">
            <tr>
              <th className="px-3 py-3 text-center">Opciones</th>
              <th className="px-3 py-3 text-left">Solicitud</th>
              <th className="px-3 py-3 text-center">Control</th>
              {mostrarCargaComprobante && (
                <th className="px-3 py-3 text-center">Comprobante</th>
              )}
              <th className="px-3 py-3 text-left">Fecha</th>
              <th className="px-3 py-3 text-left">Destinatario</th>
              <th className="px-3 py-3 text-left">Guia agrupada</th>
              <th className="px-3 py-3 text-left">HAWB agregados</th>
              <th className="px-3 py-3 text-center">Paquetes</th>
              <th className="px-3 py-3 text-center">Peso total</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((s) => {
                const tieneComprobante = Boolean(
                  s.comprobante_pago_url || s.comprobante
                );
                const estaAutorizada =
                  String(s.estado || "").trim().toLowerCase() === "autorizado";

                return (
                <tr key={s.id} className="transition-all duration-200 hover:bg-red-50/50">
                  <td className="px-3 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      {onEliminar && (
                        <button
                          onClick={() => confirmarEliminacion(s)}
                          title="Eliminar solicitud"
                          className={`${actionButton} hover:border-red-200 hover:bg-red-50`}
                        >
                          <img src={iconTrash} alt="Eliminar" className="h-3.5 w-3.5 opacity-80" />
                        </button>
                      )}

                      {onVerDetalle && (
                        <button
                          onClick={() => onVerDetalle(s)}
                          title="Ver detalle"
                          className={`${actionButton} hover:border-slate-300 hover:bg-slate-50`}
                        >
                          <img src={iconOptions} alt="Ver detalle" className="h-3.5 w-3.5 opacity-80" />
                        </button>
                      )}

                      {onImprimir && (
                        <button
                          onClick={() => {
                            if (!s.id) {
                              console.error("La solicitud no tiene ID. El PDF no puede generarse.", s);
                              Swal.fire("Error", "La solicitud no tiene ID valido", "error");
                              return;
                            }

                            onImprimir(s);
                          }}
                          title="Imprimir preliquidacion"
                          className={`${actionButton} hover:border-blue-200 hover:bg-blue-50`}
                        >
                          <img src={iconPrinter} alt="Imprimir" className="h-3.5 w-3.5 opacity-80" />
                        </button>
                      )}

                      {onEditar && (
                        <button
                          onClick={() => onEditar(s)}
                          title="Editar solicitud"
                          className={`${actionButton} hover:border-amber-200 hover:bg-amber-50`}
                        >
                          <img src={iconEdit} alt="Editar" className="h-3.5 w-3.5 opacity-80" />
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3 font-mono text-sm font-black text-red-950">
                    #{s.id}
                  </td>

                  <td className="px-3 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        title={
                          tieneComprobante
                            ? "Comprobante de pago cargado"
                            : "Sin comprobante de pago"
                        }
                        className={`${statusIconBase} ${
                          tieneComprobante
                            ? "border-green-900/20 bg-green-50 text-green-900"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        <ReceiptText size={16} strokeWidth={2.4} />
                      </span>

                      <span
                        title={
                          estaAutorizada
                            ? "Solicitud autorizada"
                            : "Solicitud sin autorizar"
                        }
                        className={`${statusIconBase} ${
                          estaAutorizada
                            ? "border-green-900/20 bg-green-50 text-green-900"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        <BadgeCheck size={16} strokeWidth={2.4} />
                      </span>
                    </div>
                  </td>

                  {mostrarCargaComprobante && (
                    <td className="px-3 py-3 text-center align-middle">
                      <label
                        title={
                          tieneComprobante
                            ? "Reemplazar comprobante de pago"
                            : "Subir comprobante de pago"
                        }
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-900/10 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-950 shadow-sm transition hover:-translate-y-0.5 hover:border-red-900/20 hover:bg-red-50 hover:shadow-md"
                      >
                        <UploadCloud size={15} strokeWidth={2.5} />
                        <span>{tieneComprobante ? "Reemplazar" : "Subir"}</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                          className="sr-only"
                          onChange={(event) => seleccionarComprobante(s, event)}
                        />
                      </label>
                    </td>
                  )}

                  <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold text-gray-700">
                    {formatearFecha(s.fecha)}
                  </td>

                  <td className="px-3 py-3 text-sm font-semibold text-gray-700">
                    <span className="block truncate" title={s.destinatario_nombre || "-"}>
                      {s.destinatario_nombre || "-"}
                    </span>
                  </td>

                  <td className="px-3 py-3 font-semibold text-gray-700">
                    {s.guia_agrupada ? (
                      <span className="inline-flex max-w-full rounded-full border border-red-900/10 bg-red-50 px-2.5 py-1 font-mono text-[11px] font-black text-red-950">
                        <span className="truncate">{s.guia_agrupada}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="px-3 py-3 text-xs leading-relaxed text-gray-700">
                    <div className="max-h-20 overflow-y-auto rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2 font-mono">
                      {renderHawbs(s)}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center text-gray-700">
                    <span className="inline-flex min-w-9 justify-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-black">
                      {s.cantidadPaquetes ?? 0}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 text-center text-sm font-semibold text-gray-700">
                    {Number(s.pesoTotal || 0).toFixed(2)}
                  </td>
                </tr>
              );
              })
            ) : (
              <tr>
                <td colSpan={totalColumnas} className="py-12 text-center text-gray-500">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl font-black text-red-950">
                      !
                    </div>
                    <p className="font-semibold">No hay solicitudes registradas</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
