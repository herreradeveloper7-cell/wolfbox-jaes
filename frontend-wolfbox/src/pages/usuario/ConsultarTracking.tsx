import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TablaResultadosTracking from "../../components/tracking/TablaResultadosTracking";
import { ResultadoTracking } from "../../types/tracking";
import ModalEditarTracking from "../../components/tracking/ModalEditarTracking";



const ConsultarTracking = () => {

    const [hawb, setHawb] = useState("");
    const [referencia, setReferencia] = useState("");
    const [estadoGuia, setEstadoGuia] = useState("");
    const [estadosCatalogo, setEstadosCatalogo] = useState<any[]>([]);
    const [resultados, setResultados] = useState<ResultadoTracking[]>([]);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [trackingSeleccionado, setTrackingSeleccionado] = useState<any>(null);


    const handleConsultar = async () => {
        try {
            const response = await axios.get(
            "http://localhost:3000/api/guias/consultar-tracking",
            {
                params: {
                hawb,
                referencia,
                estadoGuia,
                },
            }
            );

            setResultados(response.data);
            setError("");
        } catch (err) {
            console.error("❌ ERROR API:", err);
            setError("No se encontraron resultados o hubo un error");
            setResultados([]);
        }
    };

    const handleEditar = (tracking: any) => {
        setTrackingSeleccionado(tracking);
        setIsModalOpen(true);
    };

    useEffect(() => {
    const cargarEstados = async () => {
        try {
        const { data } = await axios.get(
            "http://localhost:3000/api/paquetes/catalogo-estados"
        );

        const estadosUnicos = [
        ...new Map(data.map((item: any) => [item.estado_id, item])).values(),
        ];

        setEstadosCatalogo(estadosUnicos);
        } catch (error) {
        console.error("Error al cargar estados:", error);
        }
    };

    cargarEstados();
    }, []);



    const navigate = useNavigate();
    return (
        <UserDashboardLayout scrollable>
            <div className="text-gray-800 px-6 lg:px-10">
                <h1 className="text-3xl font-bold mb-2 text-red-900">Consulta de Tracking</h1>
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
                <img src={iconHome} alt="Inicio" className="w-4 h-4" />
                <button
                    onClick={() => navigate("/dashboardUsuario")}
                    className="font-semibold hover:underline text-gray-700 cursor-pointer"
                >
                    Dashboard
                </button>
                &gt; Consulta de Tracking
                </p>

                <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl mb-8 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

                    <div className="px-6 py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-700">Filtros de búsqueda</h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Busca por HAWB, consolidado, hawb, referencia o estado de guía.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="flex flex-col gap-2">
                                <label
                                className={`text-sm font-semibold transition-colors duration-300 ${hawb ? "text-red-900" : "text-gray-600"}`}
                                >
                                    HAWB
                                </label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-700 bg-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                                    value={hawb}
                                    onChange={(e) => setHawb(e.target.value)}
                                    placeholder="Ingrese HAWB"
                                />
                            </div>



                            <div className="flex flex-col gap-2">
                                <label
                                className={`text-sm font-semibold transition-colors duration-300 ${referencia ? "text-red-900" : "text-gray-600"}`}
                                >
                                    Referencia
                                </label>
                                <input
                                type="text"
                                className="w-full border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-700 bg-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                                placeholder="Ingrese referencia"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label
                                className={`text-sm font-semibold transition-colors duration-300 ${estadoGuia ? "text-red-900" : "text-gray-600"}`}
                                >
                                    Estado de guía
                                </label>
                                <select
                                className="w-full border border-gray-200 rounded-2xl px-3 py-3 text-sm text-gray-700 bg-white shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                                value={estadoGuia}
                                onChange={(e) => setEstadoGuia(e.target.value)}
                                >
                                <option value="">Todos los estados</option>

                                {estadosCatalogo.map((item: any) => (
                                <option key={item.estado_id} value={item.estado}>
                                    {item.estado}
                                </option>
                                ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {error ? (
                            <p className="text-sm text-red-600">{error}</p>
                        ) : (
                            <p className="text-sm text-gray-500">Completa al menos un filtro para buscar.</p>
                        )}

                        <button
                        className="inline-flex items-center justify-center rounded-2xl bg-red-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-950 transition disabled:bg-gray-300 disabled:text-gray-500"
                        onClick={handleConsultar}
                        disabled={!hawb.trim() && !referencia.trim() && !estadoGuia.trim()}
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                <TablaResultadosTracking resultados={resultados} onEditar={handleEditar} />
            </div>
        <ModalEditarTracking
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            trackingActual={trackingSeleccionado}
            onSuccess={() => handleConsultar()} 
        />
        </UserDashboardLayout>
    )
}

export default ConsultarTracking;