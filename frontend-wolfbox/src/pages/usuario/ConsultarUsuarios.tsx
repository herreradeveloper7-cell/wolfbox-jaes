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
      const { data } = await axios.get("/api/usuarios/listar");
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
      const { data } = await axios.get(`/api/usuarios/detalle/${id}`);
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
    const esActivacion = estado === "activo";
    const result = await Swal.fire({
      icon: "warning",
      title: esActivacion ? "¿Habilitar usuario?" : "¿Inhabilitar usuario?",
      text: esActivacion
        ? "El usuario podra iniciar sesion y operar nuevamente en el sistema."
        : "El usuario no podra iniciar sesion ni operar en el sistema mientras este inhabilitado.",
      showCancelButton: true,
      confirmButtonColor: esActivacion ? "#15803d" : "#991b1b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: esActivacion ? "Si, habilitar" : "Si, inhabilitar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.put(`/api/usuarios/estado/${id}`, { estado });
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
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Eliminar",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(`/api/usuarios/eliminar/${id}`);
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

        <div className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-xl shadow-slate-200/60">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

          <div className="flex flex-col gap-5 border-b border-gray-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-red-900/10 bg-red-900/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-red-900">
                Directorio interno
              </div>
              <h2 className="mt-3 text-xl font-bold text-slate-800">Usuarios corporativos</h2>
              <p className="mt-1 text-xs text-slate-500">
                Gestiona perfiles, roles y estado operativo del equipo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-900/10 bg-green-50 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-green-700 shadow-sm shadow-green-700/40"></span>
                <span className="text-xs font-semibold text-slate-600">
                  Registros: <span className="text-slate-900">{usuariosFiltrados.length}</span>
                </span>
              </div>

              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o rol..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 py-3 pl-9 pr-4 text-sm text-slate-700 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-green-700 focus:bg-white focus:ring-4 focus:ring-green-700/10"
                />
              </div>
            </div>
          </div>

          {!loading && (
            <div className="overflow-x-auto px-4 py-5">
              <table className="w-full min-w-[850px] border-separate border-spacing-y-3 text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 pb-1">Nombre</th>
                    <th className="px-4 pb-1">Correo</th>
                    <th className="px-4 pb-1">Rol</th>
                    <th className="px-4 pb-1">Genero</th>
                    <th className="px-4 pb-1 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 px-4 py-12 text-center text-sm font-medium text-slate-400">
                        No se encontraron usuarios con ese criterio.
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((u) => (
                      <tr
                        key={u.id}
                        className="group rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80 hover:ring-red-900/10"
                      >
                        <td className="rounded-l-2xl px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-900/20 to-green-700/20 blur-md opacity-0 transition group-hover:opacity-100"></div>
                              <img
                                src={u.genero === "femenino" ? iconMujer : iconHombre}
                                className="relative h-10 w-10 rounded-2xl border border-gray-200 bg-slate-50 p-1.5 shadow-sm"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{u.nombre}</p>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                ID #{u.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          <span className="inline-flex max-w-[260px] truncate rounded-xl border border-gray-100 bg-slate-50 px-3 py-1.5 text-xs font-medium">
                            {u.correo}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize border
                              ${
                                u.tipo_usuario?.toLowerCase() === "admin"
                                  ? "border-red-900/10 bg-red-900/5 text-red-900"
                                  : "border-green-500/10 bg-green-500/5 text-green-800"
                              }`}
                          >
                            {u.tipo_usuario}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600 shadow-sm">
                            {u.genero}
                          </span>
                        </td>

                        <td className="rounded-r-2xl px-4 py-4">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <button
                              onClick={() => verDetalleUsuario(u.id)}
                              className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-900 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-900 hover:text-white hover:shadow-md"
                            >
                              Ver Perfil
                            </button>

                            {u.id !== usuarioLogueadoId && (
                              <>
                                <button
                                  onClick={() =>
                                    cambiarEstado(u.id, u.estado === "activo" ? "inhabilitado" : "activo")
                                  }
                                  className={`rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                    u.estado === "activo"
                                      ? "bg-yellow-700 text-white hover:bg-yellow-900"
                                      : "bg-green-700 text-white hover:bg-green-800"
                                  }`}
                                >
                                  {u.estado === "activo" ? "Inhabilitar" : "Habilitar"}
                                </button>

                                <button
                                  onClick={() => eliminarUsuario(u.id)}
                                  className="rounded-xl bg-red-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-950 hover:shadow-md"
                                >
                                  Eliminar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
