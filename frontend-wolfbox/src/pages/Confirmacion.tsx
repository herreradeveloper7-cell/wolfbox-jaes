import { useNavigate, useLocation } from "react-router-dom";
import iconoConfirmacion from "../assets/icono-confirmacion.svg";

export default function ConfirmacionPage() {
  const location = useLocation();
  const codigoReferencia = location.state?.codigoReferencia || "No disponible";
  const navigate = useNavigate();

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-200 px-4 py-8 text-slate-900 sm:px-6">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(127, 29, 29, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 29, 29, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />
      <div className="absolute -left-24 top-12 h-56 w-56 rotate-45 border border-red-900/20" />
      <div className="absolute -right-28 bottom-16 h-72 w-72 rotate-45 border border-red-900/20" />
      <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white/60 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/60 to-transparent" />

      <section className="relative z-10 w-full max-w-3xl">
        <div className="overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/90 shadow-2xl shadow-slate-400/40 backdrop-blur">
          <div className="grid min-h-[480px] grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-6 text-white sm:p-7">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.35)_49%,transparent_50%,transparent_100%)] bg-[length:28px_28px]" />
              </div>

              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                  Wolfbox Software
                </p>
                <h1 className="mt-4 max-w-sm text-2xl font-black leading-tight sm:text-3xl">
                  Registro confirmado
                </h1>
                <p className="mt-3 max-w-sm text-xs font-medium leading-5 text-white/75 sm:text-sm">
                  Tu casillero quedó activo y listo para iniciar operaciones con trazabilidad segura.
                </p>
              </div>

              <div className="relative mt-8 grid grid-cols-2 gap-3 text-left">
                <div className="border border-white/15 bg-white/10 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                    Estado
                  </p>
                  <p className="mt-2 text-xs font-bold sm:text-sm">Aprobado</p>
                </div>
                <div className="border border-white/15 bg-white/10 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                    Canal
                  </p>
                  <p className="mt-2 text-xs font-bold sm:text-sm">Corporativo</p>
                </div>
              </div>
            </aside>

            <div className="flex flex-col items-center justify-center px-5 py-7 text-center sm:px-8">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-red-900/20 bg-white shadow-xl shadow-red-950/10 sm:h-28 sm:w-28">
                <div className="absolute inset-2.5 rounded-full border border-gray-200" />
                <img
                  src={iconoConfirmacion}
                  alt="Registro confirmado"
                  className="relative h-15 w-15 sm:h-30 sm:w-30"
                />
              </div>

              <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-red-900">
                Activación exitosa
              </p>
              <h2 className="mt-2 max-w-lg text-xl font-black leading-tight text-slate-900 sm:text-2xl">
                Tu casillero ha sido creado con éxito
              </h2>
              <p className="mt-3 max-w-sm text-xs font-medium leading-5 text-slate-500 sm:text-sm">
                Guarda este código de referencia. También enviaremos a tu correo toda la información de uso.
              </p>

              <div className="mt-6 w-full max-w-sm rounded-2xl border border-gray-200 bg-slate-50/90 p-3 shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Código de casillero
                </p>
                <p className="mt-2 break-all rounded-xl border border-red-900/10 bg-white px-4 py-3 text-xl font-black tracking-[0.1em] text-red-900 shadow-sm sm:text-2xl">
                  {codigoReferencia}
                </p>
              </div>

              <div className="mt-5 w-full max-w-sm border-l-4 border-red-900 bg-red-900/5 px-4 py-3 text-left">
                <p className="text-xs font-black text-red-900 sm:text-sm">Importante</p>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-600 sm:text-sm">
                  A tu correo llegará toda la información de uso.
                </p>
              </div>

              <button
                onClick={() => navigate("/")}
                className="mt-6 inline-flex w-full max-w-[180px] items-center justify-center rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 sm:w-auto"
              >
                Volver
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs font-semibold text-slate-600">
          Copyright © Wolfbox Software 2025
        </p>
      </section>
    </main>
  );
}
