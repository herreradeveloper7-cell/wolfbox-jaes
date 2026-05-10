import { useState } from "react";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import BuscarClientes from "../../components/clientes/BuscarClientes";
import iconHome from "../../assets/home-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";
import ModalCliente from "../../components/clientes/ModalCliente";
import axios from "axios";
import Swal from "sweetalert2";



export default function VerClientes() {

    const navigate = useNavigate();
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
    const [showModalCliente, setShowModalCliente] = useState(false);

    const handleBuscarCliente = async () => {
    const texto = busquedaCliente.trim();

    if (!texto) {
        Swal.fire({
        icon: "warning",
        title: "Campo vacío",
        text: "Escribe el nombre o código de casillero del cliente.",
        confirmButtonColor: "#5a0c0c",
        });
        return;
    }

    try {
        const { data } = await axios.get(
        `http://localhost:3000/api/clientes/buscar/${encodeURIComponent(texto)}`
        );

        const clientes = data.clientes || [];

        if (clientes.length === 0) {
        Swal.fire({
            icon: "info",
            title: "Cliente no encontrado",
            text: "No se encontró ningún cliente con esa información.",
            confirmButtonColor: "#5a0c0c",
        });
        return;
        }

        const cliente = clientes[0];

        setClienteSeleccionado(cliente);
        setBusquedaCliente(cliente.codigo_referencia);
        setShowModalCliente(true);
    } catch (error) {
        console.error("❌ Error buscando cliente:", error);

        Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo consultar el cliente.",
        confirmButtonColor: "#5a0c0c",
        });
    }
    };
    

    return (
        <UserDashboardLayout scrollable>
        <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">
                    <h1 className="text-3xl font-bold mb-2 text-red-900">Clientes Casilleros</h1>

            <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
            <img src={iconHome} alt="Inicio" className="w-4 h-4" />
            <button
                onClick={() => navigate("/dashboardUsuario")}
                className="font-semibold hover:underline text-gray-700 cursor-pointer"
            >
                Dashboard
            </button>
            &gt; Clientes Casilleros
            </p>

            <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>


                <div className="relative z-10">
                
                    <div className="mb-6 flex flex-col gap-3 border-b border-gray-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-red-950">
                            Gestión de clientes
                        </p>

                        <h3 className="text-xl font-bold text-gray-600 tracking-wide">
                            Búscar cliente
                        </h3>

                        <p className="mt-1 text-xs font-semibold text-gray-500">
                            Consulta el cliente por nombre o código de casillero para administrar su información.
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
                            <label className="text-sm font-bold text-gray-600 tracking-wide px-1 mb-3 block">
                            Cliente / Código de casillero
                            </label>

                            <BuscarClientes
                            value={busquedaCliente}
                            onChange={setBusquedaCliente}
                            onSelect={(cliente) => {
                                setClienteSeleccionado(cliente);
                                setBusquedaCliente(cliente.codigo_referencia);
                                setShowModalCliente(true);
                            }}
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
        </div>

        {showModalCliente && clienteSeleccionado && (
        <ModalCliente
            cliente={clienteSeleccionado}
            onClose={() => {
            setShowModalCliente(false);
            setClienteSeleccionado(null);
            setBusquedaCliente("");
            }}
        />
        )}
        </UserDashboardLayout>
    );
}
