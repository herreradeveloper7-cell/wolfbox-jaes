import iconPrint from "../../assets/printer-free-6-svgrepo-com.svg";
import iconEdit from "../../assets/pencil-edit-button-svgrepo-com.svg";
import iconCancel from "../../assets/cancel-svgrepo-com (1).svg";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";


export interface Paquete {
  id?: string;
  tracking: string;
  hawb: string;
  referencia: string;
  fecha_registro: string;
  estado: string;
  estado_id: number;
  oficina: string;
  cliente: string;
  codigo_referencia: string;
  tienda: string;
  contenido: string;
  peso: string;
  notas: string;
  usuario: string;
  servicio?: string;
  destinatario_nombre?: string;
  destinatario_direccion?: string;
  destinatario_ciudad?: string;
  destinatario_telefono?: string;
}

interface Props {
  paquetes?: Paquete[];              
  onEditar?: (paquete: Paquete) => void; 
}

export default function TablaPaquetesDigitados({
  paquetes = [],       
  onEditar,
}: Props) {

  const data = Array.isArray(paquetes) ? paquetes : [];

  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  useEffect(() => {
    setPaginaActual(1);
  }, [paquetes]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(data.length / registrosPorPagina)
  );

  const paquetesAMostrar = data.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );


  const imprimirEtiqueta = (paquete: Paquete) => {
    window.open(`/api/paquetes/pdf/${paquete.hawb}`, "_blank");
  };

  const anularGuia = async (paquete: Paquete) => {
    const estadoTexto = (paquete.estado || "").trim().toLowerCase();
    const estadoId = Number(paquete.estado_id);

    // 1. Si ya está anulado
    if (estadoTexto === "anulado") {
      await Swal.fire({
        icon: "info",
        title: "Guía ya anulada",
        text: `La guía ${paquete.hawb} ya se encuentra en estado anulado.`,
        confirmButtonColor: "#991b1b",
      });
      return;
    }

    // 2. Solo permitir si estado_id es 5 o 22
    if (![5, 22].includes(estadoId)) {
      await Swal.fire({
        icon: "warning",
        title: "No se puede anular",
        text: `Solo se pueden anular guías con estado_id 5 o 22. Estado actual: ${paquete.estado} (${estadoId}).`,
        confirmButtonColor: "#991b1b",
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "¿Anular guía?",
      text: `¿Deseas anular la guía ${paquete.hawb}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      const usuarioGuardado = localStorage.getItem("usuario");
      const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      const response = await fetch(`/api/paquetes/anular/${paquete.hawb}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responsable: usuario?.nombre || "Usuario del sistema",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        await Swal.fire({
          icon: "error",
          title: "No se pudo anular",
          text: data.mensaje || "Ocurrió un error al anular la guía.",
          confirmButtonColor: "#991b1b",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Guía anulada",
        text: data.mensaje || "La guía fue anulada correctamente.",
        confirmButtonColor: "#991b1b",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error al anular guía:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error inesperado al anular la guía.",
        confirmButtonColor: "#991b1b",
      });
    }
  };

  const cambiarPagina = (nueva: number) => {
  if (nueva < 1 || nueva > totalPaginas) return;
  setPaginaActual(nueva);
  };

  const generarPaginas = () => {
    const max = 5;
    const mitad = Math.floor(max / 2);

    let inicio = Math.max(1, paginaActual - mitad);
    let fin = Math.min(totalPaginas, inicio + max - 1);

    inicio = Math.max(1, fin - max + 1);

    const paginas: number[] = [];
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  };

  const puedeAnular = (p: Paquete) => {
    const estadoTexto = (p.estado || "").trim().toLowerCase();
    const estadoId = Number(p.estado_id);

    if (estadoTexto === "anulado") return false;
    return [5, 22].includes(estadoId);
  };

  const formatearFechaRegistro = (fecha?: string) => {
    if (!fecha) return "—";
    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return "—";
    const yyyy = fechaObj.getFullYear();
    const mm = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const dd = String(fechaObj.getDate()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
  };




  return (
  <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mt-6 mb-10 overflow-hidden">

    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

    <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
      <div>
        <h2 className="text-xl font-bold text-gray-600 tracking-wide">
          PAQUETES DIGITADOS
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Listado de paquetes registrados en el sistema
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
        <span className="w-2 h-2 rounded-full bg-green-600"></span>
        <span className="text-xs font-semibold text-gray-600">
          Total: <span className="text-gray-800">{data.length}</span>
        </span>
      </div>
    </div>

    {data.length === 0 ? (
      <div className="text-center text-gray-500 py-10">
        No hay paquetes registrados
      </div>
    ) : (
      <>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-gray-700">
                <th className="px-3 py-3 text-left font-semibold w-[110px]">Opciones</th>
                <th className="px-3 py-3 text-left font-semibold">Tracking</th>
                <th className="px-3 py-3 text-left font-semibold">HAWB</th>
                <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                <th className="px-3 py-3 text-left font-semibold">Cliente</th>
                <th className="px-3 py-3 text-left font-semibold">Servicio</th> 
                <th className="px-2 py-1">Estado</th>
                <th className="px-3 py-3 text-left font-semibold">Contenido</th>
                <th className="px-3 py-3 text-right font-semibold">Peso</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paquetesAMostrar.map((p, i) => (
                <tr
                  key={p.id ?? i}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => imprimirEtiqueta(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100 transition"
                        title="Imprimir"
                      >
                        <img src={iconPrint} className="w-5 h-5" />
                      </button>

                      {onEditar && (() => {
                        const puedeEditar = [5, 22].includes(Number(p.estado_id));

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (!puedeEditar) return;
                              onEditar(p);
                            }}
                            disabled={!puedeEditar}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                              puedeEditar
                                ? "border-gray-200 bg-white hover:bg-gray-100 cursor-pointer"
                                : "border-gray-100 bg-gray-100 opacity-50 cursor-not-allowed"
                            }`}
                            title={
                              puedeEditar
                                ? "Editar"
                                : "Solo se puede editar si está en estado Digitado o Editada"
                            }
                          >
                            <img src={iconEdit} className="w-5 h-5" />
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => anularGuia(p)}
                        disabled={!puedeAnular(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
                          puedeAnular(p)
                            ? "border-gray-200 bg-white hover:bg-red-50"
                            : "border-gray-100 bg-gray-100 opacity-50 cursor-not-allowed"
                        }`}
                        title={
                          puedeAnular(p)
                            ? "Anular"
                            : p.estado?.toLowerCase() === "anulado"
                              ? "Ya anulada"
                              : "No se puede anular en este estado"
                        }
                      >
                        <img src={iconCancel} className="w-5 h-5" />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-gray-800">
                    <span className="font-mono text-xs sm:text-sm">{p.tracking}</span>
                  </td>

                  <td className="px-3 py-2 text-gray-800">
                    <span className="font-mono text-xs sm:text-sm">{p.hawb}</span>
                  </td>

                  <td className="px-3 py-2 text-gray-800">
                    {formatearFechaRegistro(p.fecha_registro)}
                  </td>

                  <td className="px-3 py-2 text-gray-800">
                    {p.cliente}
                  </td>

                  <td className="px-3 py-2 text-gray-800">
                    {p.servicio ? (
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">
                        {p.servicio}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-2 py-1 text-sm">
                    {p.estado?.toLowerCase() === "anulado" ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700">
                        Anulado
                      </span>
                    ) : p.estado?.toLowerCase() === "digitado" ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-900">
                        Digitado
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-900">
                        {p.estado}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-gray-800">
                    {p.contenido}
                  </td>

                  <td className="px-3 py-2 text-right text-gray-800 font-semibold">
                    {p.peso}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <div className="text-sm text-gray-600">
            Mostrando{" "}
            <span className="font-semibold text-gray-800">
              {data.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-gray-800">
              {Math.min(paginaActual * registrosPorPagina, data.length)}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-gray-800">
              {data.length}
            </span>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={`px-3 py-2 rounded-lg border text-sm font-semibold transition
                ${paginaActual === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"}
              `}
            >
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {generarPaginas().map((n) => (
                <button
                  key={n}
                  onClick={() => cambiarPagina(n)}
                  className={`w-9 h-9 rounded-lg border text-sm font-semibold transition
                    ${n === paginaActual
                      ? "bg-red-900 text-white border-red-900"
                      : "bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"}
                  `}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={`px-3 py-2 rounded-lg border text-sm font-semibold transition 
                ${paginaActual === totalPaginas
                  ? "bg-gray-100 text-gray-400  cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-700 cursor-pointer"}
              `}
            >
              Siguiente
            </button>
          </div>
        </div>
      </>
    )}
  </div>
);

}
