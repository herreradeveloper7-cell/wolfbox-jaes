import { useLocation, useNavigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import logo from "../assets/LogoJaesDashboard.svg";
import iconCasillero from "../assets/lockers-storage-svgrepo-com.svg"; 
import iconToggleMostrar from "../assets/mostrarSlid.svg"; 
import iconHombre from "../assets/malecostume-svgrepo-com.svg";
import iconMujer from "../assets/female-svgrepo-com.svg";
import arrowRight from "../assets/right-arrow.svg"; 
import iconPorfile from "../assets/profile-circle-svgrepo-com.svg";
import iconOperations from "../assets/options-lines-svgrepo-com.svg";
import iconTracking from "../assets/barcode-svgrepo-com.svg";
import iconReport from "../assets/report-file-svgrepo-com (1).svg";
import iconSecurity from "../assets/security-shield-svgrepo-com.svg"
import iconSettings from "../assets/settings-svgrepo-com.svg"

type Props = {
    children: ReactNode;
    scrollable?: boolean;
};

type Cliente = {
  nombre: string;
  genero: string;
  codigoReferencia: string;
};

export default function UserDashboardLayout({ children, scrollable = false }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768
  );
  const [casilleroOpen, setCasilleroOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [operacionesOpen, setOperacionesOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [reportesOpen, setReportesOpen] = useState(false);
  const [seguridadOpen, setSeguridadOpen] = useState(false);
  const [configuracionOpen, setConfiguracionOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const stored = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");

    if (!token || !stored) {
      localStorage.removeItem("usuario");
      sessionStorage.removeItem("usuario");
      navigate("/login");
      return;
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      setCliente(parsed);
    }
  }, [navigate]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const navegarORecargar = (path: string) => {
    if (location.pathname.toLowerCase() === path.toLowerCase()) {
      navigate(0);
      return;
    }

    navigate(path);
  };

  return (
    <div className="flex h-screen relative overflow-hidden bg-gray-200">

        <aside
          className={`fixed inset-y-0 left-0 z-50 bg-red-950 text-white transition-all duration-300 flex flex-col md:relative md:z-0
                      ${sidebarOpen ? "w-56" : "w-16"}
                      overflow-y-auto scrollbar-hide`}
        >

        <div className="flex flex-col mt-25 gap-2">
          <button
            onClick={() =>{
              setCasilleroOpen((prev) => !prev);
              setOperacionesOpen(false);
              setTrackingOpen(false);
              setReportesOpen(false);
              setSeguridadOpen(false);
              setPerfilOpen(false);
              setConfiguracionOpen(false);
            }}
            className={`
              relative flex items-center justify-between w-full px-4 py-3 cursor-pointer
              overflow-hidden group
              bg-red-950
              transition-all duration-300
              ${casilleroOpen ? "bg-red-900" : ""}
            `}
          >
            <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

            <div className="relative flex items-center gap-4 z-10">
              <img src={iconCasillero} alt="Icono Casillero" className="w-6 h-6" />
              {sidebarOpen && <span className="text-lg">Casillero</span>}
            </div>

            {sidebarOpen && (
              <img
                src={arrowRight}
                alt="Flecha"
                className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                  casilleroOpen ? "rotate-90" : ""
                }`}
              />
            )}
          </button>

          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden bg-[#2d0101] w-full
              ${casilleroOpen && sidebarOpen ? "max-h-[350px] opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <button onClick={() => navegarORecargar("/consultar-guia")} className="text-white text-left w-full px-6 py-2 cursor-pointer hover:bg-red-900 transition">Consultar Guía</button>
            <button onClick={() => navegarORecargar("/digitacion-paquetes")} className="text-white text-left w-full px-6 py-2 cursor-pointer hover:bg-red-900 transition">Digitación de paquetes</button>
            <button onClick={() => navegarORecargar("/solicitar-despachos")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Solicitar despachos</button>
            <button onClick={() => navegarORecargar("/agrupar-paquetes")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Agrupar paquetes</button>
            <button onClick={() => navegarORecargar("/conciliacion-pagos")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Conciliación de pago</button>
            <button onClick={() => navegarORecargar("/Clientes")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Clientes</button>
            <button onClick={() => navegarORecargar("/destinatarios-casilleros")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Destinatarios casilleros</button>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-2">
          <button
            onClick={() => {
              setOperacionesOpen((prev) => !prev);
              setCasilleroOpen(false);
              setTrackingOpen(false);
              setReportesOpen(false);
              setSeguridadOpen(false);
              setPerfilOpen(false);
              setConfiguracionOpen(false);
            }}
            className={`
              relative flex items-center justify-between w-full px-4 py-3 cursor-pointer
              overflow-hidden group
              bg-red-950
              transition-all duration-300
              ${operacionesOpen ? "bg-red-900" : ""}
            `}
          >
            <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

            <div className="relative flex items-center gap-4 z-10">
              <img src={iconOperations} alt="Icono Operaciones" className="w-6 h-6" />
              {sidebarOpen && <span className="text-lg">Operaciones</span>}
            </div>

            {sidebarOpen && (
              <img
                src={arrowRight}
                alt="Flecha"
                className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                  operacionesOpen ? "rotate-90" : ""
                }`}
              />
            )}
          </button>
          <div className={`transition-all duration-500 overflow-hidden bg-[#2d0101] w-full ${operacionesOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <button onClick={() => navegarORecargar("/crear-despachos")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Crear Despacho</button>
            <button onClick={() => navegarORecargar("/armar-despachos")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Armar Despacho</button>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-2">
          <button
            onClick={() => {
              setTrackingOpen((prev) => !prev);
              setCasilleroOpen(false);
              setOperacionesOpen(false);
              setReportesOpen(false);
              setSeguridadOpen(false);
              setPerfilOpen(false);
              setConfiguracionOpen(false);
            }}
            className={`
              relative flex items-center justify-between w-full px-4 py-3 cursor-pointer
              overflow-hidden group
              bg-red-950
              transition-all duration-300
              ${trackingOpen ? "bg-red-900" : ""}
            `}
          >
            <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

            <div className="relative flex items-center gap-4 z-10">
              <img src={iconTracking} alt="Icono Tracking" className="w-6 h-6" />
              {sidebarOpen && <span className="text-lg">Tracking</span>}
            </div>

            {sidebarOpen && (
              <img
                src={arrowRight}
                alt="Flecha"
                className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                  trackingOpen ? "rotate-90" : ""
                }`}
              />
            )}
          </button>
          <div className={`transition-all duration-500 overflow-hidden bg-[#2d0101] w-full ${trackingOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <button onClick={() => navegarORecargar("/crear-tracking")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Crear Tracking</button>
            <button onClick={() => navegarORecargar("/consultar-tracking")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Consultar Tracking</button>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-2">
        <button
          onClick={() => {
            setReportesOpen((prev) => !prev);
            setCasilleroOpen(false);
            setOperacionesOpen(false);
            setTrackingOpen(false);
            setSeguridadOpen(false);
            setPerfilOpen(false);
            setConfiguracionOpen(false);
          }}
          className={`
            relative flex items-center justify-between w-full px-4 py-3 cursor-pointer
            overflow-hidden group
            bg-red-950
            transition-all duration-300
            ${reportesOpen ? "bg-red-900" : ""}
          `}
        >
          <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

          <div className="relative flex items-center gap-4 z-10">
            <img src={iconReport} alt="Icono Reportes" className="w-6 h-6" />
            {sidebarOpen && <span className="text-lg">Reportes</span>}
          </div>

          {sidebarOpen && (
            <img
              src={arrowRight}
              alt="Flecha"
              className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                reportesOpen ? "rotate-90" : ""
              }`}
            />
          )}
        </button>
          <div className={`transition-all duration-500 overflow-hidden bg-[#2d0101] w-full ${reportesOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <button onClick={() => navegarORecargar("/reporte-estado-guia")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Estado HAWB</button>
            <button onClick={() => navegarORecargar("/reporte-clientes-casilleros")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Clientes Casilleros</button>
            <button onClick={() => navegarORecargar("/reporte-solicitudes")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Solicitudes</button>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-2">
          <button
            onClick={() => {
              setSeguridadOpen((prev) => !prev);
              setCasilleroOpen(false);
              setOperacionesOpen(false);
              setTrackingOpen(false);
              setReportesOpen(false);
              setPerfilOpen(false);
              setConfiguracionOpen(false);
            }}
            className={`
              relative flex items-center justify-between w-full px-4 py-3 cursor-pointer
              overflow-hidden group
              bg-red-950
              transition-all duration-300
              ${seguridadOpen ? "bg-red-900" : ""}
            `}
          >
            <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

            <div className="relative flex items-center gap-4 z-10">
              <img src={iconSecurity} alt="Icono Seguridad" className="w-6 h-6" />
              {sidebarOpen && <span className="text-lg">Seguridad</span>}
            </div>

            {sidebarOpen && (
              <img
                src={arrowRight}
                alt="Flecha"
                className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                  seguridadOpen ? "rotate-90" : ""
                }`}
              />
            )}
          </button>
          <div className={`transition-all duration-500 overflow-hidden bg-[#2d0101] w-full ${seguridadOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <button onClick={() => navegarORecargar("/crear-usuario")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Crear Usuario</button>
            <button onClick={() => navegarORecargar("/consultar-usuario")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Consultar Usuario</button>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-2">
          <button
            onClick={() => {
              setConfiguracionOpen((prev) => !prev);
              setCasilleroOpen(false);
              setOperacionesOpen(false);
              setTrackingOpen(false);
              setReportesOpen(false);
              setSeguridadOpen(false);
              setPerfilOpen(false);
            }}
            className={`
              relative flex items-center justify-between w-full px-4 py-3 cursor-pointer
              overflow-hidden group
              bg-red-950
              transition-all duration-300
              ${configuracionOpen ? "bg-red-900" : ""}
            `}
          >
            <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

            <div className="relative flex items-center gap-4 z-10">
              <img src={iconSettings} alt="Icono Configuracion" className="w-6 h-6" />
              {sidebarOpen && <span className="text-lg">Configuración</span>}
            </div>

            {sidebarOpen && (
              <img
                src={arrowRight}
                alt="Flecha"
                className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                  configuracionOpen ? "rotate-90" : ""
                }`}
              />
            )}
          </button>
          
          <div className={`transition-all duration-500 overflow-hidden bg-[#2d0101] w-full ${configuracionOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <button onClick={() => navegarORecargar("/config-trm")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">TRM</button>
            <button onClick={() => navegarORecargar("/config-tarifas")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Tarifas</button>
            <button onClick={() => navegarORecargar("/config-tarifas")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Transportadoras</button>
          </div>
        </div>

        <div className="flex flex-col mt-2 gap-2">
        <button
          onClick={() =>{
            setPerfilOpen((prev) => !prev)
            setCasilleroOpen(false);
            setOperacionesOpen(false);
            setTrackingOpen(false);
            setReportesOpen(false);
            setSeguridadOpen(false);
            setConfiguracionOpen(false);
          }}
          className="relative flex items-center justify-between w-full px-4 py-3 cursor-pointer overflow-hidden bg-red-950 group"
        >
          <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>
          <div className="relative flex items-center gap-2 z-10">
            <img src={iconPorfile} alt="Icono Perfil" className="w-6 h-6" />
            {sidebarOpen && <span className="text-lg">Perfil</span>}
          </div>

          {sidebarOpen && (
            <img
              src={arrowRight}
              alt="Flecha"
              className={`relative z-10 w-4 h-4 ml-2 transition-transform duration-300 ${
                perfilOpen ? "rotate-90" : ""
              }`}
            />
          )}
          </button>

          <div className={`transition-all duration-500 overflow-hidden bg-[#2d0101] w-full ${perfilOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <button onClick={() => navegarORecargar("/perfil")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Ver Perfil</button>
            <button
              onClick={() => {
                localStorage.removeItem("usuario");
                localStorage.removeItem("authToken");
                sessionStorage.removeItem("authToken");
                navigate("/login");
              }}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
        />
      )}

      <button
        onClick={toggleSidebar}
        className={`fixed bottom-4 z-[60] bg-red-950 text-white p-2 shadow-lg transition-all duration-300 cursor-pointer md:absolute md:z-40 ${
          sidebarOpen ? "left-[224px] rotate-0" : "left-[64px] rotate-180"
        }`}
      >
        <img src={iconToggleMostrar} alt="Mostrar/ocultar slide" className="w-5 h-5" />
      </button>

      <main className="min-w-0 flex-1 flex flex-col overflow-hidden pl-16 md:pl-0">

        <header className="relative z-10 min-w-0 flex min-h-[104px] items-center justify-center bg-white px-4 py-3 shadow-md sm:min-h-[118px] md:px-6 md:py-4">
        <div
          onClick={() => navegarORecargar("/dashboardUsuario")}
          className="w-auto mx-auto cursor-pointer hover:scale-105 transition-transform duration-200"
        >
          <img
            src={logo}
            alt="Logo empresa"
            className="h-20 w-auto object-contain sm:h-24 md:h-28 lg:h-25 xl:h-20"
          />
        </div>

          <div className="absolute right-3 top-3 flex items-center gap-2 sm:right-5 sm:top-4 md:gap-4">
            <span className="hidden max-w-[150px] truncate text-sm font-semibold sm:inline md:max-w-[220px] md:text-lg">{cliente?.nombre}</span>
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-13 md:w-13">
              <img
                src={cliente?.genero?.toLowerCase() === "femenino" ? iconMujer : iconHombre}
                alt="Avatar"
                className="h-full w-full rounded-full"
              />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 sm:h-4 sm:w-4"></span>
            </div>
          </div>
        </header>

        <div className={`min-w-0 flex-1 overflow-x-hidden ${scrollable ? "overflow-y-auto" : "overflow-hidden"} p-4 md:p-6`}>
          {children}
        </div>

        <footer className="z-20 bg-white px-4 py-2 text-center text-xs sm:text-right sm:text-sm md:px-10">
          Copyright © Wolfbox Software 2025
        </footer>

      </main>
    </div>
  );
}

