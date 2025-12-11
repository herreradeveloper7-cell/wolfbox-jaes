import { useEffect, useState } from "react";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";

interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  tipo: string;
  genero?: string;
  telefono?: string;
}

export default function VerPerfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserDashboardLayout scrollable>
      <div className="px-6 lg:px-10 py-6 text-gray-800">
        <h1 className="text-3xl font-bold text-red-900 mb-2">Mi Perfil</h1>

        {!usuario ? (
          <p className="text-gray-600">Cargando datos...</p>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 mt-4 max-w-2xl space-y-4">

            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-sm text-gray-700">Nombre completo</label>
              <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded">{usuario.nombre}</p>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-sm text-gray-700">Correo electrónico</label>
              <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded">{usuario.email}</p>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-sm text-gray-700">Rol del sistema</label>
              <p className="text-green-700 px-3 py-2 bg-green-50 rounded font-bold uppercase text-sm tracking-wide">
                {usuario.tipo}
              </p>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-semibold text-sm text-gray-700">Teléfono</label>
              <p className="text-gray-900 px-3 py-2 bg-gray-50 rounded">
                {usuario.telefono || "No registrado"}
              </p>
            </div>

          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
}
