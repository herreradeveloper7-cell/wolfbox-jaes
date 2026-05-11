import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logoJaesHome.png";
import arrowRight from "../assets/right-arrow.svg";

type AccessAction = {
  title: string;
  label: string;
  route: string;
  tone: "primary" | "light";
};

const actions: AccessAction[] = [
  {
    title: "Portal operativo",
    label: "Iniciar sesion",
    route: "/login",
    tone: "primary",
  },
  {
    title: "Nuevo casillero",
    label: "Crear casillero",
    route: "/register",
    tone: "light",
  },
  {
    title: "Seguimiento del envío",
    label: "Consultar guia",
    route: "/consulta-hawb",
    tone: "light",
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-200 px-4 py-4 text-slate-900 sm:px-6">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(127,29,29,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127,29,29,0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-slate-300 to-red-950" />
      <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white/70 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/70 to-transparent" />
      <div className="absolute -left-28 top-20 h-64 w-64 rotate-45 border border-red-900/20" />
      <div className="absolute -right-32 bottom-20 h-80 w-80 rotate-45 border border-red-900/20" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col justify-center">
        <div className="grid overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/90 shadow-2xl shadow-slate-400/40 backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[440px] overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 px-5 py-6 text-white sm:px-7 lg:px-8">
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.35)_49%,transparent_50%,transparent_100%)] bg-[length:28px_28px]" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/70 to-transparent" />

            <div className="relative flex h-full min-h-[388px] flex-col justify-between">
              <div className="flex justify-center">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={logo}
                    alt="Jaes Cargo"
                    className="h-36 w-36 rounded-[2rem] bg-white/95 object-contain p-4 shadow-2xl shadow-slate-950/45 ring-2 ring-white/85 sm:h-44 sm:w-44 lg:h-52 lg:w-52"
                  />
                </div>
              </div>

              <div className="max-w-xl py-5">
                <p className="mb-3 inline-flex border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/75 rounded-xl">
                  Plataforma logistica
                </p>
                <h1 className="text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                  Operaciones y casilleros en un solo centro.
                </h1>
                <p className="mt-4 max-w-lg text-sm font-medium leading-6 text-white/72">
                  Accede al portal, crea tu casillero o consulta el estado de una guia con una experiencia segura y directa.
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[440px] flex-col justify-between px-5 py-6 sm:px-7 lg:px-8">
            <div>
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-900">
                  Centro de acceso
                </p>
                <h2 className="mt-2 text-2xl font-black text-gray-700">
                  Selecciona el modulo
                </h2>
                <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                  Elige el la opción que necesitas para continuar con la operacion.
                </p>
              </div>

              <div className="space-y-2.5">
                {actions.map((action) => (
                  <button
                    key={action.route}
                    type="button"
                    onClick={() => navigate(action.route)}
                    className={`group flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer ${
                      action.tone === "primary"
                        ? "border-red-900 bg-red-900 text-white hover:bg-red-950 hover:shadow-red-900/20"
                        : "border-gray-200 bg-slate-50/90 text-gray-700 tracking-tight hover:border-red-900/20 hover:bg-white hover:shadow-slate-300/50"
                    }`}
                  >
                    <span>
                      <span
                        className={`block text-[10px] font-black uppercase tracking-[0.2em] ${
                          action.tone === "primary" ? "text-white/60" : "text-slate-400"
                        }`}
                      >
                        {action.title}
                      </span>
                      <span className="mt-1.5 block text-base font-black sm:text-lg">
                        {action.label}
                      </span>
                    </span>
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:translate-x-1 ${
                        action.tone === "primary"
                          ? "bg-white text-red-950"
                          : "bg-red-900 text-white"
                      }`}
                      aria-hidden="true"
                    >
                      <img
                        src={arrowRight}
                        alt=""
                        className={`h-6 w-6 ${action.tone === "primary" ? "brightness-0 saturate-100 invert-[12%] sepia-[61%] hue-rotate-[344deg] contrast-[103%]" : ""}`}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-3 text-xs font-medium text-slate-400 sm:flex-row sm:items-center sm:justify-center">
                <span>Copyright © Wolfbox Software 2025.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
