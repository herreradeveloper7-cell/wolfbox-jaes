import { useState, useEffect } from "react";
import axios from "axios";
import ModalConfirmacion from "../../components/ModalConfirmacion";
import { ResultadoTracking } from "../../types/tracking";
import ModalConfirmarEliminar from "../../components/ModalConfirmarEliminar";
import iconTrash from "../../assets/trash-svgrepo-com.svg";
import iconEdit from "../../assets/edit-svgrepo-com.svg";

export interface TrackingEstadoEditable {
  id: number;
  hawb: string;
  estado: string;
  observaciones: string;
  responsable: string;
  fecha: string;
  punto_control: string;
  esUltimoEstado: boolean;
}

interface TablaResultadosTrackingProps {
  resultados: ResultadoTracking[];
  onEditar?: (tracking: TrackingEstadoEditable) => void;
}

export default function TablaResultadosTracking({ resultados, onEditar }: TablaResultadosTrackingProps) {
  const [registros, setRegistros] = useState("10");
  const [busqueda, setBusqueda] = useState("");
  const [modalMensaje, setModalMensaje] = useState<string | null>(null);
  const [modalEliminarId, setModalEliminarId] = useState<number | null>(null);
  const [modalEliminarHAWB, setModalEliminarHAWB] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [resultadosLocal, setResultadosLocal] = useState(resultados);

  useEffect(() => {
    setResultadosLocal(resultados);
  }, [resultados]);

  const resultadosFiltrados = resultadosLocal.filter((resultado) =>
    resultado.hawb.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleEliminar = async (estadoId: number, hawb: string) => {
    try {
      await axios.delete(`/api/paquetes/tracking/estado/historial/${estadoId}`);

      setModalMensaje("✅ Estado eliminado correctamente");

      const { data } = await axios.get(`/api/paquetes/tracking/hawb/${hawb}`);

      const nuevoTracking = data[0];

      setResultadosLocal(prev =>
        prev.map(resultado =>
          resultado.hawb === hawb ? nuevoTracking : resultado
        )
      );

    } catch (error: any) {
      const msg = error.response?.data?.mensaje || "❌ Error al eliminar el estado";
      setModalMensaje(msg);
    }
  };


  const abrirModalEliminar = (id: number, hawb: string) => {
    setModalEliminarId(id);
    setModalEliminarHAWB(hawb);
    setMostrarModal(true);
  };

  return (
    <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-600 tracking-wide">
            HISTORIAL DE ESTADOS
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Seguimiento completo de estados de paquetes y trackings
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <label
            className="text-sm font-semibold text-gray-600 tracking-tighter whitespace-nowrap"
          >
            Registros
          </label>

          <select
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white shadow-sm
              transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
            value={registros}
            onChange={(e) => setRegistros(e.target.value)}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Buscar por HAWB..."
          className="w-full lg:w-[300px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white shadow-sm
            transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-separate border-spacing-y-2">
          <thead className="bg-gray-50 text-gray-600 font-semibold">
            <tr className="bg-gray-100 hover:bg-gray-100 transition">
              <th className="px-4 py-3 text-gray-600 font-semibold">HAWB</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Fecha</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Estado</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Observaciones</th>
              <th className="px-4 py-3 text-gray-600 font-semibold">Responsable</th>
              <th className="px-4 py-3 text-gray-600 font-semibold text-center">Opciones</th>
            </tr>
          </thead>
          <tbody>
            {resultadosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-950">
                      !
                    </div>
                    <span className="font-medium">Sin registros disponibles</span>
                  </div>
                </td>
              </tr>
            ) : (
              resultadosFiltrados.map((resultado) =>
                  resultado.estados.map((estado, estadoIndex) => {
                  const esUltimo = estadoIndex === 0;
                  const esUnico = resultado.estados.length === 1;

                  const esDigitado = estado.estado === "Digitado";

                  const mostrarBotones = !(esUnico || esDigitado);

                    return (
                      <tr key={estado.id} className="bg-white hover:bg-gray-50 transition border border-gray-200 rounded-lg shadow-sm">
                        <td className="px-4 py-3 text-gray-700 font-semibold">{resultado.hawb}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{estado.fecha}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                            estado.estado === "Digitado"
                              ? "bg-green-50 text-green-900 border-green-200"
                              : estado.estado === "anulado"
                              ? "bg-red-50 text-red-900 border-red-200"
                              : "bg-blue-50 text-blue-900 border-blue-200"
                          }`}>
                            {estado.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate" title={estado.observaciones || "-"}>
                          {estado.observaciones || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{estado.responsable}</td>

                        <td className="px-4 py-3 flex justify-center gap-2">
                          {mostrarBotones && (
                            <>
                              <button
                                title="Editar estado"
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 hover:scale-105 transition shadow-sm cursor-pointer"
                                onClick={() =>
                                  onEditar &&
                                  onEditar({
                                    id: estado.id,
                                    hawb: resultado.hawb,
                                    estado: estado.estado,
                                    observaciones: estado.observaciones || "",
                                    responsable: estado.responsable,
                                    fecha: estado.fecha,
                                    punto_control: estado.punto_control,
                                    esUltimoEstado: esUltimo,
                                  })
                                }
                              >
                                <img src={iconEdit} alt="Editar" className="w-4 h-4" />
                              </button>

                              <button
                                title="Eliminar estado"
                                className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 hover:scale-105 transition shadow-sm cursor-pointer"
                                onClick={() => abrirModalEliminar(estado.id, resultado.hawb)}
                              >
                                <img src={iconTrash} alt="Eliminar" className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )
            )}
          </tbody>
        </table>
      </div>

      {modalMensaje && (
        <ModalConfirmacion mensaje={modalMensaje} onClose={() => setModalMensaje(null)} />
      )}

      {modalEliminarId && modalEliminarHAWB && (
        <ModalConfirmarEliminar
          mensaje="¿Está seguro que desea borrar este tracking?"
          visible={mostrarModal}
          onCancel={() => {
            setModalEliminarId(null);
            setModalEliminarHAWB(null);
            setMostrarModal(false);
          }}
          onConfirm={() => {
            handleEliminar(modalEliminarId, modalEliminarHAWB);
            setModalEliminarId(null);
            setModalEliminarHAWB(null);
            setMostrarModal(false);
          }}
        />
      )}
    </div>
  );
}
