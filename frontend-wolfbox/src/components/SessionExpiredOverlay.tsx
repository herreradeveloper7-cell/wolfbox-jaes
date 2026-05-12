import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logoJaesHome.png";

const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/confirmacion",
  "/consulta-hawb",
  "/password-reset",
]);

export default function SessionExpiredOverlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      if (!publicPaths.has(location.pathname)) {
        setVisible(true);
      }
    };

    window.addEventListener("wolfbox:session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("wolfbox:session-expired", handleSessionExpired);
    };
  }, [location.pathname]);

  if (!visible) return null;

  const handleLogin = () => {
    setVisible(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-950/90 px-4 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(127,29,29,0.34),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_36%)]" />

      <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white shadow-2xl shadow-black/40">
        <div className="h-2 bg-red-900" />

        <div className="px-8 py-9 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-slate-100 p-4 shadow-xl ring-1 ring-slate-200">
            <img src={logo} alt="Jaes Cargo" className="h-full w-full object-contain" />
          </div>

          <p className="mt-7 text-xs font-black uppercase tracking-[0.28em] text-red-900">
            Sesión finalizada
          </p>

          <h1 className="mt-3 text-2xl font-black text-slate-950">
            Tu tiempo de actividad expiró
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Por seguridad bloqueamos el acceso al sistema. Inicia sesión nuevamente para continuar trabajando.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            className="mt-7 w-full rounded-2xl bg-red-900 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-red-950/25 transition hover:-translate-y-0.5 hover:bg-red-950 cursor-pointer"
          >
            Iniciar sesión
          </button>
        </div>
      </section>
    </div>
  );
}
