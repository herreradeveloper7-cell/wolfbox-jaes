import { useState } from "react";
import axios from "axios";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import iconHome from "../assets/home-svgrepo-com.svg";
import Swal from "sweetalert2";
import SolicitudesRealizadasTabla from "../components/solicitudes/SolicitudesRealizadasTabla";
import { Solicitud } from "../types/solicitudes";
import ModalCrearSolicitud from "../components/solicitudes/ModalCrearSolicitud";
import ModalVerDetalleSolicitud from "../components/solicitudes/ModalVerDetalleSolicitud";
import { generarPdfSolicitud } from "../utils/generarPdfSolicitud";

import { useNavigate } from "react-router-dom";
import ModalEditarSolicitud from "../components/solicitudes/ModalEditarSolicitud";

export default function SolicitarDespachos() {

  type PaqueteSolicitud = {
  id: number;
  asegurado: number;
  }


  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [destinatariosCliente, setDestinatariosCliente] = useState<any[]>([]);

  const [loadingPaquetes, setLoadingPaquetes] = useState(false);

  const [solicitudEditar, setSolicitudEditar] = useState<any>(null);

  

  const eliminarSolicitud = async (solicitud: Solicitud) => {
  try {
    const { data } = await axios.delete(
      `http://localhost:3000/api/solicitudes/eliminar/${solicitud.id}`
    );

    Swal.fire("✅ Eliminada", data.mensaje, "success");

    setSolicitudes((prev) => prev.filter((s) => s.id !== solicitud.id));

    if (clienteSeleccionado?.codigo_referencia) {
      seleccionarCliente(clienteSeleccionado); 
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo eliminar la solicitud.", "error");
  }
  };

  const handleImprimirSolicitud = async (solicitud: Solicitud) => {
    try {
      const { data } = await axios.get(`/api/solicitudes/pdf-data/${solicitud.id}`);


      const solicitudPDFData = {
        id: data.id,
        fecha: data.fecha,

        cliente_nombre: data.cliente_nombre,
        codigoCasillero: data.codigoCasillero,

        destinatario_nombre: data.destinatario_nombre,
        destinatario_ciudad: data.destinatario_ciudad,
        destinatario_direccion: data.destinatario_direccion,
        destinatario_telefono: data.destinatario_telefono,

        paquetes: data.paquetes,
        cargos: data.cargos,  

        totalAseguradoUSD: data.totalAseguradoUSD,
        seguroUSD: data.seguroUSD,
        totalUSD: data.totalUSD,

        totalCargosUSD: data.totalCargosUSD,      
        totalCargosCOP: data.totalCargosCOP,      
        totalUSDConCargos: data.totalUSDConCargos, 
        totalCOPConCargos: data.totalCOPConCargos, 

        trm: data.trm,
        totalCOP: data.totalCOP,
      };


      generarPdfSolicitud(solicitudPDFData);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo generar el PDF", "error");
    }
  };


  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [paquetesCliente, setPaquetesCliente] = useState<any[]>([]);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [paquetesSeleccionadosDatos, setPaquetesSeleccionadosDatos] = useState<any[]>([]);
  const [modalDetalle, setModalDetalle] = useState<any>(null);

  const navigate = useNavigate();


  const buscarCliente = async (valor: string) => {
    setSearch(valor);

    if (valor.trim().length === 0) {
      setClientes([]);
      return;
    }

    if (valor.trim().length < 3) return;

    try {
      const encoded = encodeURIComponent(valor);
      const { data } = await axios.get(
      `http://localhost:3000/api/clientes/buscar/${encoded}`
      );

        if (data.ok && Array.isArray(data.clientes)) {
          setClientes(data.clientes);
        } else {
          setClientes([]);
        }
    } catch (error) {
      console.error("❌ Error buscando cliente:", error);
      setClientes([]);
    }
  };


  const seleccionarCliente = async (cliente: any) => {
    setLoadingPaquetes(true);
    setClienteSeleccionado(cliente);
    setClientes([]);
    setSearch(`${cliente.nombre} (${cliente.codigo_referencia})`);

    try {
      const { data } = await axios.get(
        `http://localhost:3000/api/paquetes/por-cliente/${cliente.codigo_referencia}`
      );

      console.log("📦 Respuesta del backend:", data);

      if (Array.isArray(data)) {
        const disponibles = data.filter(
          (p) => p.estado_actual?.toLowerCase() !== "solicitado"
        );

        setPaquetesCliente(disponibles);
        await obtenerSolicitudesCliente(cliente.codigo_referencia);

      } else {
        setPaquetesCliente([]);
      }

      const rDest = await axios.get(`http://localhost:3000/api/destinatarios/${cliente.id}`);
      setDestinatariosCliente(Array.isArray(rDest.data) ? rDest.data : []);

    } catch (error) {
      console.error("❌ Error obteniendo paquetes:", error);
      setPaquetesCliente([]);
    }
    finally {
    setLoadingPaquetes(false); 
    }
  };


  const obtenerSolicitudesCliente = async (codigoReferencia: string) => {
    try {
      const { data } = await axios.get(
        `http://localhost:3000/api/solicitudes/listar?codigo=${codigoReferencia}`
      );

      if (Array.isArray(data)) {
        setSolicitudes(data);
      } else {
        setSolicitudes([]);
      }
    } catch (error) {
      console.error("❌ Error obteniendo solicitudes del cliente:", error);
      setSolicitudes([]);
    }
  };

  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const crearSolicitud = () => {
    if (seleccionados.length === 0) {
      return Swal.fire("Aviso", "Seleccione al menos un paquete", "warning");
    }

    const seleccionadosDatos = paquetesCliente.filter((p) =>
      seleccionados.includes(p.id)
    );

    const servicios = seleccionadosDatos.map((p) => p.servicio_id);
    const unicos = [...new Set(servicios)];

    if (unicos.length > 1) {
      return Swal.fire({
        icon: "error",
        title: "Servicios diferentes",
        text: "Los paquetes seleccionados pertenecen a servicios distintos. Solo puede crear una solicitud con paquetes del mismo servicio.",
      });
    }

    setPaquetesSeleccionadosDatos(seleccionadosDatos);
    setMostrarModal(true);
  };



  const confirmarCreacionSolicitud = async (formData: any) => {
    try {
    const payload = {
      cliente_id: clienteSeleccionado?.id || clienteSeleccionado?.cliente_id,
      usuario_id: JSON.parse(localStorage.getItem("usuario")!).id,
      paquetes: formData.paquetes.map((p: PaqueteSolicitud) => ({
        id: p.id,
        asegurado: p.asegurado
      })),
      destinatario: formData.destinatario,
      medio_pago: formData.medioPago,
      observaciones: formData.observaciones,
      valor_estimado_usd: formData.totalUSD,
      valor_moneda_local: formData.totalCOP,
    };


      const { data } = await axios.post(
        "http://localhost:3000/api/solicitudes/crear",
        payload
      );

      Swal.fire("✅ Solicitud creada", `N° Solicitud: ${data.codigo}`, "success");

      setSeleccionados([]);
      setMostrarModal(false);

      await seleccionarCliente(clienteSeleccionado);

    } catch (error) {
      Swal.fire("Error", "No se pudo crear la solicitud", "error");
    }
  };

  


  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-6 lg:px-10 pb-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-red-900">
          Solicitar Despachos
        </h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Solicitar despachos
        </p>

        <div className="relative mb-6">
          {/* Icono de lupa */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M9 17a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>

            {/* Input de búsqueda */}
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        transition-all duration-200 ease-in-out text-gray-800 
                        placeholder-gray-400"
              placeholder="Buscar cliente por nombre o código de casillero..."
              value={search}
              onChange={(e) => buscarCliente(e.target.value)}
            />

            {clientes.length > 0 && (
              <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {clientes.map((c) => (
                  <p
                    key={c.codigo_referencia}
                    className="p-3 cursor-pointer text-sm text-gray-700 hover:bg-gray-100 transition-all"
                    onClick={() => seleccionarCliente(c)}
                  >
                    <span className="font-semibold text-gray-800">{c.nombre}</span>{" "}
                    <span className="text-gray-500">— {c.codigo_referencia}</span>
                  </p>
                ))}
              </div>
            )}
        </div>

        {/* ───── TABLA DE PAQUETES ───── */}
        {clienteSeleccionado && (
          <>
            <h3 className="mt-6 font-bold text-gray-700 text-lg">
              Paquetes Disponibles —{" "}
              <span className="text-red-800">{clienteSeleccionado.nombre}</span>
            </h3>

            {loadingPaquetes ? (
              <div className="mt-10 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-900 border-t-transparent"></div>
              </div>
            ) : paquetesCliente.length === 0 ? (
              <p className="mt-4 text-gray-500 italic text-sm">
                Este cliente no tiene paquetes disponibles para solicitar.
              </p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-xl shadow-md border border-gray-200 bg-white">
                  <table className="min-w-full border-collapse">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm uppercase font-semibold tracking-wide">
                      <tr>
                        <th className="py-3 px-4 text-center">Seleccionar</th>
                        <th className="py-3 px-4 text-left">Tracking</th>
                        <th className="py-3 px-4 text-left">Contenido</th>
                        <th className="py-3 px-4 text-center">Peso (lb)</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paquetesCliente.map((p) => (
                        <tr
                          key={p.id}
                          className={`text-sm border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 ${
                            seleccionados.includes(p.id)
                              ? "bg-blue-50 hover:bg-blue-100"
                              : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={seleccionados.includes(p.id)}
                              onChange={() => toggleSeleccion(p.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="p-3 font-medium text-gray-800">{p.tracking}</td>
                          <td className="p-3 text-gray-700">{p.contenido}</td>
                          <td className="p-3 text-center text-gray-700">{p.peso}</td>
                          <td
                            className={`p-3 text-center font-semibold ${
                              p.estado_actual === "Solicitado"
                                ? "text-blue-600"
                                : p.estado_actual === "Digitado"
                                ? "text-gray-600"
                                : "text-green-700"
                            }`}
                          >
                            {p.estado_actual}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={crearSolicitud}
                    className="bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded-lg font-semibold shadow 
                      transition-all duration-200 ease-in-out hover:shadow-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  >
                    Crear Solicitud
                  </button>
                </div>
              </>
            )}
          </>
        )}

      </div>

      {clienteSeleccionado && solicitudes.length > 0 && (
        <SolicitudesRealizadasTabla
        solicitudes={solicitudes}
        onImprimir={handleImprimirSolicitud}
        onEliminar={eliminarSolicitud}
        onVerDetalle={(s) => setModalDetalle(s)}
        onEditar={(s) => setSolicitudEditar(s)}   
        />
      )}

      {mostrarModal && (
        <ModalCrearSolicitud
          paquetesSeleccionados={paquetesSeleccionadosDatos}
          destinatariosCliente={destinatariosCliente}
          onClose={() => setMostrarModal(false)}
          onConfirm={confirmarCreacionSolicitud}
        />
      )}

      {modalDetalle && (
        <ModalVerDetalleSolicitud
          solicitud={modalDetalle}
          onClose={() => setModalDetalle(null)}
        />
      )}

      {solicitudEditar && (
        <ModalEditarSolicitud
          solicitud={solicitudEditar}
          onClose={() => setSolicitudEditar(null)}
          onUpdated={() => seleccionarCliente(clienteSeleccionado)}
        />
      )}

      
    </UserDashboardLayout>
  );
}
