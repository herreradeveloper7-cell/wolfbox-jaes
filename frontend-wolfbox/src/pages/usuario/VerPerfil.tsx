import { useEffect, useState } from "react";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";

interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  tipo: string;
  genero?: string;
  fecha_creacion?: string;
}

export default function VerPerfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
  }, []);

  const iniciales = usuario?.nombre
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();

  return (
    <UserDashboardLayout scrollable>
      <div className="px-6 lg:px-10 py-6 text-gray-800 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Ver Perfil</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Ver Perfil
        </p>

        {!usuario ? (
          <div className="mt-6 max-w-4xl rounded-2xl border border-gray-200 bg-white/95 p-8 text-center text-gray-500 shadow-xl shadow-slate-200/60">
            Cargando datos...
          </div>
        ) : (
          <div className="relative mt-6 max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-xl shadow-slate-200/60">
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

            <div className="grid lg:grid-cols-[280px_1fr]">
              <aside className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-900 p-6 text-white">
                <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-green-500/10 blur-2xl"></div>

                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-red-100/80">
                      Perfil activo
                    </p>

                    <div className="mt-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl font-black shadow-2xl shadow-black/20 backdrop-blur">
                      {iniciales || "US"}
                    </div>

                    <h2 className="mt-5 text-2xl font-bold leading-tight">{usuario.nombre}</h2>
                    <p className="mt-2 break-all text-sm text-red-100/80">{usuario.email}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                      {usuario.tipo}
                    </span>
                    <span className="rounded-full border border-green-300/20 bg-green-400/15 px-3 py-1 text-xs font-semibold text-green-100">
                      Sesion verificada
                    </span>
                  </div>
                </div>
              </aside>

              <section className="p-6 sm:p-8">
                <div className="mb-7 flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-red-900/10 bg-red-900/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-red-900">
                      Centro de identidad
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-gray-600">Informacion personal</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Datos principales asociados a tu cuenta del sistema.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-green-50 px-4 py-2">
                    <span className="h-2 w-2 rounded-full bg-green-700 shadow-sm shadow-green-700/40"></span>
                    <span className="text-xs font-semibold text-slate-600">Acceso corporativo</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-slate-50/80 p-4 shadow-inner transition hover:border-red-900/10 hover:bg-white hover:shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Nombre completo
                    </label>
                    <p className="mt-2 text-sm font-bold text-gray-600">{usuario.nombre}</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-slate-50/80 p-4 shadow-inner transition hover:border-red-900/10 hover:bg-white hover:shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Correo electronico
                    </label>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-700">{usuario.email}</p>
                  </div>

                  <div className="rounded-2xl border border-green-900/10 bg-green-50 p-4 shadow-sm transition hover:bg-white">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-800/70">
                      Rol del sistema
                    </label>
                    <p className="mt-2">
                      <span className="inline-flex rounded-full border border-green-700/10 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-green-800 shadow-sm">
                        {usuario.tipo}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-slate-50/80 p-4 shadow-inner transition hover:border-red-900/10 hover:bg-white hover:shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      Fecha de creación
                    </label>

                    <p className="mt-2 text-sm font-bold text-gray-600">
                      {usuario.fecha_creacion
                        ? new Date(usuario.fecha_creacion).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "No disponible"}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
}
