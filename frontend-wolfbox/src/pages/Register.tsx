import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PersonalForm from "../components/PersonalForm";
import EmpresarialForm from "../components/EmpresarialForm";
import iconPersonal from "../assets/personal-id-card-of-a-man-svgrepo-com.svg";
import iconEmpresarial from "../assets/business-svgrepo-com.svg";

export default function RegisterPages() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-200 px-4 py-8 flex justify-center">
      <button
        type="button"
        onClick={() => navigate("/")}
        title="Volver a Home"
        className="absolute left-5 top-5 z-20 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-900/10 bg-white/80 px-4 text-sm font-black text-red-900 shadow-lg shadow-slate-300/40 backdrop-blur transition hover:-translate-y-0.5 hover:bg-red-900 hover:text-white hover:shadow-xl"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            d="M10.8 7.2 6 12l4.8 4.8M6.7 12H18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Volver</span>
      </button>

      <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-red-900 opacity-90 blur-[1px]" />
      <div className="absolute top-[22%] right-[10%] hidden h-32 w-32 rounded-full bg-red-900/90 md:block" />
      <div className="absolute bottom-[-9rem] left-[-7rem] h-80 w-80 rounded-full bg-red-900 opacity-90" />
      <div className="absolute bottom-[18%] left-[12%] hidden h-24 w-24 rounded-full bg-red-900/90 lg:block" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,29,29,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(127,29,29,0.12),transparent_35%)]" />

      <div className="relative z-10 w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-900 via-gray-300 to-red-900" />

        <div className="px-6 py-8 sm:px-10 lg:px-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 inline-flex rounded-full border border-red-900/10 bg-red-900/5 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-red-900">
              Registro corporativo
            </span>

            <h2 className="text-3xl font-black tracking-tight text-gray-700 sm:text-4xl">
              Registrate
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Completa la informacion requerida para crear tu cuenta dentro del sistema.
            </p>

            <p className="mt-2 text-xs font-bold text-red-900">
              * Campos requeridos
            </p>
          </div>

          <div className="mb-8">
            <label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              Tipo de cuenta *
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setAccountType("personal")}
                className={`group relative overflow-hidden rounded-[1.5rem] border p-5 text-left transition-all duration-300 ${
                  accountType === "personal"
                    ? "border-red-900 bg-gradient-to-br from-red-900 to-red-950 text-white shadow-2xl shadow-red-900/20"
                    : "border-gray-200 bg-white hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
                }`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                <div className="relative z-10">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                      accountType === "personal" ? "bg-white/15" : "bg-red-900/5"
                    }`}
                  >
                    <img
                      src={iconPersonal}
                      alt="Cuenta personal"
                      className={`h-7 w-7 object-contain transition ${
                        accountType === "personal" ? "brightness-0 invert" : ""
                      }`}
                    />
                  </div>

                  <h3
                    className={`text-lg font-black tracking-tight ${
                      accountType === "personal" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Cuenta Personal
                  </h3>

                  <p
                    className={`mt-2 text-sm leading-5 ${
                      accountType === "personal" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    Ideal para clientes individuales que desean gestionar compras,
                    envios y paquetes personales.
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        accountType === "personal" ? "bg-green-400" : "bg-gray-300"
                      }`}
                    />

                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                        accountType === "personal" ? "text-white/90" : "text-slate-400"
                      }`}
                    >
                      {accountType === "personal" ? "Seleccionado" : "Disponible"}
                    </span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAccountType("empresarial")}
                className={`group relative overflow-hidden rounded-[1.5rem] border p-5 text-left transition-all duration-300 ${
                  accountType === "empresarial"
                    ? "border-red-900 bg-gradient-to-br from-red-900 to-red-950 text-white shadow-2xl shadow-red-900/20"
                    : "border-gray-200 bg-white hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
                }`}
              >
                <div className="absolute -left-10 -bottom-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                <div className="relative z-10">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                      accountType === "empresarial" ? "bg-white/15" : "bg-red-900/5"
                    }`}
                  >
                    <img
                      src={iconEmpresarial}
                      alt="Cuenta empresarial"
                      className={`h-7 w-7 object-contain transition ${
                        accountType === "empresarial" ? "brightness-0 invert" : ""
                      }`}
                    />
                  </div>

                  <h3
                    className={`text-lg font-black tracking-tight ${
                      accountType === "empresarial" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Cuenta Empresarial
                  </h3>

                  <p
                    className={`mt-2 text-sm leading-5 ${
                      accountType === "empresarial" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    Disenada para empresas que gestionan operaciones logisticas,
                    importaciones y multiples envios corporativos.
                  </p>

                  <div className="mt-5 flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        accountType === "empresarial" ? "bg-green-400" : "bg-gray-300"
                      }`}
                    />

                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                        accountType === "empresarial" ? "text-white/90" : "text-slate-400"
                      }`}
                    >
                      {accountType === "empresarial" ? "Seleccionado" : "Disponible"}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6">
            {accountType === "" && (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-slate-50/70 text-center">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                  Selecciona un tipo de cuenta
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  El formulario aparecera automaticamente.
                </p>
              </div>
            )}

            {accountType === "personal" && <PersonalForm tipoCliente="personal" />}
            {accountType === "empresarial" && (
              <EmpresarialForm tipoCliente="empresarial" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
