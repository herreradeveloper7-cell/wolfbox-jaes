import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconCamera from "../../assets/camera-filled-svgrepo-com.svg";
import iconSave from "../../assets/save-svgrepo-com.svg";
import iconFile from "../../assets/file-ui-svgrepo-com.svg";
import iconTrash from "../../assets/trash-can-with-cover-from-side-view-svgrepo-com.svg";
import iconUpload from "../../assets/upload-svgrepo-com.svg";
import PlantillaInfoCrearTracking from "../../components/PlantillaInfoCrearTracking";
import ModalError from "../../components/ModalError";
import axios from "axios";
import { useEffect, useState} from "react";




export default function CrearTracking() {
    const [fecha, setFecha] = useState("");
    const [fechaAutomatica, setFechaAutomatica] = useState(false);
    const [horas, setHoras] = useState("");
    const [minutos, setMinutos] = useState("");
    const [oficina, setOficina] = useState("");
    const [puntoControl, setPuntoControl] = useState("");
    const [estadoFinal, setEstadoFinal] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [obsFocus, setObsFocus] = useState(false);
    const [hawb, setHawb] = useState("");
    const [hawbFocus, setHawbFocus] = useState(false);

    const botonGuardarActivo = oficina && puntoControl && estadoFinal && hawb;
    const [archivo, setArchivo] = useState<File | null>(null);
    const [inputFocus, setInputFocus] = useState(false);

    const opcionesEstadoFinal: Record<string, string[]> = {
    "Casilleros bodega": [
        "Llega bodega Bogotá",
        "Llega bodega Miami",
        "Reajuste liberado",
        "Digitado"
    ],
    "Otras operaciones": [
        "Facturado pendiente de pago",
        "Editada",
        "Reajuste aduanero",
        "Planilla de despacho",
        "Se retira del despacho",
        "Novedad",
        "Desbloqueado"
    ],
    "Tránsito aéreo": [
        "Consolidado",
        "Erolinea Miami",
        "Manifestado",
        "Arribo aeropuerto destino",
        "Pendiente de aduanas",
        "Faltante en descargue"
    ],
    "Tránsito terrestre": [
        "Entregado a transportadora",
        "Entregado a destinatario",
        "Novedad en tránsito",
        "Intento de entrega",
        "Devolución"
    ]
    };


    const [modalVisible, setModalVisible] = useState(false);

    const [paquetesTracking, setPaquetesTracking] = useState<PaqueteTracking[]>([]);

    const [mensajeTracking, setMensajeTracking] = useState<null | { hawb: string; contenido: string; peso: string }>(null);

    const [modalError, setModalError] = useState<string | null>(null);

    const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith(".xlsx")) {
        setArchivo(file);
    } else {
        setArchivo(null);
        alert("Solo se permiten archivos con extensión .xlsx");
    }
    };

    const limpiarArchivo = () => {
    setArchivo(null);
    };

    useEffect(() => {
        const ahora = new Date();
      
        const hoy = ahora.toISOString().split("T")[0];
        setFecha(hoy);
      
        const hora = String(ahora.getHours()).padStart(2, "0");
        const minutos = String(ahora.getMinutes()).padStart(2, "0");
      
        setHoras(hora);
        setMinutos(minutos);
    }, []);
      
    const actualizarEstadoTracking = async () => {
        try {
            if (!hawb.trim()) {
            setModalError("Debe ingresar un HAWB válido");
            return;
            }

            const { data } = await axios.get(`http://localhost:3000/api/paquetes/tracking/hawb/${hawb}`);

            if (!data?.length) {
            setModalError("El paquete no existe con el dato suministrado");
            return;
            }

            const paquete = data[0];
            const ultimoEstado = paquete.estados?.[0];

            if (!ultimoEstado) {
            setModalError("No se encontró historial válido para este paquete.");
            return;
            }

            // ❌ Evitar duplicar mismo estado consecutivo
            if (ultimoEstado.estado === estadoFinal) {
            setModalError("Este estado ya ha sido asignado como último.");
            return;
            }

            const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
            const responsable = usuario.nombre || "Usuario desconocido";

            // ✅ Construir la fecha manual correcta
            const fechaCompleta = `${fecha} ${horas}:${minutos}:00`;

            // ✅ Registrar NUEVO estado en historial
            await axios.post("http://localhost:3000/api/paquetes/tracking/estado", {
            hawb,
            estado: estadoFinal,
            punto_control: puntoControl,
            observaciones,
            responsable,
            fecha: fechaCompleta
            });

            setPaquetesTracking([
            {
                id: Date.now(),
                hawb: paquete.hawb,
                usuario: responsable,
                contenido: paquete.contenido || "Sin contenido",
                peso: paquete.peso?.toFixed(2) || "0.00",
            }
            ]);

            setMensajeTracking({
            hawb: paquete.hawb,
            contenido: paquete.contenido || "Sin contenido",
            peso: paquete.peso?.toFixed(2) || "0.00",
            });

            setHawb("");   // solo limpiar HAWB
            setHawbFocus(false);

        } catch (error: any) {
            console.log(error);
            if (error.response?.status === 404) {
            setModalError("El paquete no existe con el dato suministrado");
            } else {
            setModalError("Error al actualizar el estado del paquete.");
            }
        }
    };

    interface PaqueteTracking {
    id: number;
    hawb: string;
    usuario: string;
    contenido: string;
    peso: string;
    }
      
    const navigate = useNavigate();
    return (
        <UserDashboardLayout scrollable>
            <div className="text-gray-800 px-6 lg:px-10">
                <h1 className="text-3xl font-bold mb-2 text-red-900">Tracking</h1>
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
                <img src={iconHome} alt="Inicio" className="w-4 h-4" />
                <button
                    onClick={() => navigate("/dashboardUsuario")}
                    className="font-semibold hover:underline text-gray-700 cursor-pointer"
                >
                    Dashboard
                </button>
                &gt; Tracking
                </p>

                <div className="bg-gray-100 p-6 rounded-lg shadow-inner flex flex-col justify-between min-h-[100%]">
                <div className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1 w-[500px]">
                        <div className="flex items-center gap-3">
                            <label className="w-32 text-green-900 text-sm font-normal text-right">Fecha hora *</label>
                            <input
                            type="date"
                            className={`w-[250px] h-[42px] px-3 border rounded text-sm ${fechaAutomatica 
                                ? "bg-gray-100 text-gray-500 border-green-900 cursor-not-allowed" 
                                : "bg-white text-gray-700 border-green-900"}`}
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            disabled={fechaAutomatica}
                            />
                        </div>

                        <div className="flex items-center gap-3 py-3">
                            <label className="w-32 text-sm text-gray-700 font-normal text-right">Fecha automática</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={fechaAutomatica}
                                onChange={(e) => setFechaAutomatica(e.target.checked)}
                            />
                            <div className="w-14 h-8 bg-red-500 peer-focus:outline-none peer-checked:bg-green-500 relative shadow-md rounded-full 
                            peer peer-checked:after:translate-x-full 
                            peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white 
                            after:border after:border-transparent after:rounded-full after:h-[26px] after:w-[26px] after:transition-all ">
                            </div>
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-32 text-sm font-normal text-gray-700 text-right">Horas *</label>
                            <input
                            type="number"
                            min="0"
                            max="23"
                            value={horas}
                            onChange={(e) => setHoras(e.target.value)}
                            disabled={fechaAutomatica}
                            className={`w-[80px] h-[42px] px-3 border rounded text-sm transition 
                                ${fechaAutomatica 
                                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                                  : "bg-white text-gray-700 border-gray-400"}`}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-32 text-sm font-normal text-gray-700 text-right">Minutos *</label>
                            <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutos}
                            onChange={(e) => setMinutos(e.target.value)}
                            disabled={fechaAutomatica}
                            className={`w-[80px] h-[42px] px-3 border rounded text-sm transition 
                                ${fechaAutomatica 
                                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                                  : "bg-white text-gray-700 border-gray-400"}`}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                        <label className={`w-32 text-sm font-normal text-right transition-colors duration-300 
                            ${oficina ? "text-green-900" : "text-gray-700"}`}
                            >
                            Oficina *
                        </label>
                        <select
                            className="w-[350px] h-[42px] px-3 border rounded border-gray-400 text-gray-700 py-2 mt-1 transition-all duration-300 focus:outline-none focus:ring-0 focus:ring-green-900 focus:border-green-900"
                            value={oficina}
                            onChange={(e) => {
                            setOficina(e.target.value);
                            setPuntoControl("");
                            setEstadoFinal("");
                            }}
                        >
                            <option value="">Seleccionar</option>
                            <option value="Bogotá">Bogotá</option>
                        </select>
                        </div>

                        <div className="flex items-center gap-3">
                        <label className={`w-32 text-sm font-normal text-right transition-colors duration-300 
                        ${puntoControl ? "text-green-900" : "text-gray-700"}`}
                        >
                            Punto de control *
                        </label>
                        <select
                            className={`w-[350px] h-[42px] px-3 border rounded py-2 mt-1 transition-all duration-300 ease-in-out 
                            ${!oficina ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" : "bg-white text-gray-700 border-gray-400"}
                            focus:outline-none focus:ring-0 focus:ring-green-900 focus:border-green-900`}
                            value={puntoControl}
                            onChange={(e) => {
                                setPuntoControl(e.target.value);
                                setEstadoFinal("");
                            }}
                            disabled={!oficina}
                            >
                            <option value="">Seleccionar</option>
                            <option value="Casilleros bodega">Casilleros bodega</option>
                            <option value="Otras operaciones">Otras operaciones</option>
                            <option value="Tránsito aéreo">Tránsito aéreo</option>
                            <option value="Tránsito terrestre">Tránsito terrestre</option>
                        </select>
                        </div>

                        <div className="flex items-center gap-3">
                        <label className={`w-32 text-sm font-normal text-right transition-colors duration-300 
                            ${estadoFinal ? "text-green-900" : "text-gray-700"}`}
                        >
                            Estado final *
                        </label>
                        <select
                        className={`w-[350px] h-[42px] px-3 border rounded py-2 mt-1 transition-all duration-300 ease-in-out 
                            ${!puntoControl ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" : "bg-white text-gray-700 border-gray-400"}
                            focus:outline-none focus:ring-0 focus:ring-green-900 focus:border-green-900`}
                        value={estadoFinal}
                        onChange={(e) => setEstadoFinal(e.target.value)}
                        disabled={!puntoControl}
                        >
                        <option value="">Seleccionar</option>
                        {opcionesEstadoFinal[puntoControl]?.map((opcion, index) => (
                            <option key={index} value={opcion}>
                            {opcion}
                            </option>
                        ))}
                        </select>

                        </div>
                    </div>


                    <div className="flex flex-col gap-4 border-l border-gray-300 pl-6">
                        <div className="flex items-start gap-3">
                            <label className="w-32 text-sm font-normal text-right pt-1">Procesar por:</label>
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-2 mt-1">
                                    <input 
                                    type="radio" 
                                    name="procesar"
                                    className="peer accent-green-900 w-4 h-4"
                                    defaultChecked 
                                    /> 
                                    <span className="text-gray-700 text-sm font-normal peer-checked:text-green-900 transition-colors duration-200">
                                        HAWB / Referencia Guía importada.
                                    </span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="procesar"
                                        className="peer accent-green-900 w-4 h-4"
                                    />
                                    <span className="text-gray-700 text-sm font-normal peer-checked:text-green-900 transition-colors duration-200">
                                        Consolidado
                                    </span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="procesar"
                                        value="master"
                                        className="peer accent-green-900 w-4 h-4"
                                    />
                                    <span className="text-gray-700 text-sm font-normal peer-checked:text-green-900 transition-colors duration-200">
                                        Master
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <label 
                                className={`w-32 text-sm font-normal text-right pt-2 transition-colors duration-300 
                                ${observaciones || obsFocus ? "text-green-900" : "text-gray-700"}`}
                                >
                                Observaciones:
                            </label>
                            <textarea 
                                rows={4}
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                onFocus={() => setObsFocus(true)}
                                onBlur={() => setObsFocus(false)}
                                className={`w-[380px] border rounded px-3 py-2 text-sm transition-all duration-300 
                                ${obsFocus 
                                    ? "border-green-900 ring-0 ring-green-900 outline-none" 
                                    : "border-gray-400 focus:border-green-900 focus:ring-2 focus:ring-green-900"}`}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label 
                                className={`w-32 text-sm font-normal text-right transition-colors duration-300 
                                ${hawb || hawbFocus ? "text-green-900" : "text-gray-700"}`}

                            >
                                HAWB:
                            </label>
                            <input 
                            type="text"
                            value={hawb}
                            onChange={(e) => setHawb(e.target.value)}
                            onFocus={() => setHawbFocus(true)}
                            onBlur={() => setHawbFocus(false)}
                            className={`w-[380px] border rounded px-3 py-2 text-sm transition-all duration-300 
                            ${hawbFocus 
                                ? "border-green-900 ring-0 ring-green-900 outline-none" 
                                : "border-gray-400 focus:border-green-900 focus:ring-2 focus:ring-green-900"}`}
                            />
                        </div>

                        <div className="flex justify-end mt-4">
                            <button 
                            type="button"
                            className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded shadow-md flex items-center gap-2 cursor-pointer transition-all duration-200"
                            >
                            <img src={iconCamera} alt="Foto" className="w-5 h-5" />
                            Foto
                            </button>
                        </div>
                    </div>
                </div>

                </div>
                    <div className="mt-4 flex justify-end">
                        <button 
                        type="submit"
                        disabled={!botonGuardarActivo}
                        onClick={actualizarEstadoTracking}
                        className={`px-6 py-2 rounded flex items-center justify-center gap-2 transition-all duration-200
                            ${botonGuardarActivo
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-md"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                        >
                        <img src={iconSave} alt="Guardar" className="w-5 h-5" />
                        Guardar
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-md rounded-lg p-6 mt-8">
                    <hr className="border-t border-gray-300 opacity-50 mb-4" />

                    <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded mb-4 text-sm">
                        <strong className="text-gray-800">Nota:</strong> Recuerde que si en los campos del archivo no se encuentra la fecha u hora, esta se asignará según el formulario o automáticamente
                    </div>

                    <p className="text-sm text-gray-700 mb-2">
                        Importar archivo con el número HAWB/referencia (guía importada)
                    </p>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                        <div className="flex items-center w-full md:w-[500px] relative">
                            <input
                                id="file-upload"
                                type="file"
                                accept=".xlsx"
                                onChange={handleArchivoChange}
                                onFocus={() => setInputFocus(true)}
                                onBlur={() => setInputFocus(false)}
                                className="hidden" 
                            />

                            <label
                                htmlFor="file-upload"
                                className={`w-full px-3 py-2 text-sm text-gray-700 border rounded 
                                ${inputFocus || archivo ? "border-green-900" : "border-gray-300"} 
                                bg-white cursor-pointer transition-all duration-300`}
                            >
                                {archivo ? archivo.name : "Seleccione un archivo ..."}
                            </label>

                            <button
                                type="button"
                                onClick={limpiarArchivo}
                                className={`absolute right-0 top-0 h-full px-3 flex items-center justify-center 
                                ${archivo ? "bg-green-900" : "bg-gray-800"} text-white transition rounded-r`}
                            >
                                <img src={iconTrash} alt="Eliminar" className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-10">
                            <button className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded shadow-md flex items-center gap-2 text-sm transition-all cursor-pointer">
                            <img src={iconUpload} alt="Subir" className="w-4 h-4" />
                            Subir archivo
                            </button>

                            <button 
                            onClick={() => setModalVisible(true)}                       
                            className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded shadow-md flex items-center gap-2 text-sm transition-all cursor-pointer"
                            >
                            <img src={iconFile} alt="Info" className="w-4 h-4" />
                            Información plantilla
                            </button>
                        </div>
                    </div>
                </div>

                {mensajeTracking && (
                <div className="bg-green-100 border border-green-300 text-green-900 rounded-lg p-4 mb-6 shadow-md animate-fade-in">
                    <h2 className="text-lg font-bold">¡Tracking creado exitosamente!</h2>
                    <p className="mt-1"><strong>HAWB:</strong> {mensajeTracking.hawb}</p>
                    <p><strong>Contenido:</strong> {mensajeTracking.contenido}</p>
                    <p><strong>Peso:</strong> {mensajeTracking.peso} LBS</p>
                    <div className="text-right">
                    <button
                        onClick={() => setMensajeTracking(null)}
                        className="mt-2 text-sm text-green-700 underline hover:text-green-900 transition"
                    >
                        Cerrar mensaje
                    </button>
                    </div>
                </div>
                )}


                <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded mb-4 text-sm mt-4">
                    <table className="mt-6 w-full text-sm border border-gray-300 shadow-sm rounded">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">HAWB</th>
                        <th className="p-2 text-left">Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paquetesTracking.map((paquete) => (
                        <tr key={paquete.id} className="border-t text-gray-700">
                            <td className="p-2">{paquete.id}</td>
                            <td className="p-2">{paquete.hawb}</td>
                            <td className="p-2">{paquete.usuario}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                {modalVisible && <PlantillaInfoCrearTracking onClose={() => setModalVisible(false)} />}
                {modalError && (<ModalError mensaje={modalError} onClose={() => setModalError(null)} />
                )}
            </div>                
        </UserDashboardLayout>
    );
}