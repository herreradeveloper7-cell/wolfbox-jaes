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
      title: "¿Eliminar solicitud?",
      text: `Se eliminará la solicitud N° ${solicitud.id} y sus paquetes volverán a estar disponibles.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed && onEliminar) {
        onEliminar(solicitud);
      }
    });
  };

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="inline-block w-2 h-6 bg-red-800 rounded-full"></span>
        Solicitudes Realizadas
      </h3>

      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 bg-white">
        <table className="min-w-full border-collapse">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm uppercase font-semibold tracking-wide">
            <tr>
              <th className="px-4 py-3 text-center">Opciones</th>
              <th className="py-3 px-4 text-left"># Solicitud</th>
              <th className="py-3 px-4 text-left">Fecha</th>
              <th className="py-3 px-4 text-left">Destinatario</th>
              <th className="py-3 px-4 text-left">Guía agrupada</th>
              <th className="py-3 px-4 text-left">HAWB agregados</th>
              <th className="py-3 px-4 text-center">Paquetes</th>
              <th className="py-3 px-4 text-center">Peso Total (lb)</th>
            </tr>
          </thead>

          <tbody>
            {solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((s) => (
                
                <tr
                  key={s.id}
                  className="border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
                >
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => confirmarEliminacion(s)}
                        title="Eliminar Solicitud"
                        className="hover:scale-110 transition-transform duration-150"
                      >
                        <img
                          src={iconTrash}
                          alt="Eliminar"
                          className="w-5 h-5 opacity-80 hover:opacity-100"
                        />
                      </button>

                      <button
                        onClick={() => onVerDetalle && onVerDetalle(s)}
                        title="Ver Detalle"
                        className="hover:scale-110 transition-transform duration-150"
                      >
                        <img
                          src={iconOptions}
                          alt="Ver Detalle"
                          className="w-5 h-5 opacity-80 hover:opacity-100"
                        />
                      </button>

                      <button
                        onClick={() => {
                          if (!s.id) {
                            console.error("❌ La solicitud NO tiene ID. El PDF no puede generarse.", s);
                            Swal.fire("Error", "La solicitud no tiene ID válido", "error");
                            return;
                          }

                          if (onImprimir) onImprimir(s);
                        }}
                        title="Imprimir Preliquidación"
                        className="hover:scale-110 transition-transform duration-150"
                      >
                        <img
                          src={iconPrinter}
                          alt="Imprimir"
                          className="w-5 h-5 opacity-80 hover:opacity-100"
                        />
                      </button>


                      <button
                        onClick={() => onEditar && onEditar(s)}
                        title="Editar Solicitud"
                        className="hover:scale-110 transition-transform duration-150"
                      >
                        <img
                          src={iconEdit}
                          alt="Editar"
                          className="w-5 h-5 opacity-80 hover:opacity-100"
                        />
                      </button>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-medium text-gray-800">
                    {s.id}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {new Date(s.fecha).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3 text-gray-700">
                    {s.destinatario_nombre || "—"}
                  </td>

                  <td className="px-4 py-3 text-gray-700 font-semibold">
                    {s.guia_agrupada ? (
                      <span className="text-red-800">{s.guia_agrupada}</span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-4 py-3 text-gray-700 whitespace-pre-line text-xs leading-relaxed">
                    {s.guia_agrupada ? (
                      s.hawbs_agrupados ? (
                        s.hawbs_agrupados.split("\n").map((h: string, i: number) => (
                          <div
                            key={i}
                            className="border-b border-gray-100 last:border-none py-0.5"
                          >
                            {h}
                          </div>
                        ))
                      ) : (
                        "—"
                      )
                    ) : s.hawbs_normales ? (
                      s.hawbs_normales.split("\n").map((h: string, i: number) => (
                        <div
                          key={i}
                          className="border-b border-gray-100 last:border-none py-0.5"
                        >
                          {h}
                        </div>
                      ))
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-4 py-3 text-center text-gray-700">
                    {s.cantidadPaquetes ?? 0}
                  </td>

                  <td className="px-4 py-3 text-center text-gray-700">
                    {Number(s.pesoTotal || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-gray-500 italic"
                >
                  No hay solicitudes registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
