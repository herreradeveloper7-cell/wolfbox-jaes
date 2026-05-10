import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logoJaesHome.png";
import Loader from "../components/Loader";

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [stayLoggedIn, setStayLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState(""); 
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, contrasena: password }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 403) {
            setLoginError(data.message || "Usuario inhabilitado");
          } else {
            setLoginError(data.message || "Error al iniciar sesión");
          }
          setLoading(false);
          return;
        }

        setLoginError("");
        const usuario = data.usuario;


        if (usuario.tipo === "cliente") {
          localStorage.setItem("cliente", JSON.stringify(usuario));
          navigate("/dashboardCliente");

        } else if (usuario.tipo === "admin") {
          localStorage.setItem("usuario", JSON.stringify(usuario));
          navigate("/dashboardUsuario");

        } else {
          setLoginError("⚠️ Tipo de usuario no reconocido");
        }


      } catch (err) {
        console.error("❌ Error al iniciar sesión:", err);
        setLoginError("Error en el servidor");
      } finally {
        setLoading(false);
      }
    };

      
      if (loading) {
        return <Loader />;
      }      
    
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-200 px-4 py-8 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(130,24,26,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(21,128,61,0.12),transparent_35%)]"></div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-2xl border border-red-900/10 bg-white/80 px-4 py-2.5 text-xs font-bold text-red-900 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl cursor-pointer"
      >
        ← Volver
      </button>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_0.95fr]">
        <section className="relative hidden min-h-[540px] overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-green-500/10 blur-3xl"></div>

          <div>
            <img
              src={logo}
              alt="Logo Jaes Cargo"
              className="h-24 w-24 rounded-3xl bg-white/95 object-contain p-4 shadow-2xl"
            />

            <div className="mt-9">
              <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
                Acceso seguro para todos
              </p>

              <h1 className="max-w-md text-3xl font-black leading-tight tracking-tight">
                Plataforma operativa Jaes Cargo Internacional SAS
              </h1>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
                Gestiona tus operaciones logísticas con nuestra plataforma, diseñada para ofrecer seguridad, eficiencia y control total sobre tus envíos. Con Jaes Cargo, tu carga está en buenas manos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <p className="text-xl font-black">24/7</p>
              <p className="mt-1 text-xs text-white/60">Acceso seguro</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <p className="text-xl font-black">Wolfbox</p>
              <p className="mt-1 text-xs text-white/60">Cargo system</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
              <p className="text-xl font-black">JaesCargo</p>
              <p className="mt-1 text-xs text-white/60">Operaciones</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[540px] flex-col justify-center px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 flex justify-center lg:hidden">
              <img
                src={logo}
                alt="Logo Jaes Cargo"
                className="h-24 w-24 object-contain"
              />
            </div>

            <div className="mb-6 text-center lg:text-left">
              <p className="mb-3 inline-flex rounded-full border border-red-900/10 bg-red-900/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-red-900">
                Inicio de sesión
              </p>

              <h2 className="text-2xl font-black tracking-tight text-gray-700">
                Bienvenido nuevamente
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  required
                  placeholder="Ingrese su correo electrónico"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Contraseña
                </label>

                <input
                  type="password"
                  required
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                />
              </div>

              {loginError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                  {loginError}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex cursor-pointer items-center gap-3 text-xs font-semibold text-slate-500 sm:text-sm">
                  <input
                    id="keepSession"
                    type="checkbox"
                    checked={stayLoggedIn}
                    onChange={(e) => setStayLoggedIn(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-red-900"
                  />
                  Mantener sesión iniciada
                </label>

                <button
                  type="button"
                  onClick={() => navigate("/password-reset")}
                  className="text-left text-xs font-bold text-red-900 transition hover:text-red-950 hover:underline sm:text-sm cursor-pointer"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-2xl px-5 py-3 text-sm font-black text-white shadow-xl transition-all duration-300
                  ${
                    loading
                      ? "cursor-not-allowed bg-gray-300 text-gray-500 shadow-none"
                      : "cursor-pointer bg-red-900 hover:-translate-y-0.5 hover:bg-red-950 hover:shadow-red-900/25"
                  }`}
              >
                {loading ? "Validando acceso..." : "Iniciar sesión"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs font-semibold text-slate-400">
              Copyright © Wolfbox Software 2025
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
