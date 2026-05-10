import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../assets/home-svgrepo-com.svg";
import ModalCrearDestinatario from "../components/destianatariosCasilleros/ModalCrearDestinatario";
import TablaDestinatarios from "../components/destianatariosCasilleros/TablaDestinatarios";
import ModalEditarDestinatario from "../components/destianatariosCasilleros/ModalEditarDestinatario";
import BuscarDestinatarios from "../components/destianatariosCasilleros/BuscarDestinatarios";
import { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function DestinatariosCasilleros() {

  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [destinatarios, setDestinatarios] = useState<any[]>([]);


  const seleccionarCliente = async (cli: any) => {
    setClienteSeleccionado(cli);
    setBusquedaCliente(cli.codigo_referencia);

    const r2 = await axios.get(`http://localhost:3000/api/destinatarios/${cli.id}`);
    setDestinatarios(r2.data);
  };

  <BuscarDestinatarios
    value={busquedaCliente}
    onChange={setBusquedaCliente}
    onSelect={seleccionarCliente}
  />

  const handleBuscarCliente = async () => {
    if (!busquedaCliente.trim()) {
      Swal.fire("Ups!", "Ingresa nombre o código de referencia del cliente", "warning");
      return;
    }

    try {
      const { data } = await axios.get(
        `http://localhost:3000/api/clientes/buscar/${encodeURIComponent(busquedaCliente)}`
      );

      if (!Array.isArray(data.clientes) || data.clientes.length === 0) {
        Swal.fire("Sin resultados", "No se encontró ningún cliente que coincida", "info");
        setClienteSeleccionado(null);
        setDestinatarios([]);
        return;
      }

      const cliente = data.clientes[0];
      setClienteSeleccionado(cliente);

      const r2 = await axios.get(`http://localhost:3000/api/destinatarios/${cliente.id}`);

      setDestinatarios(Array.isArray(r2.data) ? r2.data : []);

    } catch (e: any) {
      console.error("❌ Error en handleBuscarCliente:", e?.response || e);
      Swal.fire("Error", "Hubo un problema buscando el cliente", "error");
    }
  };


  const handleCrearDestinatario = async (data: any) => {
    try {
      await axios.post("http://localhost:3000/api/destinatarios/crear", {
        ...data,
        cliente_id: clienteSeleccionado.id
      });

      Swal.fire("OK", "Destinatario creado correctamente", "success");

      setShowModal(false);

      const r2 = await axios.get(`http://localhost:3000/api/destinatarios/${clienteSeleccionado.id}`);
      setDestinatarios(r2.data);

    } catch (e) {
      console.log(e);
      Swal.fire("Error", "No se pudo crear el destinatario", "error");
    }
  };

  const handleEliminar = async (dest: any) => {
    const confirm = await Swal.fire({
      title: "Eliminar destinatario",
      text: `Se eliminará: ${dest.nombre}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#555",
      confirmButtonText: "Sí, eliminar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:3000/api/destinatarios/${dest.id}`);

      const r2 = await axios.get(
        `http://localhost:3000/api/destinatarios/${clienteSeleccionado.id}`
      );
      setDestinatarios(r2.data);

      Swal.fire({
        icon: "success",
        title: "Destinatario eliminado",
        text: "El destinatario fue eliminado correctamente.",
        confirmButtonColor: "#7d1111",
      });

    } catch (error: any) {
      // 🔐 BLOQUEO POR DESTINATARIO DEFAULT
      if (error.response?.status === 403) {
        Swal.fire({
          icon: "info",
          title: "No se puede eliminar",
          text: error.response.data?.msg || 
                "Este destinatario es el principal del cliente.",
          confirmButtonColor: "#7d1111",
        });
        return;
      }

      // ❌ ERROR REAL
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el destinatario.",
        confirmButtonColor: "#7d1111",
      });
    }
  };


  const [editingDestinatario, setEditingDestinatario] = useState<any>(null);

  const handleEditar = (dest: any) => {
    setEditingDestinatario(dest);
  };


  return (
    <UserDashboardLayout scrollable={true}>

      <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">
        
        <h1 className="text-3xl font-bold mb-2 text-red-900">Destinatarios Casilleros</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Destinatarios Casilleros
        </p>

        
        <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>


          <div className="relative z-10">
            
            <div className="mb-6 flex flex-col gap-3 border-b border-gray-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-950">
                  Gestión de destinatarios
                </p>

                <h3 className="text-xl font-bold text-gray-700 tracking-wide">
                  Búscar cliente o destinatario
                </h3>

                <p className="mt-1 text-xs font-semibold text-gray-500">
                  Consulta el cliente por nombre o código de casillero para administrar sus destinatarios.
                </p>
              </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span className="text-xs font-semibold text-gray-600">
                Búsqueda activa
              </span>
            </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-3">
                <label className="text-sm font-bold text-gray-700 tracking-wide px-1 mb-3 block">
                  Cliente / Código de casillero
                </label>

                <BuscarDestinatarios
                  value={busquedaCliente}
                  onChange={setBusquedaCliente}
                  onSelect={seleccionarCliente}
                />
              </div>
            </div>


            <div className="mt-6 flex justify-end border-t border-gray-200/70 pt-5">
              <button
                onClick={handleBuscarCliente}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:scale-[1.02] hover:from-red-900 hover:to-red-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-900/20"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>

        {clienteSeleccionado && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300 shadow-[0_0_12px_rgba(127,29,29,0.35)]" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5 pointer-events-none" />
            <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-gray-900/5 pointer-events-none" />

            <div className="relative p-6">
              <div className="mb-6 flex flex-col gap-4 border-b border-gray-200/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-950">
                    Destinatarios registrados
                  </p>

                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                    Destinatarios de{" "}
                    <span className="text-red-950">
                      {clienteSeleccionado.nombre}
                    </span>
                  </h3>

                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    Administra direcciones, datos de contacto y destinatarios asociados al cliente.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 transition-all duration-200 hover:scale-[1.02] hover:from-red-900 hover:to-red-950 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-700/20"
                >
                  + Crear destinatario
                </button>
              </div>

              <TablaDestinatarios
                lista={destinatarios}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
              />
            </div>
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
              await axios.put(
                `http://localhost:3000/api/destinatarios/${editingDestinatario.id}`,
                data
              );

              const r2 = await axios.get(
                `http://localhost:3000/api/destinatarios/${clienteSeleccionado.id}`
              );
              setDestinatarios(r2.data);

              setEditingDestinatario(null);
              Swal.fire("OK", "Destinatario actualizado correctamente", "success");
            }}
          />
        )}

      </div>
    </UserDashboardLayout>
  );
}
