import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logoJaesHome.png";

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMensaje("");

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico para continuar.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setMensaje(
        "Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña."
      );
      setEmail("");
    } catch (err) {
      console.error("Error solicitando recuperación:", err);
      setError("No fue posible procesar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-200 px-4 py-8 text-slate-900 sm:px-6">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(127, 29, 29, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127, 29, 29, 0.08) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />
      <div className="absolute -left-24 top-16 h-56 w-56 rotate-45 border border-red-900/20" />
      <div className="absolute -right-28 bottom-16 h-72 w-72 rotate-45 border border-red-900/20" />
      <div className="absolute left-0 top-0 h-full w-24 bg-gradient-to-r from-white/60 to-transparent" />
      <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-white/60 to-transparent" />

      <button
        type="button"
        onClick={() => navigate("/login")}
        className="absolute left-5 top-5 z-20 rounded-2xl border border-red-900/10 bg-white/80 px-4 py-2.5 text-xs font-bold text-red-900 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl"
      >
        ← Volver
      </button>

      <section className="relative z-10 w-full max-w-3xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/90 shadow-2xl shadow-slate-400/40 backdrop-blur">
          <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative hidden overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-7 text-white lg:flex lg:flex-col lg:justify-between">
              <div className="absolute inset-0 opacity-20">
                <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.35)_49%,transparent_50%,transparent_100%)] bg-[length:28px_28px]" />
              </div>

              <div className="relative">
                <img
                  src={logo}
                  alt="Logo Jaes Cargo"
                  className="h-24 w-24 rounded-3xl bg-white/95 object-contain p-4 shadow-2xl"
                />
                <p className="mt-8 text-[11px] font-black uppercase tracking-[0.26em] text-white/70">
                  Acceso seguro
                </p>
                <h1 className="mt-4 max-w-sm text-3xl font-black leading-tight">
                  Recupera el acceso a tu cuenta
                </h1>
                <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-white/75">
                  Solicita las instrucciones de restablecimiento y continúa operando en la plataforma Jaes Cargo.
                </p>
              </div>

            </aside>

            <div className="flex flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
              <div className="mx-auto w-full max-w-sm">
                <div className="mb-6 flex justify-center lg:hidden">
                  <img src={logo} alt="Logo Jaes Cargo" className="h-24 w-24 object-contain" />
                </div>

                <div className="mb-6 text-center lg:text-left">
                  <p className="mb-3 inline-flex rounded-full border border-red-900/10 bg-red-900/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-red-900">
                    Restablecimiento
                  </p>
                  <h2 className="text-2xl font-black tracking-tight text-gray-700">
                    ¿Olvidaste tu contraseña?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones para recuperar el acceso.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                        setMensaje("");
                      }}
                      placeholder="Ingrese su correo electrónico"
                      className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                      {error}
                    </div>
                  )}

                  {mensaje && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
                      {mensaje}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl transition-all duration-300 ${
                      loading
                        ? "cursor-not-allowed bg-gray-300 text-gray-500 shadow-none"
                        : "cursor-pointer bg-red-900 hover:-translate-y-0.5 hover:bg-red-950 hover:shadow-red-900/25"
                    }`}
                  >
                    {loading ? "Enviando instrucciones..." : "Enviar instrucciones"}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    Volver al inicio de sesión
                  </button>
                </form>

                <p className="mt-6 text-center text-xs font-semibold text-slate-400">
                  Copyright © Wolfbox Software 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
