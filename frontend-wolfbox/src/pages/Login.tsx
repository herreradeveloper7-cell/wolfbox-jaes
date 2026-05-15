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
          body: JSON.stringify({ email, contrasena: password, mantenerSesion: stayLoggedIn }),
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
        if (!data.token) {
          setLoginError("No se recibió token de autenticación. Intenta iniciar sesión nuevamente.");
          setLoading(false);
          return;
        }

        const usuario = data.usuario;
        const storage = stayLoggedIn ? localStorage : sessionStorage;

        localStorage.removeItem("authToken");
        sessionStorage.removeItem("authToken");
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("usuario");
        localStorage.removeItem("cliente");
        sessionStorage.removeItem("cliente");
        storage.setItem("authToken", data.token);


        if (usuario.tipo === "cliente") {
          storage.setItem("cliente", JSON.stringify(usuario));
          navigate("/dashboardCliente");

        } else if (usuario.tipo === "admin" || usuario.tipo === "usuario") {
          storage.setItem("usuario", JSON.stringify(usuario));
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
    <div className="relative min-h-screen overflow-hidden bg-slate-200 px-4 py-3 flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(130,24,26,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(21,128,61,0.12),transparent_35%)]"></div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-xl border border-red-900/10 bg-white/80 px-3.5 py-2 text-xs font-bold text-red-900 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl cursor-pointer"
      >
        ← Volver
      </button>

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/90 shadow-2xl backdrop-blur-xl lg:grid-cols-[1fr_0.9fr]">
        <section className="relative hidden min-h-[430px] overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-6 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-green-500/10 blur-3xl"></div>

          <div>
            <div className="flex justify-center">
              <img
                src={logo}
                alt="Logo Jaes Cargo"
                className="h-32 w-32 rounded-[1.5rem] bg-white/95 object-contain p-4 shadow-2xl shadow-slate-950/45 ring-2 ring-white/85 xl:h-40 xl:w-40"
              />
            </div>

            <div className="mt-5">
              <p className="mb-2 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
                Acceso seguro para todos
              </p>

              <h1 className="max-w-md text-2xl font-black leading-tight tracking-tight">
                Plataforma operativa Jaes Cargo Internacional SAS
              </h1>

              <p className="mt-3 max-w-md text-sm leading-5 text-white/70">
                Gestiona tus envíos logísticos 24/7 con nuestra plataforma, diseñada para ofrecer control total sobre tus envíos. Con Jaes Cargo, tu carga está en buenas manos.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[430px] flex-col justify-center px-6 py-6 sm:px-7 lg:px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-4 flex justify-center lg:hidden">
              <img
                src={logo}
                alt="Logo Jaes Cargo"
                className="h-24 w-24 rounded-[1.5rem] bg-white object-contain p-3 shadow-xl ring-1 ring-red-900/10 sm:h-28 sm:w-28"
              />
            </div>

            <div className="mb-5 text-center lg:text-left">
              <p className="mb-2 inline-flex rounded-full border border-red-900/10 bg-red-900/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-red-900">
                Inicio de sesión
              </p>

              <h2 className="text-xl font-black tracking-tight text-gray-700">
                Bienvenido nuevamente
              </h2>

              <p className="mt-1.5 text-sm text-slate-500">
                Ingresa tus credenciales para acceder al sistema.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                  className="w-full rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                  className="w-full rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                />
              </div>

              {loginError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
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
                className={`w-full rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-xl transition-all duration-300
                  ${
                    loading
                      ? "cursor-not-allowed bg-gray-300 text-gray-500 shadow-none"
                      : "cursor-pointer bg-red-900 hover:-translate-y-0.5 hover:bg-red-950 hover:shadow-red-900/25"
                  }`}
              >
                {loading ? "Validando acceso..." : "Iniciar sesión"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs font-semibold text-slate-400">
              Copyright © Wolfbox Software 2025
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
