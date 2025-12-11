import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TablaResultadosTracking from "../../components/TablaResultadosTracking";
import { ResultadoTracking } from "../../types/tracking";
import ModalEditarTracking from "../../components/ModalEditarTracking";



const ConsultarTracking = () => {

    const [hawb, setHawb] = useState("");
    const [consolidado, setConsolidado] = useState("");
    const [mawb, setMawb] = useState("");
    const [referencia, setReferencia] = useState("");
    const [estadoGuia, setEstadoGuia] = useState("");
    const [resultados, setResultados] = useState<ResultadoTracking[]>([]);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [trackingSeleccionado, setTrackingSeleccionado] = useState<any>(null);


    const handleConsultar = async () => {
    try {
        const response = await axios.get(
        `http://localhost:3000/api/paquetes/tracking/hawb/${hawb}`
        );

        console.log("✅ DATA API:", response.data);

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

                <div className="bg-gray-100 rounded-lg shadow  mb-6 border border-gray-300">
                    <h2 className="text-sm font-bold p-6 text-gray-700">FILTROS DE BÚSQUEDA</h2>
                    <div className="bg-white border border-gray-200 px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <label 
                                className={`w-24 text-right text-sm transition-colors duration-300 
                                ${hawb ? "text-green-900 font-semibold" : "text-gray-700"}`}
                                >
                                    HAWB
                                </label>
                                <input
                                    type="text"
                                    className="w-full max-w-[250px] min-w-0 border border-gray-300 rounded px-2 py-1 text-sm text-gray-700
                                    transition-all duration-300 focus:outline-none focus:ring-0 focus:border-green-900"
                                    value={hawb}
                                    onChange={(e) => setHawb(e.target.value)}
                                    placeholder="Ingrese HAWB"
                                />
                            </div>
                            <div className="flex items-center gap-2"> 
                                <label 
                                className={`w-24 text-right text-sm transition-colors duration-300 
                                ${consolidado ? "text-green-900 font-semibold" : "text-gray-700"}`}
                                >
                                    Consolidado
                                </label>
                                <input
                                type="text"
                                className="w-full max-w-[250px] min-w-0 border border-gray-300 rounded px-2 py-1 text-sm text-gray-700
                                transition-all duration-300 focus:outline-none focus:ring-0 focus:border-green-900"
                                value={consolidado}
                                onChange={(e) => setConsolidado(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label 
                                className={`w-24 text-right text-sm transition-colors duration-300 
                                ${mawb ? "text-green-900 font-semibold" : "text-gray-700"}`}
                                >
                                    MAWB
                                </label>
                                <input
                                type="text"
                                className="w-full max-w-[250px] border border-gray-300 rounded px-2 py-1 text-sm text-gray-700
                                transition-all duration-300 focus:outline-none focus:ring-0 focus:border-green-900"
                                value={mawb}
                                onChange={(e) => setMawb(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label 
                                className={`w-24 text-right text-sm transition-colors duration-300 
                                ${referencia ? "text-green-900 font-semibold" : "text-gray-700"}`}
                                >
                                    Referencia
                                </label>
                                <input
                                type="text"
                                className="w-full max-w-[250px] border border-gray-300 rounded px-2 py-1 text-sm text-gray-700
                                transition-all duration-300 focus:outline-none focus:ring-0 focus:border-green-900"
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label 
                                className={`w-24 text-right text-sm transition-colors duration-300 
                                ${estadoGuia ? "text-green-900 font-semibold" : "text-gray-700"}`}
                                >
                                    Estado de guía</label>
                                <input
                                type="text"
                                className="w-full max-w-[250px] border border-gray-300 rounded px-2 py-1 text-sm text-gray-700
                                transition-all duration-300 focus:outline-none focus:ring-0 focus:border-green-900"
                                value={estadoGuia}
                                onChange={(e) => setEstadoGuia(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-end justify-end p-6">
                        <button 
                        className="bg-red-900 text-white px-4 py-2 rounded hover:bg-red-950 text-sm flex items-center gap-2"
                        onClick={handleConsultar}
                        disabled={!hawb.trim()}
                        >
                            Buscar
                        </button>
                    </div>
                    {error && <p className="text-red-600">{error}</p>}
                </div>

                <div className="bg-white ro unded-lg shadow border rounded-lg border-gray-300">
                    <TablaResultadosTracking resultados={resultados} onEditar={handleEditar} />
                </div>
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