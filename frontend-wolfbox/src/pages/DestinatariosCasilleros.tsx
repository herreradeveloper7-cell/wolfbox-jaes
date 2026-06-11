import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, UsersRound } from "lucide-react";
import UserDashboardLayout from "../layouts/UserDashboardLayout";
import ClientDashboardLayout from "../layouts/ClientDashboardLayout";
import iconHome from "../assets/home-svgrepo-com.svg";
import ModalCrearDestinatario from "../components/destianatariosCasilleros/ModalCrearDestinatario";
import TablaDestinatarios from "../components/destianatariosCasilleros/TablaDestinatarios";
import ModalEditarDestinatario from "../components/destianatariosCasilleros/ModalEditarDestinatario";
import BuscarDestinatarios from "../components/destianatariosCasilleros/BuscarDestinatarios";

export default function DestinatariosCasilleros() {
  const navigate = useNavigate();
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

  const [showModal, setShowModal] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [destinatarios, setDestinatarios] = useState<any[]>([]);
  const [editingDestinatario, setEditingDestinatario] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const Layout = clientePortal ? ClientDashboardLayout : UserDashboardLayout;
  const dashboardPath = clientePortal ? "/dashboardCliente" : "/dashboardUsuario";

  const cargarDestinatarios = async (cliente: any) => {
    const clienteId = cliente.id || cliente.cliente_id;

    if (!clienteId) {
      setDestinatarios([]);
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.get(`/api/destinatarios/${clienteId}`);
      setDestinatarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando destinatarios:", error);
      setDestinatarios([]);
      Swal.fire("Error", "No se pudieron cargar los destinatarios", "error");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCliente = async (cliente: any) => {
    const normalizado = {
      ...cliente,
      codigo_referencia: cliente.codigo_referencia || cliente.codigoReferencia,
    };

    setClienteSeleccionado(normalizado);
    setBusquedaCliente(normalizado.codigo_referencia || "");
    await cargarDestinatarios(normalizado);
  };

  useEffect(() => {
    if (clientePortal && !clienteSeleccionado) {
      seleccionarCliente(clientePortal);
    }
  }, [clientePortal, clienteSeleccionado]);

  const handleBuscarCliente = async () => {
    if (!busquedaCliente.trim()) {
      Swal.fire("Ups!", "Ingresa nombre o codigo de referencia del cliente", "warning");
      return;
    }

    try {
      const { data } = await axios.get(
        `/api/clientes/buscar/${encodeURIComponent(busquedaCliente)}`
      );

      if (!Array.isArray(data.clientes) || data.clientes.length === 0) {
        Swal.fire("Sin resultados", "No se encontro ningun cliente que coincida", "info");
        setClienteSeleccionado(null);
        setDestinatarios([]);
        return;
      }

      await seleccionarCliente(data.clientes[0]);
    } catch (error) {
      console.error("Error buscando cliente:", error);
      Swal.fire("Error", "Hubo un problema buscando el cliente", "error");
    }
  };

  const handleCrearDestinatario = async (data: any) => {
    try {
      await axios.post("/api/destinatarios/crear", {
        ...data,
        cliente_id: clienteSeleccionado.id,
      });

      Swal.fire("OK", "Destinatario creado correctamente", "success");
      setShowModal(false);
      await cargarDestinatarios(clienteSeleccionado);
    } catch (error) {
      console.error("Error creando destinatario:", error);
      Swal.fire("Error", "No se pudo crear el destinatario", "error");
    }
  };

  const handleEliminar = async (dest: any) => {
    const confirm = await Swal.fire({
      title: "Eliminar destinatario",
      text: `Se eliminara: ${dest.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#555",
      confirmButtonText: "Si, eliminar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`/api/destinatarios/${dest.id}`);
      await cargarDestinatarios(clienteSeleccionado);

      Swal.fire({
        icon: "success",
        title: "Destinatario eliminado",
        text: "El destinatario fue eliminado correctamente.",
        confirmButtonColor: "#7d1111",
      });
    } catch (error: any) {
      if (error.response?.status === 403) {
        Swal.fire({
          icon: "info",
          title: "No se puede eliminar",
          text: error.response.data?.msg || "Este destinatario es el principal del cliente.",
          confirmButtonColor: "#7d1111",
        });
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el destinatario.",
        confirmButtonColor: "#7d1111",
      });
    }
  };

  return (
    <Layout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 pb-10 text-gray-800 sm:px-6 lg:px-10">
        <h1 className="text-3xl font-bold mb-2 text-red-900">
          Destinatarios Casilleros
        </h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate(dashboardPath)}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            {clientePortal ? "Mi casillero" : "Dashboard"}
          </button>
          &gt; Destinatarios Casilleros
        </p>

        {!clientePortal && (
          <section className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-6 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
            <div className="mb-6 flex flex-col gap-3 border-b border-gray-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                  Gestion de destinatarios
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                  Buscar cliente o destinatario
                </h2>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Consulta el cliente por nombre o codigo de casillero para administrar sus destinatarios.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 md:flex">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-xs font-semibold text-gray-600">Busqueda activa</span>
              </div>
            </div>

            <label className="mb-3 block px-1 text-sm font-bold tracking-wide text-gray-600">
              Cliente / Codigo de casillero
            </label>
            <BuscarDestinatarios
              value={busquedaCliente}
              onChange={setBusquedaCliente}
              onSelect={seleccionarCliente}
            />

            <div className="mt-6 flex justify-end border-t border-gray-200/70 pt-5">
              <button
                onClick={handleBuscarCliente}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800"
              >
                Buscar
              </button>
            </div>
          </section>
        )}

        {clienteSeleccionado && (
          <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
            <div className="relative p-6">
              <div className="mb-6 flex flex-col gap-4 border-b border-gray-200/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                    {clientePortal ? "Mis destinatarios" : "Destinatarios registrados"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                    Destinatarios de{" "}
                    <span className="text-red-950">{clienteSeleccionado.nombre}</span>
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    Administra direcciones y datos de contacto para tus solicitudes de despacho.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-black text-gray-700">
                    <UsersRound className="h-4 w-4 text-red-950" />
                    {destinatarios.length} registros
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800"
                  >
                    <Plus className="h-4 w-4" />
                    Crear destinatario
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-gray-100 bg-slate-50">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-900 border-t-transparent" />
                </div>
              ) : (
                <TablaDestinatarios
                  lista={destinatarios}
                  onEditar={(dest) => setEditingDestinatario(dest)}
                  onEliminar={handleEliminar}
                />
              )}
            </div>
          </section>
        )}

        {!clienteSeleccionado && clientePortal && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-red-950" />
            <p className="text-sm font-semibold text-gray-500">Cargando destinatarios...</p>
          </div>
        )}

        {showModal && (
          <ModalCrearDestinatario
            onClose={() => setShowModal(false)}
            onSave={(data) => handleCrearDestinatario(data)}
          />
        )}

        {editingDestinatario && (
          <ModalEditarDestinatario
            destinatario={editingDestinatario}
            onClose={() => setEditingDestinatario(null)}
            onSave={async (data) => {
              await axios.put(`/api/destinatarios/${editingDestinatario.id}`, data);
              await cargarDestinatarios(clienteSeleccionado);
              setEditingDestinatario(null);
              Swal.fire("OK", "Destinatario actualizado correctamente", "success");
            }}
          />
        )}
      </div>
    </Layout>
  );
}
