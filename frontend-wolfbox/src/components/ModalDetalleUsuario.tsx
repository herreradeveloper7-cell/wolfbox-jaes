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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      
      <div className={`bg-white rounded-xl shadow-2xl w-[420px] max-h-[90vh] overflow-hidden
        ${closing ? "animate-fade-out" : "animate-fade-in"}
      `}>
        <div className="relative bg-gradient-to-r from-red-900 to-red-700 h-28">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white text-xl hover:scale-110 transition cursor-pointer"
          >
            ✕
          </button>

          <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
            <img
              src={usuario?.genero === "femenino" ? iconMujer : iconHombre}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white"
              alt="avatar"
            />
          </div>
        </div>

        <div className="pt-16 px-6 pb-6 text-center overflow-y-auto max-h-[350px]">
          {loading ? (
            <p className="text-gray-600 font-medium">Cargando información...</p>
          ) : (
            usuario && (
              <>
                <h2 className="text-xl font-bold text-gray-800">{usuario.nombre}</h2>
                <p className="text-sm text-gray-600">{usuario.correo}</p>

                <span
                  className={`px-4 py-1 mt-3 inline-block rounded-full text-xs font-semibold uppercase ${
                    usuario.tipo_usuario === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {usuario.tipo_usuario}
                </span>

                <div className="mt-5 text-left space-y-2 text-gray-700 text-sm">
                  <p><strong>Género:</strong> {usuario.genero}</p>
                </div>

                <div className="mt-6 text-left">
                  <h3 className="text-sm font-bold text-gray-700 mb-2">Permisos:</h3>
                  {usuario.permisos?.length ? (
                    <ul className="grid grid-cols-1 gap-1 text-xs">
                      {usuario.permisos.map((permiso: string, i: number) => (
                        <li key={i} className="bg-gray-100 text-gray-700 py-1 px-2 rounded-lg flex gap-2 items-center">
                          ✅ {permiso}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400">Sin permisos asignados</p>
                  )}
                </div>
              </>
            )
          )}
        </div>

        <div className="border-t px-6 py-3 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition cursor-pointer"
          >
            Cerrar
          </button>

          <button
            onClick={handleEditar}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition cursor-pointer"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
