import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import ClientDashboardLayout from "../layouts/ClientDashboardLayout";
import iconHome from "../assets/home-svgrepo-com.svg";
import Swal from "sweetalert2";
import SolicitudesRealizadasTabla from "../components/solicitudes/SolicitudesRealizadasTabla";
import { Solicitud } from "../types/solicitudes";
import ModalCrearSolicitud from "../components/solicitudes/ModalCrearSolicitud";
import ModalVerDetalleSolicitud from "../components/solicitudes/ModalVerDetalleSolicitud";
import { openAuthenticatedPdf } from "../utils/openAuthenticatedPdf";

import { useNavigate } from "react-router-dom";
import ModalEditarSolicitud from "../components/solicitudes/ModalEditarSolicitud";

export default function SolicitarDespachos() {
  const clientePortal = useMemo(() => {
    const stored = localStorage.getItem("cliente") || sessionStorage.getItem("cliente");

    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        codigo_referencia: parsed.codigo_referencia || parsed.codigoReferencia,
      };
    } catch {
      return null;
    }
  }, []);

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
      `/api/solicitudes/eliminar/${solicitud.id}`
    );

    Swal.fire("✅ Eliminada", data.mensaje, "success");

    setSolicitudes((prev) => prev.filter((s) => s.id !== solicitud.id));

    if (clienteSeleccionado?.codigo_referencia) {
      seleccionarCliente(clienteSeleccionado); 
    }
  } catch (error: any) {
      Swal.fire({
    icon: "warning",
    title: "No se puede eliminar",
    text: error.response?.data?.mensaje || "La solicitud no puede eliminarse"
  });
  }
  };

  const handleImprimirSolicitud = async (solicitud: Solicitud) => {
    try {
      await openAuthenticatedPdf(
        `/api/solicitudes/pdf/${solicitud.id}`,
        `Solicitud_${solicitud.id}.pdf`
      );
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
  const [paginaPaquetes, setPaginaPaquetes] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
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
      `/api/clientes/buscar/${encoded}`
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
    const codigoReferencia =
      cliente.codigo_referencia || cliente.codigoReferencia || cliente.codigo;

    setLoadingPaquetes(true);
    setClienteSeleccionado({ ...cliente, codigo_referencia: codigoReferencia });
    setClientes([]);
    setSearch(`${cliente.nombre} (${codigoReferencia})`);

    try {
      const { data } = await axios.get(
        `/api/paquetes/por-cliente/${codigoReferencia}`
      );

      if (Array.isArray(data)) {
        const disponibles = data.filter(
          (p) => p.estado?.toLowerCase() !== "solicitado"
        );

        setPaquetesCliente(disponibles);
        await obtenerSolicitudesCliente(codigoReferencia);

      } else {
        setPaquetesCliente([]);
      }

      const rDest = await axios.get(`/api/destinatarios/${cliente.id}`);
      setDestinatariosCliente(Array.isArray(rDest.data) ? rDest.data : []);

    } catch (error) {
      console.error("❌ Error obteniendo paquetes:", error);
      setPaquetesCliente([]);
    }
    finally {
    setLoadingPaquetes(false); 
    }
  };

  const handleSubirComprobante = async (solicitud: Solicitud, archivo: File) => {
    try {
      const formData = new FormData();
      formData.append("comprobante", archivo);

      const { data } = await axios.post(
        `/api/solicitudes/comprobante/${solicitud.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSolicitudes((prev) =>
        prev.map((item) =>
          item.id === solicitud.id
            ? {
                ...item,
                comprobante_pago_url: data?.url || item.comprobante_pago_url,
                comprobante: data?.url || item.comprobante,
              }
            : item
        )
      );

      if (clienteSeleccionado?.codigo_referencia) {
        await obtenerSolicitudesCliente(clienteSeleccionado.codigo_referencia);
      }

      Swal.fire(
        "Comprobante cargado",
        "El equipo de JAES Cargo recibira la notificacion para validar el pago.",
        "success"
      );
    } catch (error: any) {
      console.error("Error subiendo comprobante:", error);
      Swal.fire({
        icon: "error",
        title: "No se pudo cargar",
        text:
          error?.response?.data?.mensaje ||
          "No fue posible subir el comprobante de pago.",
      });
    }
  };

  useEffect(() => {
    if (clientePortal && !clienteSeleccionado) {
      seleccionarCliente(clientePortal);
    }
  }, [clientePortal, clienteSeleccionado]);


  const obtenerSolicitudesCliente = async (codigoReferencia: string) => {
    try {
      const codigoSeguro = encodeURIComponent(codigoReferencia);
      const { data } = await axios.get(
        `/api/solicitudes/listar?codigo=${codigoSeguro}`
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

  useEffect(() => {
    setPaginaPaquetes(1);
  }, [paquetesCliente.length, registrosPorPagina]);

  const formatearFechaRegistro = (fecha?: string) => {
    if (!fecha) return "—";
    const fechaObj = new Date(fecha);
    if (Number.isNaN(fechaObj.getTime())) return "—";
    const yyyy = fechaObj.getFullYear();
    const mm = String(fechaObj.getMonth() + 1).padStart(2, "0");
    const dd = String(fechaObj.getDate()).padStart(2, "0");
    return `${yyyy}/${mm}/${dd}`;
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

  const obtenerMensajeErrorSolicitud = (error: any) => {
    const data = error?.response?.data;
    const errores = Array.isArray(data?.errores)
      ? data.errores
          .map((item: any) => item?.mensaje)
          .filter(Boolean)
          .join("\n")
      : "";

    return (
      errores ||
      data?.mensaje ||
      data?.message ||
      error?.message ||
      "No se pudo crear la solicitud"
    );
  };

  const obtenerTituloErrorSolicitud = (error: any) => {
    const status = error?.response?.status;

    if (status === 401) return "Sesion expirada";
    if (status === 403) return "Sin permisos";
    if (status === 400) return "Datos invalidos";

    return "Error";
  };

  const obtenerUsuarioOperacion = () => {
    const usuarioGuardado =
      localStorage.getItem("usuario") || sessionStorage.getItem("usuario");

    if (!usuarioGuardado) return null;

    try {
      return JSON.parse(usuarioGuardado);
    } catch {
      return null;
    }
  };



  const confirmarCreacionSolicitud = async (formData: any) => {
    try {
    const usuarioOperacion = obtenerUsuarioOperacion();

    if (
      !clientePortal &&
      (!usuarioOperacion?.id || !["admin", "usuario"].includes(usuarioOperacion?.tipo))
    ) {
      return Swal.fire({
        icon: "error",
        title: "Sin permisos",
        text: "No tienes permisos para crear solicitudes de despacho. Ingresa con un usuario operativo autorizado.",
      });
    }

    const payload = {
      cliente_id: clienteSeleccionado?.id || clienteSeleccionado?.cliente_id,
      usuario_id: usuarioOperacion?.id || null,
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
        "/api/solicitudes/crear",
        payload
      );

      Swal.fire("✅ Solicitud creada", `N° Solicitud: ${data.codigo}`, "success");

      setSeleccionados([]);
      setMostrarModal(false);

      await seleccionarCliente(clienteSeleccionado);

    } catch (error) {
      console.error("Error creando solicitud:", error);
      Swal.fire({
        icon: "error",
        title: obtenerTituloErrorSolicitud(error),
        text: obtenerMensajeErrorSolicitud(error),
      });
    }
  };

  const paquetesSeleccionados = paquetesCliente.filter((p) =>
    seleccionados.includes(p.id)
  );
  const pesoSeleccionado = paquetesSeleccionados.reduce(
    (total, p) => total + Number(p.peso || 0),
    0
  );
  const clienteCodigo =
    clienteSeleccionado?.codigo_referencia ||
    clienteSeleccionado?.codigo ||
    clienteSeleccionado?.codigo_casillero ||
    "";
  const Layout = clientePortal ? ClientDashboardLayout : UserDashboardLayout;
  const totalPaginasPaquetes = Math.max(
    1,
    Math.ceil(paquetesCliente.length / registrosPorPagina)
  );
  const paginaPaquetesSegura = Math.min(paginaPaquetes, totalPaginasPaquetes);
  const inicioPaquetes = (paginaPaquetesSegura - 1) * registrosPorPagina;
  const finPaquetes = Math.min(inicioPaquetes + registrosPorPagina, paquetesCliente.length);
  const paquetesPaginados = paquetesCliente.slice(inicioPaquetes, finPaquetes);
  const cambiarPaginaPaquetes = (pagina: number) => {
    setPaginaPaquetes(Math.min(Math.max(pagina, 1), totalPaginasPaquetes));
  };

  return (
    <Layout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden text-gray-800 px-0 pb-10 animate-fade-in sm:px-2 lg:px-4">
        <h1 className="mb-2 text-2xl font-bold text-red-900 sm:text-3xl">
          Solicitar Despachos
        </h1>

        <p className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate(clientePortal ? "/dashboardCliente" : "/dashboardUsuario")}
            className="font-semibold hover:underline cursor-pointer"
          >
            {clientePortal ? "Mi casillero" : "Dashboard"}
          </button>
          &gt; Solicitar despachos
        </p>

        {!clientePortal && (
        <div className="relative mb-8 overflow-visible rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_22px_55px_rgba(17,24,39,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-red-950/5" />
          <div className="relative mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                Centro de despacho
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-600">
                Buscar cliente
              </h2>
            </div>
            <p className="text-xs font-semibold text-gray-500">
              Ingresa minimo 3 caracteres para consultar casilleros.
            </p>
          </div>
          <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-red-900/60"
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

            <input
              type="text"
              className="relative w-full rounded-2xl border border-gray-200 bg-slate-50/80 py-3 pl-12 pr-4 text-sm font-semibold text-gray-800 shadow-inner outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
              placeholder="Buscar cliente por nombre o código de casillero..."
              value={search}
              onChange={(e) => buscarCliente(e.target.value)}
            />

            {clientes.length > 0 && (
              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-slate-400/30">
                {clientes.map((c) => (
                  <p
                    key={c.codigo_referencia}
                    className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 cursor-pointer text-sm text-gray-700 hover:bg-red-50/70 transition-all last:border-b-0"
                    onClick={() => seleccionarCliente(c)}
                  >
                    <span className="font-semibold text-gray-800">{c.nombre}</span>{" "}
                    <span className="text-gray-500">— {c.codigo_referencia}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        )}

        {clienteSeleccionado && (
          <>
            <section className="relative mb-5 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
              <div className="relative grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                    Cliente seleccionado
                  </p>
                  <h3 className="mt-1 break-words text-lg font-semibold tracking-tight text-gray-800 sm:text-xl">
                    {clienteSeleccionado.nombre}
                  </h3>
                  <p className="mt-1 font-mono text-sm font-semibold text-red-950">
                    {clienteCodigo}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-3 sm:min-w-[360px]">
                  <div className="rounded-xl border border-gray-200 bg-slate-50/80 p-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-gray-500 sm:text-[10px] sm:tracking-[0.18em]">Disponibles</p>
                    <p className="mt-1 text-lg font-black text-gray-800">{paquetesCliente.length}</p>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-green-700 sm:text-[10px] sm:tracking-[0.18em]">Seleccionados</p>
                    <p className="mt-1 text-lg font-black text-green-800">{seleccionados.length}</p>
                  </div>
                  <div className="rounded-xl border border-red-900/10 bg-red-50 p-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-950 sm:text-[10px] sm:tracking-[0.18em]">Peso</p>
                    <p className="mt-1 text-lg font-black text-red-950">{pesoSeleccionado.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </section>
            <h3 className="sr-only">
              Paquetes Disponibles —{" "}
              <span className="text-red-800">{clienteSeleccionado.nombre}</span>
            </h3>

            {loadingPaquetes ? (
              <div className="mt-8 flex justify-center items-center rounded-2xl border border-gray-200 bg-white/90 p-10 shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-900 border-t-transparent"></div>
              </div>
            ) : paquetesCliente.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white/90 p-8 text-center shadow-sm">
                <p className="text-sm font-semibold text-gray-500">
                  Este cliente no tiene paquetes disponibles para solicitar.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                  <div className="flex flex-col gap-4 border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                        Inventario disponible
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-gray-800">
                        Paquetes listos para solicitud
                      </h3>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <span className="rounded-full border border-red-900/10 bg-red-50 px-3 py-1 text-xs font-bold text-red-950">
                        {paquetesCliente.length} registros
                      </span>
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-gray-500">
                        Ver
                        <select
                          value={registrosPorPagina}
                          onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-gray-800 outline-none transition focus:border-red-900 focus:ring-4 focus:ring-red-900/10"
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <p className="px-5 pb-2 text-[11px] font-bold text-gray-400 sm:hidden">
                    Desliza la tabla hacia la derecha para ver toda la informacion.
                  </p>
                  <div className="w-full max-w-full overflow-x-auto">
                  <table className="min-w-[1050px] w-full border-collapse">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 text-xs uppercase font-black tracking-[0.16em]">
                      <tr>
                        <th className="py-3 px-4 text-center">Seleccionar</th>
                        <th className="py-3 px-4 text-left">HAWB</th>
                        <th className="py-3 px-4 text-left">Tracking</th>
                        <th className="py-3 px-4 text-left">Fecha</th>
                        <th className="py-3 px-4 text-left">Servicio</th>
                        <th className="py-3 px-4 text-left">Tienda</th> 
                        <th className="py-3 px-4 text-left">Contenido</th>
                        <th className="py-3 px-4 text-center">Peso (lb)</th>
                        <th className="py-3 px-4 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paquetesPaginados.map((p) => (
                        <tr
                          key={p.id}
                          className={`text-sm transition-all duration-200 hover:bg-red-50/50 ${
                            seleccionados.includes(p.id)
                              ? "bg-green-50/80 hover:bg-green-50"
                              : ""
                          }`}
                        >
                          <td className="p-3 text-center">
                          <button
                            onClick={() => toggleSeleccion(p.id)}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300
                              ${seleccionados.includes(p.id) ? "bg-green-600" : "bg-red-600"}
                            `}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-300
                                ${seleccionados.includes(p.id) ? "translate-x-8" : "translate-x-1"}
                              `}
                            />
                          </button>
                          </td>
                          <td className="p-3 font-mono text-red-800 font-semibold">
                            {p.hawb}
                          </td>
                          <td className="p-3 font-medium text-gray-800">{p.tracking}</td>
                          <td className="p-3 text-gray-700">{formatearFechaRegistro(p.fecha_registro)}</td>
                          <td className="p-3 text-gray-700">{p.servicio}</td>
                          <td className="p-3 text-gray-700">
                            {p.tienda ?? "—"} 
                          </td>
                          <td className="p-3 text-gray-700">{p.contenido}</td>
                          <td className="p-3 text-center text-gray-700">{p.peso}</td>
                          <td
                            className={`p-3 text-center font-semibold ${
                              p.estado === "Solicitado"
                                ? "text-blue-600"
                                : p.estado === "Digitado"
                                ? "text-gray-600"
                                : "text-green-700"
                            }`}
                          >
                            {p.estado}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white px-5 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm font-semibold text-gray-500">
                      Mostrando{" "}
                      <span className="font-black text-gray-800">
                        {paquetesCliente.length === 0 ? 0 : inicioPaquetes + 1}
                      </span>{" "}
                      -{" "}
                      <span className="font-black text-gray-800">{finPaquetes}</span>{" "}
                      de{" "}
                      <span className="font-black text-gray-800">{paquetesCliente.length}</span>
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cambiarPaginaPaquetes(paginaPaquetesSegura - 1)}
                        disabled={paginaPaquetesSegura === 1}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                          paginaPaquetesSegura === 1
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                            : "border-gray-200 bg-white text-gray-700 hover:border-red-900/20 hover:bg-red-50"
                        }`}
                      >
                        Anterior
                      </button>
                      <span className="min-w-[86px] text-center text-sm font-black text-gray-700">
                        {paginaPaquetesSegura} / {totalPaginasPaquetes}
                      </span>
                      <button
                        onClick={() => cambiarPaginaPaquetes(paginaPaquetesSegura + 1)}
                        disabled={paginaPaquetesSegura === totalPaginasPaquetes}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                          paginaPaquetesSegura === totalPaginasPaquetes
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                            : "border-gray-200 bg-white text-gray-700 hover:border-red-900/20 hover:bg-red-50"
                        }`}
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-gray-500">
                      {seleccionados.length > 0
                        ? `${seleccionados.length} paquete(s) seleccionado(s) para crear solicitud.`
                        : "Selecciona los paquetes que haran parte del despacho."}
                    </p>
                    <button
                      onClick={crearSolicitud}
                      disabled={seleccionados.length === 0}
                      className={`rounded-xl px-6 py-2.5 text-sm font-black text-white shadow-lg transition-all duration-200 ${
                        seleccionados.length === 0
                          ? "cursor-not-allowed bg-gray-300 text-gray-500 shadow-none"
                          : "cursor-pointer bg-gradient-to-r from-red-950 to-red-900 shadow-red-950/20 hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800 hover:shadow-xl"
                      }`}
                    >
                      Crear Solicitud
                    </button>
                  </div>
                </div>
                </div>
              </>
            )}
          </>
        )}

        {clienteSeleccionado && (clientePortal || solicitudes.length > 0) && (
          <SolicitudesRealizadasTabla
            solicitudes={solicitudes}
            onImprimir={handleImprimirSolicitud}
            onVerDetalle={(s) => setModalDetalle(s)}
            onEliminar={clientePortal ? undefined : eliminarSolicitud}
            onEditar={clientePortal ? undefined : (s) => setSolicitudEditar(s)}
            onSubirComprobante={clientePortal ? handleSubirComprobante : undefined}
            modoCliente={Boolean(clientePortal)}
          />
        )}

      </div>

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
          puedeEnviarCobro={!clientePortal}
        />
      )}

      {!clientePortal && solicitudEditar && (
        <ModalEditarSolicitud
          solicitud={solicitudEditar}
          onClose={() => setSolicitudEditar(null)}
          onUpdated={() => seleccionarCliente(clienteSeleccionado)}
        />
      )}

      
    </Layout>
  );
}
