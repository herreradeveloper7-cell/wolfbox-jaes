import { useNavigate } from "react-router-dom";
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
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [casilleroOpen, setCasilleroOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [operacionesOpen, setOperacionesOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [reportesOpen, setReportesOpen] = useState(false);
  const [seguridadOpen, setSeguridadOpen] = useState(false);
  const [configuracionOpen, setConfiguracionOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      const parsed = JSON.parse(stored);
      setCliente(parsed);
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen relative bg-gray-200">

        <aside
          className={`bg-red-950 text-white transition-all duration-300 flex flex-col
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
            <button onClick={() => navigate("/consultar-guia")} className="text-white text-left w-full px-6 py-2 cursor-pointer hover:bg-red-900 transition">Consultar Guía</button>
            <button onClick={() => navigate("/digitacion-paquetes")} className="text-white text-left w-full px-6 py-2 cursor-pointer hover:bg-red-900 transition">Digitación de paquetes</button>
            <button onClick={() => navigate("/solicitar-despachos")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Solicitar despachos</button>
            <button onClick={() => navigate("/agrupar-paquetes")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Agrupar paquetes</button>
            <button onClick={() => navigate("/conciliacion-pagos")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Conciliación de pago</button>
            <button onClick={() => navigate("/Clientes")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Clientes</button>
            <button onClick={() => navigate("/destinatarios-casilleros")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition cursor-pointer">Destinatarios casilleros</button>
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
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Crear Despacho</button>
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Armar Despacho</button>
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
            <button onClick={() => navigate("/crear-tracking")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Crear Tracking</button>
            <button onClick={() => navigate("/consultar-tracking")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Consultar Tracking</button>
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
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Estado HAWB</button>
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900">Clientes Casilleros</button>
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
            <button onClick={() => navigate("/crear-usuario")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Crear Usuario</button>
            <button onClick={() => navigate("/consultar-usuario")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Consultar Usuario</button>
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
            <button onClick={() => navigate("/config-trm")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">TRM</button>
            <button onClick={() => navigate("/config-tarifas")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Tarifas</button>
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
            <button onClick={() => navigate("/perfil")} className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer">Ver Perfil</button>
            <button
              onClick={() => {
                localStorage.removeItem("usuario");
                navigate("/login");
              }}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

      </aside>

      <button
        onClick={toggleSidebar}
        className={`absolute bottom-4 z-40 bg-red-950 text-white p-2 shadow-lg transition-all duration-300 cursor-pointer ${
          sidebarOpen ? "left-[224px] rotate-0" : "left-[64px] rotate-180"
        }`}
      >
        <img src={iconToggleMostrar} alt="Mostrar/ocultar slide" className="w-5 h-5" />
      </button>

      <main className="flex-1 flex flex-col overflow-hidden">

        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md z-10">
        <div
          onClick={() => navigate("/dashboardUsuario")}
          className="w-auto mx-auto cursor-pointer hover:scale-105 transition-transform duration-200"
        >
          <img
            src={logo}
            alt="Logo empresa"
            className="h-28 sm:h-32 md:h-36 lg:h-25 xl:h-20 w-auto object-contain"
          />
        </div>

          <div className="flex items-center gap-4 absolute right-6 top-4">
            <span className="text-lg font-semibold">{cliente?.nombre}</span>
            <div className="relative w-13 h-13">
              <img
                src={cliente?.genero?.toLowerCase() === "femenino" ? iconMujer : iconHombre}
                alt="Avatar"
                className="w-13 h-13 rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
          </div>
        </header>

        <div className={`flex-1 ${scrollable ? "overflow-y-auto" : "overflow-hidden"} p-6`}>
          {children}
        </div>

        <footer className="text-sm text-right py-2 px-10 bg-white z-20">
          Copyright © Wolfbox Software 2025
        </footer>

      </main>
    </div>
  );
}
