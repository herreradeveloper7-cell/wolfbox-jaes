import { useEffect, useState } from "react";
import axios from "axios";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import iconHome from "../../../assets/home-svgrepo-com.svg";
import Swal from "sweetalert2";

export default function AgruparSolicitud() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [solicitud, setSolicitud] = useState<any>(null);
    const [hawbsSolicitud, setHawbsSolicitud] = useState<string[]>([]);
    const [hawbsSeleccionados, setHawbsSeleccionados] = useState<string[]>([]);
    const [inputHawb, setInputHawb] = useState("");
    const [modalAbierto, setModalAbierto] = useState(false);
    const [cargando, setCargando] = useState(false);
    const quitarHawb = (hawb: string) => {
    setHawbsSeleccionados(prev => prev.filter(h => h !== hawb));
    };


  useEffect(() => {
  if (!id) return;

    const cargarSolicitud = async () => {
        try {
        const { data } = await axios.get(`/api/solicitudes/detalle/${id}`);

        setSolicitud(data.solicitud);

        const hawbs = data.paquetes
            .map((p: any) => p.hawb)
            .filter((h: string) => !h.endsWith("G"));

        setHawbsSolicitud(hawbs);

        } catch (error) {
        Swal.fire("Error", "No se pudo cargar la solicitud", "error");
        }
    };

  cargarSolicitud();
}, [id]);


    const confirmarAgrupacion = async () => {
    if (hawbsSeleccionados.length < 2) {
        return Swal.fire(
        "Mínimo requerido",
        "Debe seleccionar al menos 2 paquetes",
        "warning"
        );
    }

    setModalAbierto(true);
};

const ejecutarAgrupacion = async () => {
    setCargando(true);
    try {

        const { data } = await axios.post(
        `/api/solicitudes/agrupar/${id}`,
        { hawbs: hawbsSeleccionados }
        );

        const urlEtiqueta = `/api/solicitudes/etiqueta/${data.hawb_agrupado}`;

        window.open(urlEtiqueta, "_blank");

        setModalAbierto(false);

        Swal.fire({
            icon: "success",
            title: "¡Paquetes agrupados!",
            text: `Guía generada: ${data.hawb_agrupado}`,
            confirmButtonText: "OK",
            confirmButtonColor: "#991b1b",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(() => {
            navigate(-1);
        });

    } catch (error: any) {

        setCargando(false);
        
        Swal.fire(
            "Error",
            error.response?.data?.mensaje || "No se pudo agrupar",
            "error"
        );

    }
};

    if (!id) {
    return (
        <UserDashboardLayout scrollable>
        <div className="p-6 text-red-700 font-semibold">
            ID de solicitud inválido
        </div>
        </UserDashboardLayout>
    );
    }

    return (
    <UserDashboardLayout scrollable>
        <div className="px-6 lg:px-10 pb-10 animate-fade-in text-gray-800">
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

        {!solicitud ? (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-10 text-center shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-red-900/20 border-r-red-900 border-t-red-900" />
            <p className="font-semibold text-gray-800">
                Cargando información de la solicitud...
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-500">
                Consultando HAWBs disponibles para agrupar.
            </p>
            </div>
        ) : (
            <>
            <section className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300 shadow-[0_0_12px_rgba(127,29,29,0.35)]" />
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5" />
                <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-gray-900/5" />

                <div className="relative p-6">
                <div className="mb-6 border-b border-gray-200/70 pb-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-950">
                    Información de solicitud
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                    Datos principales
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Cliente
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                        {solicitud.cliente}
                    </p>
                    </div>

                    <div className="rounded-2xl border border-red-900/10 bg-gradient-to-br from-red-50/80 to-white p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Código casillero
                    </p>
                    <p className="mt-2 font-mono text-base font-semibold text-red-950">
                        {solicitud.codigo_referencia}
                    </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                        N° Solicitud
                    </p>
                    <p className="mt-2 font-mono text-base font-semibold text-gray-900">
                        #{solicitud.id}
                    </p>
                    </div>
                </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-950/5" />

                <div className="relative border-b border-gray-200/70 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-950">
                    HAWBs disponibles
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                    HAWBs de la solicitud
                    </h3>
                </div>

                <div className="relative p-5">
                    {hawbsSolicitud.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                        <p className="font-semibold text-gray-700">
                        No hay HAWBs disponibles
                        </p>
                    </div>
                    ) : (
                    <ul className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                        {hawbsSolicitud.map((h, i) => {
                        const seleccionado = hawbsSeleccionados.includes(h);

                        return (
                            <li
                            key={i}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200 ${
                                seleccionado
                                ? "border-green-200 bg-green-50 text-green-700 opacity-70"
                                : "border-gray-200 bg-white text-gray-700 hover:border-red-900/20 hover:bg-red-50/40"
                            }`}
                            >
                            <span
                                className={`font-mono text-xs font-semibold ${
                                seleccionado ? "line-through" : ""
                                }`}
                            >
                                {h}
                            </span>

                            {seleccionado ? (
                                <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                                Agregado
                                </span>
                            ) : (
                                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                Disponible
                                </span>
                            )}
                            </li>
                        );
                        })}
                    </ul>
                    )}
                </div>
                </section>

                <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
                <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-red-950/5" />

                <div className="relative border-b border-gray-200/70 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-950">
                    Selección
                    </p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                    Agregar HAWB a agrupar
                    </h3>
                </div>

                <div className="relative p-5">
                    <div className="flex gap-3">
                    <input
                        value={inputHawb}
                        onChange={(e) => {
                        const value = e.target.value.trim();
                        setInputHawb(value);

                        if (
                            hawbsSolicitud.includes(value) &&
                            !hawbsSeleccionados.includes(value)
                        ) {
                            setHawbsSeleccionados((prev) => [...prev, value]);
                            setInputHawb("");
                        }
                        }}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                        placeholder="Ingrese HAWB exacto"
                    />

                    </div>

                    <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">
                        HAWBs seleccionados
                        </h4>

                        <span className="rounded-full border border-red-900/15 bg-red-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-950">
                        {hawbsSeleccionados.length} seleccionados
                        </span>
                    </div>

                    {hawbsSeleccionados.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                        <p className="text-sm font-bold text-gray-500">
                            Aún no se han agregado HAWBs
                        </p>
                        </div>
                    ) : (
                        <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                        {hawbsSeleccionados.map((h, i) => (
                            <li
                            key={i}
                            className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-sm"
                            >
                            <span className="font-mono text-xs font-semibold">
                                {h}
                            </span>

                            <button
                                onClick={() => quitarHawb(h)}
                                className="ml-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-950 hover:text-white"
                                title="Quitar HAWB"
                            >
                                ✕
                            </button>
                            </li>
                        ))}
                        </ul>
                    )}
                    </div>
                </div>
                </section>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                onClick={() => navigate("../../agrupar-paquetes")}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-7 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all duration-200 hover:bg-gray-100 hover:text-gray-900"
                >
                Volver
                </button>

                <button
                onClick={confirmarAgrupacion}
                disabled={hawbsSeleccionados.length < 2}
                className={`inline-flex items-center justify-center rounded-xl px-7 py-3 text-sm font-bold shadow-lg transition-all duration-200 ${
                    hawbsSeleccionados.length < 2
                    ? "cursor-not-allowed bg-gray-200 text-gray-500 shadow-none"
                    : "bg-gradient-to-r from-red-950 to-red-900 text-white shadow-red-950/20 hover:scale-[1.02] hover:from-red-900 hover:to-red-800"
                }`}
                >
                Confirmar agrupación
                </button>
            </div>
            </>
        )}
        </div>

        {modalAbierto && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/70 px-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />

            <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-[#3b0505] px-6 py-6 text-white">
                <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/10" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-red-100/70">
                Confirmación operacional
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Confirmar agrupación
                </h2>
                <p className="mt-1 text-sm font-semibold text-red-100/80">
                Revisa los HAWBs antes de generar la guía agrupada.
                </p>
            </div>

            <div className="p-6">
                <p className="mb-4 text-sm font-semibold text-gray-700">
                Vas a agrupar{" "}
                <span className="font-semibold text-red-950">
                    {hawbsSeleccionados.length} HAWB(s)
                </span>
                </p>

                <div className="mb-6 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <ul className="space-y-2">
                    {hawbsSeleccionados.map((hawb, index) => (
                    <li
                        key={index}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                    >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-950 text-xs font-semibold text-white">
                        {index + 1}
                        </span>
                        <span className="font-mono text-sm font-semibold text-gray-800">
                        {hawb}
                        </span>
                    </li>
                    ))}
                </ul>
                </div>

                <p className="rounded-xl border border-red-900/10 bg-red-50 px-4 py-3 text-xs font-semibold leading-relaxed text-gray-700">
                Esta acción generará una guía padre y marcará los paquetes hijos
                como agrupados. No podrás deshacer esta acción desde esta pantalla.
                </p>
            </div>

            <div className="flex gap-3 border-t border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white px-6 py-5">
                <button
                onClick={() => setModalAbierto(false)}
                disabled={cargando}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                Cancelar
                </button>

                <button
                onClick={ejecutarAgrupacion}
                disabled={cargando}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition ${
                    cargando
                    ? "cursor-not-allowed bg-gray-400 shadow-none"
                    : "bg-gradient-to-r from-red-950 to-red-900 shadow-red-950/20 hover:from-red-900 hover:to-red-800"
                }`}
                >
                {cargando ? "Agrupando..." : "Confirmar"}
                </button>
            </div>
            </div>
        </div>
        )}
    </UserDashboardLayout>
    );

}