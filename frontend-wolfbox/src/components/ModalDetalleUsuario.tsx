import { useState } from "react";
import { useNavigate } from "react-router-dom";
import iconHombre from "../assets/malecostume-svgrepo-com.svg";
import iconMujer from "../assets/female-svgrepo-com.svg";

interface ModalDetalleUsuarioProps {
  usuario: any;
  loading: boolean;
  onClose: () => void;
}

export default function ModalDetalleUsuario({
  usuario,
  loading,
  onClose,
}: ModalDetalleUsuarioProps) {
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300);
  };

  const handleEditar = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      navigate(`/usuarios/editar/${usuario.id}`);
    }, 280);
  };

  const obtenerModulosPorRol = (rol?: string) => {
    if (rol === "admin") {
      return [
        "Casilleros",
        "Operaciones",
        "Tracking",
        "Reportes",
        "Seguridad",
        "Configuracion",
        "Perfil",
      ];
    }

    if (rol === "usuario") {
      return ["Casilleros", "Operaciones", "Tracking", "Perfil"];
    }

    return [];
  };

  const permisos =
    Array.isArray(usuario?.permisos) && usuario.permisos.length
      ? usuario.permisos
      : obtenerModulosPorRol(usuario?.tipo_usuario);
  const esAdmin = usuario?.tipo_usuario === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-[1.15rem] border border-white/70 bg-white shadow-xl shadow-slate-950/25 ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 px-5 pb-11 pt-4 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.35)_49%,transparent_50%,transparent_100%)] bg-[length:26px_26px]" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/55 to-transparent" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">
                Perfil del sistema
              </p>
              <h2 className="mt-1.5 text-xl font-black leading-tight">
                Detalle de usuario
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-red-950 cursor-pointer"
              aria-label="Cerrar modal"
            >
              X
            </button>
          </div>
        </div>

        <div className="relative px-5 pb-4">
          <div className="-mt-9 flex flex-col items-center text-center">
            <div className="rounded-full bg-white p-1 shadow-xl shadow-slate-900/15 ring-4 ring-white">
              <img
                src={usuario?.genero === "femenino" ? iconMujer : iconHombre}
                className="h-20 w-20 rounded-full bg-slate-50 object-cover"
                alt="Avatar de usuario"
              />
            </div>

            {loading ? (
              <div className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold text-slate-500">Cargando informacion...</p>
              </div>
            ) : (
              usuario && (
                <>
                  <h3 className="mt-3 text-xl font-black text-gray-800">
                    {usuario.nombre}
                  </h3>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                    {usuario.correo}
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full border px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${
                      esAdmin
                        ? "border-red-900/15 bg-red-900/10 text-red-900"
                        : "border-green-200 bg-green-50 text-green-700"
                    }`}
                  >
                    {usuario.tipo_usuario || "sin rol"}
                  </span>

                  <div className="mt-4 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <InfoBlock label="Genero" value={usuario.genero || "No registrado"} />
                    <InfoBlock label="Estado" value={usuario.estado || "No registrado"} />
                  </div>

                  <div className="mt-4 w-full rounded-xl border border-gray-200 bg-slate-50/90 p-3 text-left shadow-inner">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-900">
                          Accesos
                        </p>
                        <h4 className="mt-0.5 text-sm font-black text-gray-700">
                          Modulos permitidos
                        </h4>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm">
                        {permisos.length}
                      </span>
                    </div>

                    {permisos.length ? (
                      <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1">
                        {permisos.map((permiso: string, index: number) => (
                          <div
                            key={`${permiso}-${index}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            <span className="break-words">{permiso}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-2 text-xs font-bold text-slate-400">
                        Sin permisos asignados
                      </p>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2.5 border-t border-gray-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-100 cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleEditar}
            disabled={!usuario || loading}
            className="rounded-lg bg-red-900 px-4 py-2 text-xs font-black text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:bg-red-950 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none cursor-pointer"
          >
            Editar usuario
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 break-words text-xs font-black text-slate-700">
        {value}
      </p>
    </div>
  );
}
