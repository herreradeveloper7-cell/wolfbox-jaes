import { useState, useEffect } from "react";
import axios from "axios";
import ModalConfirmacion from "../components/ModalConfirmacion";
import { ResultadoTracking } from "../types/tracking";
import ModalConfirmarEliminar from "../components/ModalConfirmarEliminar";
import iconTrash from "../assets/trash-svgrepo-com.svg";
import iconEdit from "../assets/edit-svgrepo-com.svg";

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
      await axios.delete(`http://localhost:3000/api/paquetes/tracking/estado/historial/${estadoId}`);

      setModalMensaje("✅ Estado eliminado correctamente");

      const { data } = await axios.get(`http://localhost:3000/api/paquetes/tracking/hawb/${hawb}`);

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
    <div className="bg-white rounded-lg">
      <div className="flex justify-end items-center px-4 py-5">
        <div className="flex items-center gap-3">
          <label
            className={`text-sm text-right transition-colors duration-300 
              ${registros !== "" ? "text-green-900 font-semibold" : "text-gray-700"}`}
          >
            Registros
          </label>

          <select
            className="border border-gray-300 rounded text-sm px-2 py-[6px] text-gray-700
              transition-all duration-300 focus:outline-none focus:border-green-900"
            value={registros}
            onChange={(e) => setRegistros(e.target.value)}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>

          <input
            type="text"
            placeholder="Buscar HAWB"
            className="border border-gray-300 rounded px-3 py-[6px] text-sm text-gray-700
              transition-all duration-300 focus:outline-none focus:border-green-900"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-600 uppercase border border-gray-300 text-xs">
          <tr>
            <th className="px-4 py-2">HAWB</th>
            <th className="px-4 py-2">Fecha</th>
            <th className="px-4 py-2">Estado</th>
            <th className="px-4 py-2">Observaciones</th>
            <th className="px-4 py-2">Responsable</th>
            <th className="px-4 py-2">Opciones</th>
          </tr>
        </thead>
        <tbody>
          {resultadosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-10 text-gray-500">
                Sin registros.
              </td>
            </tr>
          ) : (
            resultadosFiltrados.map((resultado) =>
                resultado.estados.map((estado, estadoIndex) => {
                  const esUltimo = estadoIndex === 0;
                  const esUnico = resultado.estados.length === 1;

                  const esDigitadoInicial =
                    estado.estado === "Digitado" && estado.punto_control === "Casilleros bodega";

                  const mostrarBotones = !(esUnico || esDigitadoInicial);

                  return (
                    <tr key={estado.id} className="border border-gray-300">
                      <td className="px-4 py-2">{resultado.hawb}</td>
                      <td className="px-4 py-2">{estado.fecha}</td>
                      <td className="px-4 py-2">{estado.estado}</td>
                      <td className="px-4 py-2">{estado.observaciones || "-"}</td>
                      <td className="px-4 py-2">{estado.responsable}</td>

                      <td className="px-4 py-2 flex gap-2">
                        {mostrarBotones && (
                          <>
                            <button
                              title="Editar estado"
                              className="bg-white border border-gray-300 p-1 rounded hover:bg-gray-100 shadow-sm cursor-pointer"
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
                              className="bg-white border border-gray-300 p-1 rounded hover:bg-gray-100 shadow-sm cursor-pointer"
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
