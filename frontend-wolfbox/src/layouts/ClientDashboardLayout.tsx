import { useNavigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import logo from "../assets/LogoJaesDashboard.svg";
import iconCasillero from "../assets/lockers-storage-svgrepo-com.svg"; 
import iconToggleMostrar from "../assets/mostrarSlid.svg"; 
import iconHombre from "../assets/malecostume-svgrepo-com.svg";
import iconMujer from "../assets/female-svgrepo-com.svg";
import arrowRight from "../assets/right-arrow.svg"; 
import iconPorfile from "../assets/profile-circle-svgrepo-com.svg";

type Props = {
    children: ReactNode;
    scrollable?: boolean;
  };
  

type Cliente = {
  nombre: string;
  genero: string;
  codigoReferencia: string;
};

export default function ClientDashboardLayout({ children, scrollable = false }: Props) {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [casilleroOpen, setCasilleroOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cliente");
    if (stored) {
      const parsed = JSON.parse(stored);
      setCliente(parsed);
    }
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
      <div className="flex h-screen relative bg-gray-200 overflow-hidden">
      <aside
        className={`bg-red-950 text-white transition-all duration-300 flex flex-col ${
            sidebarOpen ? "w-56" : "w-16"
        }`}
      >
        <div className="flex flex-col mt-25 gap-2">

      <button
        onClick={() =>{
          setCasilleroOpen((prev) => !prev)
          setPerfilOpen(false)
        }}
        className="relative flex items-center justify-between w-full px-4 py-3 cursor-pointer overflow-hidden bg-red-950 group"
      >
        <span className="absolute inset-0 bg-red-900 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out"></span>

        <div className="relative flex items-center gap-2 z-10">
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
              ${casilleroOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer">
              Solicitar despachos
            </button>
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer">
              Destinatarios casilleros
            </button>
            <button className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer">
              Rastreo de Paquetes
            </button>
          </div>
        </div>


        <div className="flex flex-col">
        <button
          onClick={() =>{
            setPerfilOpen((prev) => !prev)
            setCasilleroOpen(false)
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
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden bg-[#2d0101] w-full 
              ${perfilOpen && sidebarOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <button 
            onClick={() => navigate("/editar-perfil")}
            className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Editar perfil
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("cliente");
                navigate("/login");
              }}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Cerrar sesión
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
        <img
          src={iconToggleMostrar}
          alt="Mostrar/ocultar slide"
          className="w-5 h-5"
        />
      </button>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center px-6 py-4 bg-white shadow-md z-10">
          <div
            onClick={() => navigate("/dashboardCliente")}
            className="h-12 sm:h-14 md:h-16 lg:h-20 xl:h-20 w-auto max-w-[100%] mx-auto object-contain  cursor-pointer hover:scale-105 transition-transform duration-200"
          >
          <img
            src={logo}
            alt="Logo empresa"
            className="h-12 sm:h-14 md:h-16 lg:h-20 xl:h-20 w-auto max-w-[100%] mx-auto object-contain"
          />
          </div>
          <div className="flex items-center gap-4 absolute right-6 top-4">
            <span className="text-lg font-semibold">{cliente?.nombre}</span>
            <div className="relative w-13 h-13">
              <img
                src={
                  cliente?.genero?.toLowerCase() === "femenino"
                    ? iconMujer
                    : iconHombre
                }
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
