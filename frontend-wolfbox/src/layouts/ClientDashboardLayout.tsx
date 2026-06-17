import { useNavigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import logo from "../assets/LogoJaesDashboard.svg";
import iconCasillero from "../assets/lockers-storage-svgrepo-com.svg"; 
import iconToggleMostrar from "../assets/mostrarSlid.svg"; 
import iconHombre from "../assets/malecostume-svgrepo-com.svg";
import iconMujer from "../assets/female-svgrepo-com.svg";
import arrowRight from "../assets/right-arrow.svg"; 
import iconPorfile from "../assets/profile-circle-svgrepo-com.svg";
import { ChevronDown, HelpCircle, MessageCircle, Sparkles, X } from "lucide-react";

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
  const [isMobile, setIsMobile] = useState(false);
  const [casilleroOpen, setCasilleroOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    const stored = localStorage.getItem("cliente") || sessionStorage.getItem("cliente");

    if (!token || !stored) {
      localStorage.removeItem("cliente");
      sessionStorage.removeItem("cliente");
      navigate("/login");
      return;
    }

    if (stored) {
      const parsed = JSON.parse(stored);
      setCliente(parsed);
    }
  }, [navigate]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const actualizarVista = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
      setCasilleroOpen(false);
      setPerfilOpen(false);
    };

    actualizarVista();
    mediaQuery.addEventListener("change", actualizarVista);

    return () => mediaQuery.removeEventListener("change", actualizarVista);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const navegarCliente = (ruta: string) => {
    navigate(ruta);
    if (isMobile) {
      setSidebarOpen(false);
      setCasilleroOpen(false);
      setPerfilOpen(false);
    }
  };

  return (
      <div className="flex h-screen relative bg-gray-200 overflow-hidden">
      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
        />
      )}
      <aside
        className={`bg-red-950 text-white transition-all duration-300 flex flex-col shrink-0 ${
            isMobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : "relative z-30"
        } ${
            sidebarOpen ? "w-56 md:w-56" : "w-14 md:w-16"
        }`}
      >
        <div className="flex flex-col mt-24 gap-2 md:mt-25">

      <button
        onClick={() =>{
          if (!sidebarOpen) {
            setSidebarOpen(true)
            setCasilleroOpen(true)
            setPerfilOpen(false)
            return
          }
          setCasilleroOpen((prev) => !prev)
          setPerfilOpen(false)
        }}
        className={`relative flex items-center w-full py-3 cursor-pointer overflow-hidden bg-red-950 group ${
          sidebarOpen ? "justify-between px-4" : "justify-center px-0"
        }`}
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
              ${casilleroOpen && sidebarOpen ? "max-h-52 opacity-100" : "max-h-0 opacity-0"}
            `}
          >
            <button
              onClick={() => navegarCliente("/solicitar-despachos")}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Solicitar despachos
            </button>
            <button
              onClick={() => navegarCliente("/destinatarios-casilleros")}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Destinatarios casilleros
            </button>
            <button
              onClick={() => navegarCliente("/rastreo-paquetes")}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Rastreo de Paquetes
            </button>
            <button
              onClick={() => navegarCliente("/prealertas")}
              className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Prealertas
            </button>
          </div>
        </div>


        <div className="flex flex-col">
        <button
          onClick={() =>{
            if (!sidebarOpen) {
              setSidebarOpen(true)
              setPerfilOpen(true)
              setCasilleroOpen(false)
              return
            }
            setPerfilOpen((prev) => !prev)
            setCasilleroOpen(false)
          }}
          className={`relative flex items-center w-full py-3 cursor-pointer overflow-hidden bg-red-950 group ${
            sidebarOpen ? "justify-between px-4" : "justify-center px-0"
          }`}
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
            onClick={() => navegarCliente("/editar-perfil")}
            className="text-white text-left w-full px-6 py-2 hover:bg-red-900 transition duration-200 cursor-pointer"
            >
              Editar perfil
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("cliente");
                localStorage.removeItem("authToken");
                sessionStorage.removeItem("cliente");
                sessionStorage.removeItem("authToken");
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
        className={`fixed bottom-4 z-[60] bg-red-950 text-white p-2 shadow-lg transition-all duration-300 cursor-pointer ${
          sidebarOpen ? "left-56 rotate-0 md:left-[224px]" : "left-14 rotate-180 md:left-[64px]"
        }`}
      >
        <img
          src={iconToggleMostrar}
          alt="Mostrar/ocultar slide"
          className="w-5 h-5"
        />
      </button>

      <main className={`flex-1 min-w-0 flex flex-col overflow-hidden ${isMobile ? "pl-14" : ""}`}>
        <header className="relative flex min-h-[72px] items-center justify-between gap-3 bg-white px-3 py-3 shadow-md z-10 sm:px-6 md:min-h-[96px] md:py-4">
          <div
            onClick={() => navegarCliente("/dashboardCliente")}
            className="flex h-12 w-16 shrink-0 cursor-pointer items-center justify-start transition-transform duration-200 hover:scale-105 sm:w-24 md:absolute md:left-1/2 md:h-16 md:-translate-x-1/2 md:justify-center lg:h-20"
          >
          <img
            src={logo}
            alt="Logo empresa"
            className="h-12 w-auto max-w-full object-contain sm:h-14 md:h-16 lg:h-20"
          />
          </div>
          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-4">
            <span className="max-w-[150px] truncate text-right text-sm font-semibold text-gray-900 sm:max-w-[220px] sm:text-base md:text-lg">{cliente?.nombre}</span>
            <div className="relative h-11 w-11 shrink-0 sm:h-13 sm:w-13">
              <img
                src={
                  cliente?.genero?.toLowerCase() === "femenino"
                    ? iconMujer
                    : iconHombre
                }
                alt="Avatar"
                className="h-11 w-11 rounded-full sm:h-13 sm:w-13"
              />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 sm:h-4 sm:w-4"></span>
            </div>
          </div>
        </header>

        <div className={`flex-1 ${scrollable ? "overflow-y-auto" : "overflow-hidden"} p-4 sm:p-5 md:p-6`}>
        {children}
        </div>
        <footer className="bg-white px-4 py-2 text-center text-xs z-20 sm:px-10 sm:text-right sm:text-sm">
          Copyright © Wolfbox Software 2025
        </footer>
      </main>

      <AyudaClienteButton />
      <AtencionClienteBubble />
    </div>
  );
}

const preguntasFrecuentes = [
  {
    pregunta: "¿Cómo uso mi casillero?",
    respuesta:
      "Compra en tus tiendas de Estados Unidos usando tu codigo de casillero. Cuando el paquete llegue a bodega, JAES Cargo lo registra y podras verlo en tu portal.",
  },
  {
    pregunta: "¿Qué es una prealerta?",
    respuesta:
      "Es un aviso anticipado de una compra que viene en camino. Al crearla con tracking, peso, contenido y valores, ayudas a identificar el paquete mas rapido cuando llegue.",
  },
  {
    pregunta: "¿Cuándo puedo solicitar despacho?",
    respuesta:
      "Puedes solicitar despacho cuando tengas paquetes digitados y disponibles en tu casillero. Desde Solicitar despachos seleccionas los paquetes y generas la solicitud.",
  },
  {
    pregunta: "¿Cómo rastreo mi paquete?",
    respuesta:
      "Ingresa a Rastreo de Paquetes y consulta el HAWB individual o el HAWB padre. Alli veras el estado actual y la linea de tiempo del envio.",
  },
];

function AyudaClienteButton() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="fixed bottom-32 right-4 z-[9998] flex flex-col items-end gap-3 sm:right-6">
      {open && (
        <section className="animate-fade-in w-[calc(100vw-6.5rem)] max-w-sm overflow-hidden rounded-2xl border border-red-100 bg-white shadow-2xl shadow-slate-900/20 sm:w-96">
          <header className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-red-950 to-red-900 px-4 py-4 text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
                Centro de ayuda
              </p>
              <h2 className="mt-1 text-base font-black">Preguntas frecuentes</h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar ayuda"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="max-h-[52vh] overflow-y-auto p-3">
            {preguntasFrecuentes.map((item, index) => {
              const isActive = activeIndex === index;

              return (
                <article key={item.pregunta} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(isActive ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left"
                  >
                    <span className="text-sm font-black text-gray-800">{item.pregunta}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-red-950 transition-transform ${isActive ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isActive && (
                    <p className="px-2 pb-4 text-sm font-semibold leading-6 text-gray-500">
                      {item.respuesta}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir preguntas frecuentes"
        className="group flex h-12 items-center gap-2 rounded-full border border-red-900/10 bg-white px-4 text-sm font-black text-red-950 shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-red-50"
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Ayuda</span>
      </button>
    </div>
  );
}

function AtencionClienteBubble() {
  const whatsappUrl =
    "https://wa.me/573028600369?text=Hola%20JAES%20Cargo%2C%20necesito%20ayuda%20con%20mi%20casillero.";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir atencion al cliente de JAES Cargo en WhatsApp"
      className="customer-support-bubble group fixed bottom-12 right-6 z-[9999] flex items-center gap-3"
    >
      <span className="customer-support-tooltip pointer-events-none relative hidden min-w-[220px] rounded-lg border border-red-100 bg-white px-4 py-3 text-left shadow-2xl sm:block">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-red-900">
          <Sparkles className="h-3.5 w-3.5" />
          Atencion al cliente
        </span>
        <span className="mt-1 block text-sm font-semibold text-gray-700">
          ¿Necesitas ayuda?
        </span>
      </span>

      <span className="customer-support-orbit" />
      <span className="customer-support-button relative flex h-16 w-16 items-center justify-center rounded-full bg-red-950 text-white shadow-2xl transition-transform duration-300 group-hover:scale-110">
        <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        <MessageCircle className="h-8 w-8" strokeWidth={2.4} />
      </span>
    </a>
  );
}
