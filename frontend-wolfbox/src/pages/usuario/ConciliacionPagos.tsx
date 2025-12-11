import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconSearch from "../../assets/search-alt-svgrepo-com.svg";
import iconCancel from "../../assets/cancel-svgrepo-com.svg";
import TablaConciliacionPagos from "../../components/conciliacionPagos/TablaConciliacionPagos";


export default function ConciliacionPago() {
    const navigate = useNavigate();

    const [filtros, setFiltros] = useState({
        fechaInicio: "",
        fechaFin: "",
        referencia: "",
        tracking: "",
        usuario: "",
        cliente: ""
    });

    const [resultados, setResultados] = useState<any[]>([]);

    const handleBuscar = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filtros).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await fetch(`http://localhost:3000/api/conciliacion?${params.toString()}`);
            const data = await res.json();
            setResultados(data);
        } catch (error) {
        }
    };

    const handleCancelar = () => {
        setFiltros({
            fechaInicio: "",
            fechaFin: "",
            referencia: "",
            tracking: "",
            usuario: "",
            cliente: ""
        });
        setResultados([]);
    };

    const handleSubirComprobante = (id: number, archivo: File) => {
    console.log("Subiendo archivo para", id, archivo);
    };

    const handleAutorizar = (id: number) => {
    console.log("Autorizando", id);
    };

    const handleRechazar = (id: number) => {
    console.log("Rechazando", id);
    };

    const [solicitudes, setSolicitudes] = useState<any[]>([]);


    return (
        <UserDashboardLayout scrollable>
            <div className="text-gray-800 px-4 sm:px-6 lg:px-10 py-4 animate-fade-in overflow-x-hidden">
                <h1 className="text-3xl font-bold mb-2 text-red-900">Conciliación de Pago</h1>
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
                    <img src={iconHome} alt="Inicio" className="w-4 h-4" />
                    <button
                        onClick={() => navigate("/dashboardUsuario")}
                        className="font-semibold hover:underline text-gray-700 cursor-pointer"
                    >
                        Dashboard
                    </button>
                    &gt; Conciliación de Pago
                </p>

                <div className="bg-white shadow-md rounded-lg p-6 mb-6">

                    <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Filtros de Conciliación</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Fecha Inicial</label>
                            <input
                                type="date"
                                className="border px-3 py-1 rounded"
                                value={filtros.fechaInicio}
                                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Fecha Final</label>
                            <input
                                type="date"
                                className="border px-3 py-1 rounded"
                                value={filtros.fechaFin}
                                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Referencia</label>
                            <input
                                type="text"
                                className="border px-3 py-1 rounded"
                                value={filtros.referencia}
                                onChange={(e) => setFiltros({ ...filtros, referencia: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Tracking</label>
                            <input
                                type="text"
                                className="border px-3 py-1 rounded"
                                value={filtros.tracking}
                                onChange={(e) => setFiltros({ ...filtros, tracking: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium">Cliente / Casillero</label>
                            <input
                                type="text"
                                className="border px-3 py-1 rounded"
                                value={filtros.cliente}
                                onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col">
                            <input
                                type="text"
                                className="border px-3 py-1 rounded"
                                value={filtros.usuario}
                                onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value })}
                            />
                        </div>

                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            onClick={handleCancelar}
                            className="flex items-center gap-2 bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded"
                        >
                            <img src={iconCancel} className="w-4 h-4" /> Cancelar
                        </button>

                        <button
                            onClick={handleBuscar}
                            className="flex items-center gap-2 bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded"
                        >
                            <img src={iconSearch} className="w-4 h-4" /> Buscar
                        </button>
                    </div>
                </div>

                <TablaConciliacionPagos
                    solicitudes={solicitudes}
                    onSubirComprobante={handleSubirComprobante}
                    onAutorizar={handleAutorizar}
                    onRechazar={handleRechazar}
                />


            </div>
        </UserDashboardLayout>
    );
}
