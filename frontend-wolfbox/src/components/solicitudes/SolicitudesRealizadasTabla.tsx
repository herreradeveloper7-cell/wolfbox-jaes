import { Solicitud } from "../../types/solicitudes";
import Swal from "sweetalert2";
import iconTrash from "../../assets/trash-svgrepo-com.svg";
import iconEdit from "../../assets/pencil-edit-button-svgrepo-com.svg";
import iconOptions from "../../assets/detail-interface-list-svgrepo-com.svg";
import iconPrinter from "../../assets/printer-free-6-svgrepo-com.svg";

interface Props {
  solicitudes: Solicitud[];
  onEliminar?: (solicitud: Solicitud) => void;
  onVerDetalle?: (solicitud: Solicitud) => void;
  onImprimir?: (solicitud: Solicitud) => void;
  onEditar?: (solicitud: Solicitud) => void;
}

export default function SolicitudesRealizadasTabla({
  solicitudes,
  onEliminar,
  onVerDetalle,
  onImprimir,
  onEditar,
}: Props) {
  const listaSegura = Array.isArray(solicitudes) ? solicitudes : [];

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

  const actionButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

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
              Historial operativo
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
              Solicitudes realizadas
            </h3>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-xs uppercase font-black tracking-[0.16em] text-gray-600">
            <tr>
              <th className="px-4 py-3 text-center">Opciones</th>
              <th className="px-4 py-3 text-left"># Solicitud</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Destinatario</th>
              <th className="px-4 py-3 text-left">Guia agrupada</th>
              <th className="px-4 py-3 text-left">HAWB agregados</th>
              <th className="px-4 py-3 text-center">Paquetes</th>
              <th className="px-4 py-3 text-center">Peso Total (lb)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((s) => (
                <tr key={s.id} className="transition-all duration-200 hover:bg-red-50/50">
                  <td className="px-4 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => confirmarEliminacion(s)}
                        title="Eliminar solicitud"
                        className={`${actionButton} hover:border-red-200 hover:bg-red-50`}
                      >
                        <img src={iconTrash} alt="Eliminar" className="h-4 w-4 opacity-80" />
                      </button>

                      <button
                        onClick={() => onVerDetalle && onVerDetalle(s)}
                        title="Ver detalle"
                        className={`${actionButton} hover:border-slate-300 hover:bg-slate-50`}
                      >
                        <img src={iconOptions} alt="Ver detalle" className="h-4 w-4 opacity-80" />
                      </button>

                      <button
                        onClick={() => {
                          if (!s.id) {
                            console.error("La solicitud no tiene ID. El PDF no puede generarse.", s);
                            Swal.fire("Error", "La solicitud no tiene ID valido", "error");
                            return;
                          }

                          if (onImprimir) onImprimir(s);
                        }}
                        title="Imprimir preliquidacion"
                        className={`${actionButton} hover:border-blue-200 hover:bg-blue-50`}
                      >
                        <img src={iconPrinter} alt="Imprimir" className="h-4 w-4 opacity-80" />
                      </button>

                      <button
                        onClick={() => onEditar && onEditar(s)}
                        title="Editar solicitud"
                        className={`${actionButton} hover:border-amber-200 hover:bg-amber-50`}
                      >
                        <img src={iconEdit} alt="Editar" className="h-4 w-4 opacity-80" />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono font-black text-red-950">
                    #{s.id}
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-700">
                    {new Date(s.fecha).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-700">
                    {s.destinatario_nombre || "-"}
                  </td>

                  <td className="px-4 py-3 font-semibold text-gray-700">
                    {s.guia_agrupada ? (
                      <span className="rounded-full border border-red-900/10 bg-red-50 px-3 py-1 font-mono text-xs font-black text-red-950">
                        {s.guia_agrupada}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs leading-relaxed text-gray-700">
                    <div className="max-h-28 min-w-[190px] overflow-y-auto rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
                      {renderHawbs(s)}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center text-gray-700">
                    <span className="inline-flex min-w-10 justify-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-black">
                      {s.cantidadPaquetes ?? 0}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center font-semibold text-gray-700">
                    {Number(s.pesoTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
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
