import UserDashboardLayout from "../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../assets/home-svgrepo-com.svg";
import ModalCrearDestinatario from "../components/destianatariosCasilleros/ModalCrearDestinatario";
import TablaDestinatarios from "../components/destianatariosCasilleros/TablaDestinatarios";
import ModalEditarDestinatario from "../components/destianatariosCasilleros/ModalEditarDestinatario";
import { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function DestinatariosCasilleros() {

  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [destinatarios, setDestinatarios] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);

  let timer: any;

  const handleBuscarSugerencias = (valor: string) => {
    setBusquedaCliente(valor);

    clearTimeout(timer);

    if (valor.trim().length < 2) {
      setSugerencias([]);
      return;
    }

    timer = setTimeout(async () => {
      try {
        setLoadingSug(true);

        const { data } = await axios.get(
          `/api/clientes/buscar/${encodeURIComponent(valor)}`
        );

        console.log("🔎 sugerencias recibidas:", data);

        if (Array.isArray(data.clientes)) {
          setSugerencias(data.clientes);
        } else {
          setSugerencias([]);
        }

      } catch (err) {
        console.error("❌ Error buscando sugerencias:", err);
        setSugerencias([]);
      } finally {
        setLoadingSug(false);
      }
    }, 300);
  };


  const seleccionarCliente = async (cli: any) => {
    setClienteSeleccionado(cli);
    setBusquedaCliente(cli.codigo_referencia);
    setSugerencias([]);

    const r2 = await axios.get(`http://localhost:3000/api/destinatarios/${cli.id}`);
    setDestinatarios(r2.data);
  };

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
      confirmButtonText: "Sí, eliminar"
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:3000/api/destinatarios/${dest.id}`);

      const r2 = await axios.get(`http://localhost:3000/api/destinatarios/${clienteSeleccionado.id}`);
      setDestinatarios(r2.data);

      Swal.fire("Eliminado", "Destinatario eliminado correctamente", "success");

    } catch (error) {
      Swal.fire("Error", "No se pudo eliminar", "error");
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


        <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-red-900 mb-5">Buscar cliente</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative md:col-span-3">
              <input
                type="text"
                placeholder="Nombre o Código de Cliente"
                value={busquedaCliente}
                onChange={(e) => handleBuscarSugerencias(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-gray-800 w-full
                          focus:ring-2 focus:ring-red-900/40 outline-none transition"
              />
              {loadingSug && (
                <div className="absolute left-3 top-full mt-1 flex items-center gap-2 text-gray-500 text-sm">
                  <span className="loader-mini"></span> Buscando...
                </div>
              )}


              {sugerencias.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
                  {sugerencias.map((cli) => (
                    <div
                      key={cli.id}
                      onClick={() => seleccionarCliente(cli)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-gray-700 transition"
                    >
                      <span className="font-medium text-gray-800">{cli.nombre}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                        {cli.codigo_referencia}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleBuscarCliente}
              className="bg-red-900 hover:bg-red-950 text-white font-semibold px-6 py-2.5 rounded-lg
                        shadow-md hover:shadow-lg transition cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>


        {clienteSeleccionado && (
          <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              
              <h3 className="text-xl font-bold text-red-900">
                Destinatarios de: <span className="text-gray-700">{clienteSeleccionado.nombre}</span>
              </h3>

              <button
                onClick={() => setShowModal(true)}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
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
        )}


      </div>

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
            await axios.put(`http://localhost:3000/api/destinatarios/${editingDestinatario.id}`, data);

            const r2 = await axios.get(`http://localhost:3000/api/destinatarios/${clienteSeleccionado.id}`);
            setDestinatarios(r2.data);

            setEditingDestinatario(null);
            Swal.fire("OK", "Destinatario actualizado correctamente", "success");
          }}
        />
      )}


    </UserDashboardLayout>
  );
}
