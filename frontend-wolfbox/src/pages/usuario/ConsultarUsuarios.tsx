import { useEffect, useState } from "react";
import axios from "axios";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconHombre from "../../assets/malecostume-svgrepo-com.svg";
import iconMujer from "../../assets/female-svgrepo-com.svg";
import ModalDetalleUsuario from "../../components/ModalDetalleUsuario";
import Swal from "sweetalert2";


export default function ConsultarUsuario() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [usuarioDetalle, setUsuarioDetalle] = useState<any | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [usuarioLogueadoId, setUsuarioLogueadoId] = useState<number | null>(null);

  const obtenerUsuarios = async () => {
    try {
      const { data } = await axios.get("http://localhost:3000/api/usuarios/listar");
      const filtrados = data.filter((u: any) => u.tipo_usuario !== "cliente");
      setUsuarios(filtrados);
      setUsuariosFiltrados(filtrados);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerUsuarios();

    const usuarioLS = JSON.parse(localStorage.getItem("usuario") || "null");
    if (usuarioLS?.id) {
      setUsuarioLogueadoId(usuarioLS.id);
    }
  }, []);

  const verDetalleUsuario = async (id: number) => {
    setCargandoDetalle(true);
    setUsuarioDetalle(null);
    setShowModal(true);

    try {
      const { data } = await axios.get(`http://localhost:3000/api/usuarios/detalle/${id}`);
      setUsuarioDetalle(data);
    } catch (err) {
      console.error("❌ Error obteniendo detalle", err);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    const filtro = usuarios.filter((u) =>
      Object.values(u).join(" ").toLowerCase().includes(value.toLowerCase())
    );
    setUsuariosFiltrados(filtro);
  };

  const cambiarEstado = async (id: number, estado: string) => {
    try {
      await axios.put(`http://localhost:3000/api/usuarios/estado/${id}`, { estado });
      await obtenerUsuarios();
      Swal.fire({
        icon: "success",
        title: estado === "activo" ? "Usuario habilitado" : "Usuario inhabilitado",
      });
    } catch {
      Swal.fire("Error", "No se pudo actualizar el estado", "error");
    }
  };

  const eliminarUsuario = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar usuario?",
      text: "Esta acción no se puede deshacer",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Eliminar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:3000/api/usuarios/eliminar/${id}`);
      await obtenerUsuarios();
      Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
    } catch {
      Swal.fire("Error", "No se pudo eliminar", "error");
    }
  };

  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-6 lg:px-10 pb-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Consultar Usuarios</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Consultar Usuario
        </p>

        <div className="mb-4 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o rol..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg outline-none transition-all
                       focus:ring-2 focus:ring-green-600 focus:border-green-600"
          />
        </div>

                {!loading && (
          <div className="bg-white shadow-lg rounded-lg overflow-x-auto border">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 uppercase text-sm">
                <tr>
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Correo</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Género</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-2 px-4 flex items-center gap-3">
                      <img
                        src={u.genero === "femenino" ? iconMujer : iconHombre}
                        className="w-8 h-8 rounded-full"
                      />
                      {u.nombre}
                    </td>

                    <td className="py-2 px-4 text-gray-600">{u.correo}</td>
                    <td className="py-2 px-4 capitalize">{u.tipo_usuario}</td>
                    <td className="py-2 px-4 capitalize">{u.genero}</td>

                    <td className="py-2 px-4 text-center space-x-2">
                      <button
                        onClick={() => verDetalleUsuario(u.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition font-medium"
                      >
                        Ver Perfil
                      </button>

                      {/* ✅ Ocultar si es el usuario logueado */}
                      {u.id !== usuarioLogueadoId && (
                        <>
                          <button
                            onClick={() =>
                              cambiarEstado(u.id, u.estado === "activo" ? "inhabilitado" : "activo")
                            }
                            className={`text-xs font-semibold px-3 py-1 rounded 
                              ${
                                u.estado === "activo"
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                              }`}
                          >
                            {u.estado === "activo" ? "Inhabilitar" : "Habilitar"}
                          </button>

                          <button
                            onClick={() => eliminarUsuario(u.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalDetalleUsuario
          usuario={usuarioDetalle}
          loading={cargandoDetalle}
          onClose={() => setShowModal(false)}
        />
      )}
    </UserDashboardLayout>
  );
}
