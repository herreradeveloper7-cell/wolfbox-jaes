import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconSave from "../../assets/save-svgrepo-com.svg";
import iconFile from "../../assets/file-ui-svgrepo-com.svg";
import iconCancel from "../../assets/cancel-svgrepo-com.svg";
import iconUpload from "../../assets/upload-svgrepo-com.svg";
import PlantillaInfoCrearTracking from "../../components/tracking/PlantillaInfoCrearTracking";
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


    const [modalVisible, setModalVisible] = useState(false);

    const [paquetesTracking, setPaquetesTracking] = useState<PaqueteTracking[]>([]);

    const [mensajeTracking, setMensajeTracking] = useState<null | { hawb: string; contenido: string; peso: string }>(null);

    const [modalError, setModalError] = useState<string | null>(null);

    const obtenerResponsableSesion = () => {
        const stored =
        localStorage.getItem("usuario") ||
        sessionStorage.getItem("usuario") ||
        localStorage.getItem("cliente") ||
        sessionStorage.getItem("cliente") ||
        "{}";

        try {
            const usuario = JSON.parse(stored);
            return usuario.nombre || usuario.email || usuario.correo || "Usuario desconocido";
        } catch {
            return "Usuario desconocido";
        }
    };

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

            const { data } = await axios.get(`/api/paquetes/tracking/hawb/${hawb}`);

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

            if (ultimoEstado.estado === estadoFinal) {
            setModalError("Este estado ya ha sido asignado como último.");
            return;
            }

            const responsable = obtenerResponsableSesion();

            const fechaCompleta = `${fecha} ${horas}:${minutos}:00`;

            await axios.post("/api/paquetes/tracking/estado", {
            hawb,
            estado: estadoFinal,
            punto_control: puntoControl,
            observaciones,
            responsable,
            fecha: fechaCompleta
            });

            setPaquetesTracking((prev) => {
            const nuevoPaquete = {
                id: paquete.id || Date.now(),
                hawb: paquete.hawb,
                usuario: responsable,
                cliente: paquete.cliente || paquete.codigo_referencia || "Sin cliente",
                tienda: paquete.tienda || "Sin tienda",
                contenido: paquete.contenido || "Sin contenido",
                peso: paquete.peso?.toFixed(2) || "0.00",
            };

            const yaExiste = prev.some((item) => item.hawb === paquete.hawb);

            if (yaExiste) {
                return prev;
            }

            return [nuevoPaquete, ...prev];
            });

            setMensajeTracking({
            hawb: paquete.hawb,
            contenido: paquete.contenido || "Sin contenido",
            peso: paquete.peso?.toFixed(2) || "0.00",
            });

            setHawb("");   
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

    const [catalogoEstados, setCatalogoEstados] = useState<any[]>([]);
    const [oficinas, setOficinas] = useState<any[]>([]);
    const [puntosControl, setPuntosControl] = useState<any[]>([]);
    const [estados, setEstados] = useState<any[]>([]);

    useEffect(() => {
    cargarCatalogoEstados();
    }, []);

    const cargarCatalogoEstados = async () => {
    try {

        const { data } = await axios.get(
        "/api/paquetes/catalogo-estados"
        );

        setCatalogoEstados(data);

        const oficinasUnicas = [
        ...new Map(
            data.map((item: any) => [item.oficina_id, item])
        ).values(),
        ];

        setOficinas(oficinasUnicas);

    } catch (error) {
        console.error("Error cargando catálogo estados", error);
    }
    };

    const handleLimpiarFormulario = () => {
        const ahora = new Date();

        setHawb("");
        setObservaciones("");
        setHawbFocus(false);
        setObsFocus(false);

        setOficina("");
        setPuntoControl("");
        setEstadoFinal("");

        setEstados([]);
        setPuntosControl([]);
        setPaquetesTracking([]);

        setFechaAutomatica(true);
        setFecha(ahora.toISOString().split("T")[0]);
        setHoras(String(ahora.getHours()).padStart(2, "0"));
        setMinutos(String(ahora.getMinutes()).padStart(2, "0"));
    };

    interface PaqueteTracking {
    id: number;
    hawb: string;
    usuario: string;
    cliente: string;
    tienda: string;
    contenido: string;
    peso: string;
    }
      
    const navigate = useNavigate();
    return (
        <UserDashboardLayout scrollable>
            <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">
                <h1 className="text-3xl font-bold mb-2 text-red-900 tracking-wide">CREAR TRACKING</h1>
                <p className="text-xs text-gray-500 mb-6 flex items-center gap-2">
                <img src={iconHome} alt="Inicio" className="w-4 h-4" />
                <button
                    onClick={() => navigate("/dashboardUsuario")}
                    className="font-semibold hover:underline text-gray-600 cursor-pointer transition"
                >
                    Dashboard
                </button>
                <span>/</span> <span className="font-medium text-gray-700">Tracking</span>
                </p>

                <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

                <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-600 tracking-wide">
                      REGISTRO DE ESTADO DE PAQUETES
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Actualizar estado de tracking mediante información de oficina y control
                    </p>
                  </div>

                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                    <span className="text-xs font-semibold text-gray-600">
                      Módulo activo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm font-semibold text-gray-600 tracking-tighter">Fecha/Hora *</label>
                            <input
                            type="date"
                            className={`flex-1 px-3 py-2 rounded-xl text-sm border transition shadow-sm
                            ${fechaAutomatica 
                                ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                                : "bg-white text-gray-700 border-gray-200 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"}`}
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            disabled={fechaAutomatica}
                            />
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <label className="w-28 text-sm font-medium text-gray-600">Automática</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={fechaAutomatica}
                                onChange={(e) => setFechaAutomatica(e.target.checked)}
                            />
                            <div className="w-14 h-8 bg-red-500 peer-focus:outline-none peer-checked:bg-green-600 relative shadow-md rounded-full 
                            peer peer-checked:after:translate-x-full 
                            peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white 
                            after:border after:border-transparent after:rounded-full after:h-[26px] after:w-[26px] after:transition-all ">
                            </div>
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm font-medium text-gray-600">Horas *</label>
                            <input
                            type="number"
                            min="0"
                            max="23"
                            value={horas}
                            onChange={(e) => setHoras(e.target.value)}
                            disabled={fechaAutomatica}
                            className={`flex-1 px-3 py-2 rounded-xl text-sm border transition shadow-sm
                                ${fechaAutomatica 
                                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                                  : "bg-white text-gray-700 border-gray-200 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"}`}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm font-medium text-gray-600">Minutos *</label>
                            <input
                            type="number"
                            min="0"
                            max="59"
                            value={minutos}
                            onChange={(e) => setMinutos(e.target.value)}
                            disabled={fechaAutomatica}
                            className={`flex-1 px-3 py-2 rounded-xl text-sm border transition shadow-sm
                                ${fechaAutomatica 
                                  ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                                  : "bg-white text-gray-700 border-gray-200 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"}`}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                        <label className={`w-28 text-sm font-semibold text-gray-600 transition-colors duration-300 
                            ${oficina ? "text-red-900" : ""}`}
                            >
                            Oficina *
                        </label>
                        <select
                            className="flex-1 px-3 py-2 rounded-xl text-sm bg-white border border-gray-200 shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400 transition cursor-pointer"
                            value={oficina}
                            onChange={(e) => {
                            const oficinaSeleccionada = e.target.value;

                            setOficina(oficinaSeleccionada);
                            setPuntoControl("");
                            setEstadoFinal("");
                            setEstados([]);
                            setPaquetesTracking([]);

                            const puntos = catalogoEstados.filter(
                                (c: any) => c.oficina === oficinaSeleccionada
                            );

                            const puntosUnicos = [
                                ...new Map(
                                puntos.map((item: any) => [item.punto_control_id, item])
                                ).values(),
                            ];

                            setPuntosControl(puntosUnicos);
                            }}
                        >
                            <option value="">Seleccionar...</option>
                            {oficinas.map((o) => (
                            <option key={o.oficina_id} value={o.oficina}>
                                {o.oficina}
                            </option>
                            ))}
                        </select>
                        </div>

                        <div className="flex items-center gap-3">
                        <label className={`w-28 text-sm font-semibold text-gray-600 transition-colors duration-300 
                        ${puntoControl ? "text-red-900" : ""}`}
                        >
                            Punto Control *
                        </label>
                        <select
                            className={`flex-1 px-3 py-2 rounded-xl text-sm border shadow-sm transition cursor-pointer
                            ${!oficina 
                              ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                              : "bg-white text-gray-700 border-gray-200 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"}`}
                            value={puntoControl}
                            onChange={(e) => {

                            const punto = e.target.value;

                            setPuntoControl(punto);
                            setEstadoFinal("");
                            setPaquetesTracking([]);

                            const estadosFiltrados = catalogoEstados.filter(
                                (c: any) =>
                                c.oficina === oficina &&
                                c.punto_control === punto
                            );

                            setEstados(estadosFiltrados);
                            }}
                            disabled={!oficina}
                            >
                            <option value="">Seleccionar...</option>
                            {puntosControl.map((p) => (
                            <option key={p.punto_control_id} value={p.punto_control}>
                                {p.punto_control}
                            </option>
                            ))}
                        </select>
                        </div>

                        <div className="flex items-center gap-3">
                        <label className={`w-28 text-sm font-semibold text-gray-600 transition-colors duration-300 
                            ${estadoFinal ? "text-red-900" : ""}`}
                        >
                            Estado Final *
                        </label>
                        <select
                        className={`flex-1 px-3 py-2 rounded-xl text-sm border shadow-sm transition cursor-pointer
                            ${!puntoControl 
                              ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed" 
                              : "bg-white text-gray-700 border-gray-200 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"}`}
                        value={estadoFinal}
                        onChange={(e) => {
                            setEstadoFinal(e.target.value);
                            setPaquetesTracking([]);
                        }}
                        disabled={!puntoControl}
                        >
                        <option value="">Seleccionar...</option>
                        {estados.map((estado) => (
                        <option key={estado.estado_id} value={estado.estado}>
                            {estado.estado}
                        </option>
                        ))}
                        </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-5 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <label className="w-28 text-sm font-semibold text-gray-600 tracking-tighter pt-1">Procesar por:</label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2">
                                    <input 
                                    type="radio" 
                                    name="procesar"
                                    className="peer accent-red-900 w-4 h-4"
                                    defaultChecked 
                                    />
                                    <span className="text-gray-700 text-sm font-normal peer-checked:text-red-900 transition-colors duration-200">
                                        HAWB / Guía
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label 
                                className={`text-sm font-semibold text-gray-600 tracking-tighter transition-colors duration-300 
                                ${observaciones || obsFocus ? "text-red-900" : ""}`}
                            >
                                Observaciones
                            </label>
                            <textarea 
                                rows={4}
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                onFocus={() => setObsFocus(true)}
                                onBlur={() => setObsFocus(false)}
                                className={`w-full border rounded-xl px-3 py-3 text-sm shadow-sm transition-all duration-300 
                                ${obsFocus 
                                    ? "border-red-900 ring-2 ring-red-900/20 outline-none" 
                                    : "border-gray-200 focus:border-red-900 focus:ring-2 focus:ring-red-900/20 hover:border-gray-400"}`}
                            />
                        </div>

                        <div className="flex flex-col gap-3">
                            <label 
                                className={`text-sm font-semibold text-gray-600 transition-colors duration-300 
                                ${hawb || hawbFocus ? "text-red-900" : ""}`}
                            >
                                HAWB / Número de Guía *
                            </label>
                            <input 
                            type="text"
                            value={hawb}
                            onChange={(e) => setHawb(e.target.value)}
                            onFocus={() => setHawbFocus(true)}
                            onBlur={() => setHawbFocus(false)}
                            placeholder="Ingrese el número de HAWB o guía"
                            className={`w-full border rounded-xl px-4 py-3 text-sm shadow-sm transition-all duration-300 
                            ${hawbFocus 
                                ? "border-red-900 ring-2 ring-red-900/20 outline-none" 
                                : "border-gray-200 focus:border-red-900 focus:ring-2 focus:ring-red-900/20 hover:border-gray-400 bg-white"}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-4">
                    <button
                    type="button"
                    onClick={handleLimpiarFormulario}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm border cursor-pointer
                        bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                    >
                        <img src={iconCancel} alt="Cancelar" className="w-5 h-5" />
                        Limpiar
                    </button>

                    <button 
                    type="submit"
                    disabled={!botonGuardarActivo}
                    onClick={actualizarEstadoTracking}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md
                        ${botonGuardarActivo
                        ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                    >
                    <img src={iconSave} alt="Guardar" className="w-5 h-5" />
                    Guardar Tracking
                    </button>
                </div>
                </div>

                {mensajeTracking && (
                <div className="relative bg-green-50/95 border border-green-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden animate-fade-in">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 via-green-300 to-green-600"></div>
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-green-900">✓ Tracking creado exitosamente</h2>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm text-gray-700"><strong className="text-green-900">HAWB:</strong> {mensajeTracking.hawb}</p>
                          <p className="text-sm text-gray-700"><strong className="text-green-900">Contenido:</strong> {mensajeTracking.contenido}</p>
                          <p className="text-sm text-gray-700"><strong className="text-green-900">Peso:</strong> {mensajeTracking.peso} LBS</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setMensajeTracking(null)}
                        className="text-green-600 hover:text-green-900 text-2xl leading-none transition"
                      >
                        ×
                      </button>
                    </div>
                </div>
                )}

                <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

                <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-600 tracking-wide">
                      IMPORTAR ARCHIVO
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Carga masiva de trackings mediante archivo Excel (.xlsx)
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-900">
                    <strong>Nota:</strong> Si no se especifica fecha/hora en el archivo, se usarán los valores del formulario o automáticos
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    <div className="flex items-center w-full lg:w-[400px] relative">
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
                            className={`w-full px-3 py-2.5 text-sm rounded-xl border transition shadow-sm cursor-pointer flex items-center gap-2
                            ${inputFocus || archivo 
                              ? "border-red-900 bg-red-50 text-gray-700" 
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
                        >
                            <span className="truncate">{archivo ? archivo.name : "Seleccione archivo .xlsx"}</span>
                        </label>

                        {archivo && (
                          <button
                              type="button"
                              onClick={limpiarArchivo}
                              className="absolute right-2 flex items-center justify-center text-red-600 hover:text-red-900 transition"
                              title="Eliminar archivo"
                          >
                              ✕
                          </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-900 text-white text-sm font-semibold shadow-md hover:bg-red-950 hover:shadow-lg hover:scale-[1.02] transition cursor-pointer">
                        <img src={iconUpload} alt="Subir" className="w-5 h-5" />
                        Subir
                        </button>

                        <button 
                        onClick={() => setModalVisible(true)}                       
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-600 text-white text-sm font-semibold shadow-md hover:bg-gray-700 hover:shadow-lg hover:scale-[1.02] transition cursor-pointer"
                        >
                        <img src={iconFile} alt="Info" className="w-5 h-5" />
                        Plantilla
                        </button>
                    </div>
                </div>
                </div>

                {paquetesTracking.length > 0 && (
                <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

                <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-600 tracking-wide">
                      HISTORIAL DE TRACKINGS
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Últimos paquetes procesados
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-sm border-separate border-spacing-y-2">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr className="bg-gray-50 hover:bg-gray-100 transition">
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">HAWB</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Cliente</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Tienda</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Contenido</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Peso</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paquetesTracking.map((paquete) => (
                        <tr key={paquete.id} className="bg-white hover:bg-gray-50 transition border border-gray-200 rounded-lg">
                            <td className="px-4 py-3 text-gray-700 font-medium">{paquete.id}</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">{paquete.hawb}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[220px] truncate">{paquete.cliente}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{paquete.tienda}</td>
                            <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{paquete.contenido}</td>
                            <td className="px-4 py-3 text-gray-700 font-semibold">{paquete.peso} lb</td>
                            <td className="px-4 py-3 text-gray-600">{paquete.usuario}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>
                )}

                {modalVisible && <PlantillaInfoCrearTracking onClose={() => setModalVisible(false)} />}
                {modalError && (<ModalError mensaje={modalError} onClose={() => setModalError(null)} />
                )}
            </div>                
        </UserDashboardLayout>
    );
}
