import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconSearch from "../../assets/search-alt-svgrepo-com.svg";
import iconCancel from "../../assets/cancel-svgrepo-com.svg";
import TablaConciliacionPagos from "../../components/conciliacionPagos/TablaConciliacionPagos";
import Swal from "sweetalert2";
import { generarPdfSolicitud } from "../../utils/generarPdfSolicitud";
import axios from "axios";

export default function ConciliacionPago() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const solicitudNotificacion = searchParams.get("solicitud") || "";

    const [filtros, setFiltros] = useState({
        fechaInicio: "",
        fechaFin: "",
        cliente: "",
        solicitud: ""
    });


    const [clientes, setClientes] = useState<any[]>([]);
    const [mostrarClientes, setMostrarClientes] = useState(false);

    const buscarConFiltros = async (filtrosBusqueda = filtros) => {
        
        try {
            const params = new URLSearchParams();

            Object.entries(filtrosBusqueda).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const res = await fetch(`/api/conciliacion?${params.toString()}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                setSolicitudes(data);
            } else {
                setSolicitudes([]);
            }

        } catch (error) {
            console.error("Error buscando conciliación", error);
            setSolicitudes([]);
        }
    };

    const handleBuscar = () => buscarConFiltros();

    useEffect(() => {
        if (!solicitudNotificacion) return;

        const filtrosNotificacion = {
            fechaInicio: "",
            fechaFin: "",
            cliente: "",
            solicitud: solicitudNotificacion,
        };

        setFiltros(filtrosNotificacion);
        buscarConFiltros(filtrosNotificacion);
    }, [solicitudNotificacion]);

    const handleImprimir = async (sol:any) => {

        try {

            const { data } = await axios.get(
            `/api/solicitudes/pdf-data/${sol.solicitud_id}`
            );

            generarPdfSolicitud(data.solicitud);

        } catch (error) {

            console.error(error);

            Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo generar el PDF"
            });

        }

    };

    const buscarCliente = async (texto: string) => {

        setFiltros(prev => ({
            ...prev,
            cliente: texto
        }));

        if (texto.length < 2) {
            setClientes([]);
            setMostrarClientes(false);
            return;
        }

        try {

            const res = await fetch(`/api/clientes/buscar/${texto}`);
            const data = await res.json();

            if (data.ok) {
                setClientes(data.clientes);
                setMostrarClientes(true);
            } else {
                setClientes([]);
                setMostrarClientes(false);
            }

        } catch (error) {
            console.error("Error buscando clientes", error);
            setClientes([]);
            setMostrarClientes(false);
        }
    };

    const handleCancelar = () => {
        setFiltros({
            fechaInicio: "",
            fechaFin: "",
            cliente: "",
            solicitud: ""
        });

        setSearchParams({});
        setSolicitudes([]);
    };

    const handleSubirComprobante = async (id: number, archivo: File) => {
    try {
        const formData = new FormData();
        formData.append("comprobante", archivo);

        const res = await fetch(`/api/conciliacion/subir-comprobante/${id}`, {
        method: "POST",
        body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
        throw new Error(data.mensaje || "Error al subir comprobante");
        }

        setSolicitudes((prev) =>
        prev.map((s) =>
            s.solicitud_id === id
            ? { ...s, comprobante: data.url } 
            : s
        )
        );

        Swal.fire({
        icon: "success",
        title: "Comprobante subido",
        text: "El archivo se cargó correctamente",
        confirmButtonColor: "#991b1b"
        });

    } catch (error) {
        console.error(error);

        Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "No se pudo subir el comprobante"
        });
    }
    };

    const handleAutorizar = async (id: number, estadoActual?: string) => {

    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

    if (estadoActual === "Autorizado") {

    const confirmacion = await Swal.fire({
        title: "Quitar autorización",
        text: "¿Desea quitar el estado Desbloqueado?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, quitar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#991b1b",
        cancelButtonColor: "#6B7280",
        background: "#ffffff",
        color: "#111827",
        });

        if (!confirmacion.isConfirmed) return;

        await axios.put(`/api/conciliacion/quitar-autorizacion/${id}`, {
        responsable: usuario.nombre
    });

    } else {

    const confirmacion = await Swal.fire({
        title: "Autorizar pago",
        text: "¿Desea autorizar este pago?",
        icon: "question",

        showCancelButton: true,

        confirmButtonText: "Autorizar",
        cancelButtonText: "Cancelar",

        confirmButtonColor: "#5B000D",
        cancelButtonColor: "#6B7280",

        background: "#ffffff",
        color: "#111827",
    });

        if (!confirmacion.isConfirmed) return;

        await axios.put(`/api/conciliacion/autorizar/${id}`, {
        responsable: usuario.nombre
        });

    }
    await handleBuscar();

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

            <div className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5 pointer-events-none" />
            <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-gray-900/5 pointer-events-none" />
            
            <div className="relative p-6">
                <div className="relative mb-6 flex flex-col gap-3 border-b border-gray-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-950">
                        Módulo financiero
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-700">
                        Filtros de Conciliación
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                        Consulta solicitudes por fecha, cliente, casillero o número de solicitud.
                    </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                        <span className="text-xs font-semibold text-gray-600">
                            Módulo activo
                        </span>
                    </div>
                </div>

                <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                    <label className="text-sm font-bold text-gray-700">
                        Fecha inicial
                    </label>

                    <input
                        type="date"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                        value={filtros.fechaInicio}
                        onChange={(e) =>
                        setFiltros({ ...filtros, fechaInicio: e.target.value })
                        }
                    />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                    <label className="text-sm font-bold text-gray-700">
                        Fecha final
                    </label>

                    <input
                        type="date"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                        value={filtros.fechaFin}
                        onChange={(e) =>
                        setFiltros({ ...filtros, fechaFin: e.target.value })
                        }
                    />
                    </div>

                    <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                    {mostrarClientes && clientes.length > 0 && (
                        <div className="absolute left-5 right-5 top-[92px] z-[9999] max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
                        {clientes.map((c: any) => (
                            <div
                            key={c.id}
                            className="cursor-pointer px-4 py-3 text-sm transition hover:bg-red-50"
                            onClick={() => {
                                setFiltros({
                                ...filtros,
                                cliente: c.codigo_referencia,
                                });

                                setMostrarClientes(false);
                            }}
                            >
                            <span className="font-semibold text-red-950">
                                {c.codigo_referencia}
                            </span>
                            <span className="text-gray-400"> — </span>
                            <span className="font-semibold text-gray-700">{c.nombre}</span>
                            </div>
                        ))}
                        </div>
                    )}

                    <label className="text-sm font-bold text-gray-700">
                        Cliente / Casillero
                    </label>

                    <input
                        type="text"
                        placeholder="Buscar cliente o casillero"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                        value={filtros.cliente}
                        onChange={(e) => buscarCliente(e.target.value)}
                    />
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                    <label className="text-sm font-bold text-gray-700">
                        Número de solicitud
                    </label>

                    <input
                        type="text"
                        placeholder="Ej: 1025"
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                        value={filtros.solicitud}
                        onChange={(e) =>
                        setFiltros({ ...filtros, solicitud: e.target.value })
                        }
                    />
                    </div>
                </div>

                <div className="relative mt-6 flex flex-col gap-3 border-t border-gray-200/70 pt-5 sm:flex-row sm:justify-end">
                    <button
                    onClick={handleCancelar}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300/40 cursor-pointer"
                    >
                    <img src={iconCancel} className="h-4 w-4" />
                    Cancelar
                    </button>

                    <button
                    onClick={handleBuscar}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:scale-[1.02] hover:from-red-900 hover:to-red-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 cursor-pointer"
                    >
                    <img src={iconSearch} className="h-4 w-4" />
                    Buscar
                    </button>
                </div>
                
                </div>

                </div>

                    <TablaConciliacionPagos
                        solicitudes={solicitudes}
                        solicitudDestacada={solicitudNotificacion ? Number(solicitudNotificacion) : null}
                        onSubirComprobante={handleSubirComprobante}
                        onAutorizar={handleAutorizar}
                        onImprimir={handleImprimir}
                    />
                </div>

        </UserDashboardLayout>
    );
}
