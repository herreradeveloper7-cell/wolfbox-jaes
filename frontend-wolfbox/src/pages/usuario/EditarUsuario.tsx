import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconHombre from "../../assets/malecostume-svgrepo-com.svg";
import iconMujer from "../../assets/female-svgrepo-com.svg";
import Swal from "sweetalert2";

export default function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [emailExistente, setEmailExistente] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    tipo_usuario: "",
    genero: "",
    permisos: [] as string[],
  });

  const permisosPorRol: Record<string, string[]> = {
    admin: [
      "Casilleros", "Operaciones", "Operación Logística", "Validación", "Agencias",
      "Operativo Origen", "Operativo Destino", "Contabilidad",
      "Servicio al Cliente", "Control Facturación"
    ],
    usuario: ["Casilleros", "Operaciones", "Servicio al Cliente"],
    cliente: [],
  };

  const obtenerUsuario = async () => {
    try {
      const { data } = await axios.get(`/api/usuarios/detalle/${id}`);

      setFormData({
        nombre: data.nombre,
        email: data.correo,
        password: "",
        tipo_usuario: data.tipo_usuario,
        genero: data.genero,
        permisos: data.permisos || [],
      });
    } catch {
      Swal.fire("Error", "No se pudo cargar la información", "error");
      navigate("/consultar-usuario");
    } finally {
      setLoading(false);
    }
  };

  const validarEmail = async (email: string) => {
    if (!email || !id) return;

    try {
      const { data } = await axios.get(
        `/api/usuarios/validar-email/${email}?id=${id}`
      );

      setEmailExistente(data.existe);
    } catch {
      setEmailExistente(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email") validarEmail(value);

    if (name === "tipo_usuario") {
      setFormData((prev) => ({
        ...prev,
        permisos: permisosPorRol[value] || [],
      }));
    }
  };

  const togglePermiso = (permiso: string) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.includes(permiso)
        ? prev.permisos.filter((p) => p !== permiso)
        : [...prev.permisos, permiso],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || emailExistente || isSubmitting) return;

    const result = await Swal.fire({
      icon: "question",
      title: "¿Guardar cambios?",
      text: "Se actualizará la información del usuario",
      showCancelButton: true,
      confirmButtonColor: "#166534",
      cancelButtonColor: "#b91c1c",
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    try {
      await axios.put(
        `/api/usuarios/editar/${id}`,
        formData
      );

      await Swal.fire({
        icon: "success",
        title: "Usuario actualizado ✅",
        confirmButtonColor: "#166534",
      });

      navigate("/consultar-usuario", { state: { updated: true } });

    } catch (error: any) {
      const msg = error.response?.data?.mensaje || "Error al actualizar";
      Swal.fire("Error", msg, "error");
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    obtenerUsuario();
  }, []);

  return (
    <UserDashboardLayout scrollable>
      <div className="px-6 lg:px-10 py-10 flex justify-center">
        <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-3xl border">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-900 mb-2">
              Editar Usuario
            </h1>

            <p
              onClick={() => navigate("/dashboardUsuario")}
              className="text-sm text-gray-500 cursor-pointer hover:underline flex justify-center items-center gap-1"
            >
              <img src={iconHome} className="w-4 h-4" />
              Dashboard &gt; Seguridad &gt; Editar Usuario
            </p>
          </div>

          <div className="flex flex-col items-center mb-6">
            <img
              src={formData.genero === "femenino" ? iconMujer : iconHombre}
              alt="Avatar"
              className="w-24 h-24 rounded-full shadow-lg border-4 border-gray-100 bg-white"
            />
            <h2 className="mt-3 text-xl font-semibold text-gray-800">
              {formData.nombre}
            </h2>
            <span
              className={`px-4 py-1 mt-2 inline-block rounded-full text-xs font-semibold uppercase ${
                formData.tipo_usuario === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {formData.tipo_usuario || "Rol No definido"}
            </span>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">
              Cargando datos...
            </p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>

              <div>
                <label className="font-semibold text-gray-700 text-sm">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full border border-gray-500 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-green-800 transition"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-sm">Correo *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border border-gray-500 px-3 py-2 rounded-lg outline-none focus:ring-1 transition ${
                    emailExistente
                      ? "border-red-500 focus:ring-red-600"
                      : "focus:ring-green-800"
                  }`}
                  required
                />
                {emailExistente && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    ⚠ Este correo ya está registrado
                  </p>
                )}
              </div>

              <div>
                <label className="font-semibold text-gray-700 text-sm">
                  Nueva Contraseña <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Déjelo vacío si no desea cambiarla"
                  className="w-full border border-gray-500 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-green-800 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Género *</label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="w-full border border-gray-500 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-green-800 transition"
                    required
                  >
                    <option value="">Seleccione...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 text-sm">Rol *</label>
                  <select
                    name="tipo_usuario"
                    value={formData.tipo_usuario}
                    onChange={handleChange}
                    className="w-full border border-gray-500 px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-green-800 transition"
                    required
                  >
                    <option value="">Seleccione...</option>
                    <option value="admin">Administrador</option>
                    <option value="usuario">Usuario</option>
                  </select>
                </div>
              </div>

              {formData.tipo_usuario && (
                <div className="p-5 bg-gray-50 rounded-xl border">
                  <h3 className="font-semibold mb-3 text-gray-700 text-sm">
                    Permisos del Usuario
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {permisosPorRol[formData.tipo_usuario]?.map((permiso) => (
                      <label
                        key={permiso}
                        className="flex justify-between items-center bg-white shadow-sm p-2 rounded-lg border border-gray-500 hover:bg-gray-100"
                      >
                        <span className="text-gray-700 text-sm">{permiso}</span>

                        <input
                          type="checkbox"
                          checked={formData.permisos.includes(permiso)}
                          onChange={() => togglePermiso(permiso)}
                          className="accent-green-600 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg border border-gray-400 bg-gray-100 hover:bg-gray-200 transition"
                  onClick={() => navigate("/consultar-usuario")}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={emailExistente || isSubmitting}
                  className={`px-6 py-2 rounded-lg text-white font-semibold transition ${
                    emailExistente || isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </UserDashboardLayout>
  );
}
