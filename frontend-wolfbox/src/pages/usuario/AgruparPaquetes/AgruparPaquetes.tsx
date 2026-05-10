import { useEffect, useState } from "react";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout"
import { useNavigate } from "react-router-dom";
import iconHome from "../../../assets/home-svgrepo-com.svg";
import iconSearch from "../../../assets/search-alt-svgrepo-com.svg"
import TablaSolicitudesDespacho from "../../../components/agruparPaquetes/TablaSolicitudesDespacho";
import { Solicitud } from "../../../types/solicitudes";
import Swal from "sweetalert2";
import axios from "axios";


interface Oficina {
  id: number;
  nombre: string;
}

interface PuntoControl {
  id: number;
  nombre: string;
  orden: number;
}



export default function AgruparPaquetes(){
    const navigate = useNavigate();

    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [oficinas, setOficinas] = useState<Oficina[]>([]);
    const [oficina, setOficina] = useState<number | "">("");
    const [puntoControl, setPuntoControl] = useState<number | "">("");    
    const [puntosControl, setPuntosControl] = useState<PuntoControl[]>([]);
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
    const cargarPuntosControl = async () => {
        if (!oficina) {
        setPuntosControl([]);
        setPuntoControl("");
        return;
        }

        try {
        const { data } = await axios.get(
            `/api/agrupaciones/puntos-control?oficina_id=${oficina}`
        );

        setPuntosControl(data);
        setPuntoControl("");
        } catch (error) {
        console.error("❌ Error cargando puntos de control:", error);
        }
    };

    cargarPuntosControl();
    }, [oficina]);


    useEffect(() => {
    const cargarOficinas = async () => {
        try {
        const { data } = await axios.get(
            "/api/agrupaciones/oficinas"
        );

        setOficinas(data);
        } catch (error) {
        console.error("❌ Error cargando oficinas:", error);
        }
    };

    cargarOficinas();
    }, []);

    const buscarSolicitudes = async (pagina = 1) => {
    if (!puntoControl) {
        return Swal.fire(
        "Campo obligatorio",
        "Debe seleccionar un punto de control",
        "warning"
        );
    }

    try {
        setLoading(true);

        const { data } = await axios.get(
        "/api/agrupaciones/solicitudes",
        {
            params: {
            page: pagina,
            limit: 10,
            fechaInicio: fechaInicio || undefined,
            fechaFin: fechaFin || undefined,
            puntoControl, 
            oficina: oficina || undefined,
            },
        }
        );

        setSolicitudes(data.data);
        setTotalPages(data.totalPages);
        setPage(pagina);
    } catch (error) {
        console.error("❌ Error buscando solicitudes:", error);
        Swal.fire("Error", "No se pudieron cargar las solicitudes", "error");
    } finally {
        setLoading(false);
    }
    };

    return(
    <UserDashboardLayout scrollable>
      <div className="px-6 lg:px-10 pb-10 animate-fade-in text-gray-800">
        <h1 className="text-3xl font-bold mb-2 text-red-900">
          Agrupar paquetes
        </h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700"
          >
            Dashboard
          </button>
          &gt; Agrupar paquetes
        </p>

        <div className="relative mb-10 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-6 shadow-xl">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5" />
        <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-gray-900/5" />

        <div className="relative mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
            <h2 className="text-xl font-bold tracking-wide text-gray-700">
                BÚSQUEDA DE SOLICITUDES
            </h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">
                Filtros operacionales para consultar, agrupar y gestionar solicitudes de despacho.
            </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-green-950/10 bg-green-50 px-4 py-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-green-950" />
            <span className="text-xs font-bold text-green-950">Módulo activo</span>
            </div>
        </div>

        <div className="relative mb-6 rounded-2xl border border-green-950/15 bg-gradient-to-r from-green-50 via-white to-gray-50 px-5 py-4">
            <p className="text-sm font-semibold leading-relaxed text-gray-700">
            Debe seleccionar un <span className="font-bold text-red-950">punto de control</span> para poder agrupar o consultar.
            <br />
            Si filtra por solicitudes agrupadas, debe seleccionar un rango de fechas.
            </p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 shadow-sm">
            <label className="text-sm font-bold tracking-tight text-gray-600">
                Fecha inicial
            </label>
            <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
            />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 shadow-sm">
            <label className="text-sm font-bold tracking-tight text-gray-600">
                Fecha final
            </label>
            <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
            />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 shadow-sm">
            <label className="text-sm font-bold tracking-tight text-gray-600">
                Oficina cliente
            </label>
                <select
                value={oficina}
                onChange={(e) =>
                    setOficina(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="mt-2 w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                >
                <option value="">Seleccione una oficina</option>

                {oficinas.map((oficina) => (
                    <option key={oficina.id} value={oficina.id}>
                    {oficina.nombre}
                    </option>
                ))}
                </select>
            </div>

            <div className="rounded-2xl border border-red-900/20 bg-gradient-to-br from-white via-red-50/50 to-gray-50 p-5 shadow-sm">
            <label className="text-sm font-bold tracking-tight text-gray-600">
                Punto de control <span className="text-red-700">*</span>
            </label>
                <select
                value={puntoControl}
                disabled={!oficina}
                onChange={(e) =>
                    setPuntoControl(e.target.value === "" ? "" : Number(e.target.value))
                }
                className={`mt-2 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm outline-none transition-all duration-200 ${
                    !oficina
                    ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                    : "cursor-pointer border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:border-red-950 focus:ring-4 focus:ring-red-950/10"
                }`}
                >
                <option value="">
                    {!oficina
                    ? "Seleccione primero una oficina"
                    : "Seleccione un punto de control"}
                </option>

                {puntosControl.map((pc) => (
                    <option key={pc.id} value={pc.id}>
                    {pc.nombre}
                    </option>
                ))}
                </select>
            </div>
        </div>

        <div className="relative mt-6 flex justify-end">
            <button
            onClick={() => buscarSolicitudes(1)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:scale-[1.02] hover:from-red-900 hover:to-red-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-900/20"
            >
            <img src={iconSearch} alt="Buscar" className="h-4 w-4" />
            Buscar
            </button>
        </div>
        </div>

        <TablaSolicitudesDespacho
        solicitudes={solicitudes}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={buscarSolicitudes}
        />

      </div>
        </UserDashboardLayout>
    )
}

