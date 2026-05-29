import { useState } from "react";
import axios from "axios";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../../assets/home-svgrepo-com.svg";
import Swal from "sweetalert2";


export default function CrearUsuario() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailExistente, setEmailExistente] = useState(false);
  const [errors, setErrors] = useState({
    nombre: "",
    email: "",
    password: "",
    tipo: "",
    genero: ""
  });

  const validarEmail = async (email: string) => {
    if (!email) return;

    try {
      const { data } = await axios.get(`/api/usuarios/validar-email/${email}`);
      setEmailExistente(data.existe);
    } catch (error) {
      console.error("Error validando email", error);
    }
  };

  const validarCampo = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "nombre":
        if (!value.trim()) error = "El nombre es obligatorio";
        else if (value.length < 3) error = "Mínimo 3 caracteres";
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) error = "Correo inválido";
        break;

      case "password":
        if (value.length < 6) error = "Mínimo 6 caracteres";
        break;

      case "genero":
        if (!value) error = "Seleccione un género";
        break;

      case "tipo":
        if (!value) error = "Seleccione un rol";
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    tipo: "",
    genero: ""
  });

  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      password: "",
      tipo: "",
      genero: "",
    });
    setPermisosSeleccionados([]);
  };

  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);
  const todosLosPermisos = [
    "Casilleros",
    "Operaciones",
    "Tracking",
    "Reportes",
    "Seguridad",
    "Configuracion",
    "Perfil",
  ];

  const permisosPorRol: Record<string, string[]> = {
    admin: [
      "Casilleros",
      "Operaciones",
      "Operación Logística",
      "Validación",
      "Tracking",
      "Reportes",
      "Seguridad",
      "Configuracion",
      "Perfil",
      "Control Facturación",
    ],
    usuario: ["Casilleros", "Operaciones", "Tracking", "Perfil"],
    cliente: [],
  };

  const obtenerPermisosPorRol = (rol: string) => {
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

    return permisosPorRol[rol] || [];
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    validarCampo(name, value);

    if (name === "email") {
      validarEmail(value);
    }
  };


  const handleRolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tipo = e.target.value;
    setFormData({ ...formData, tipo });
    setPermisosSeleccionados(obtenerPermisosPorRol(tipo));
  };

  const togglePermiso = (permiso: string) => {
    setPermisosSeleccionados((prev) =>
      prev.includes(permiso)
        ? prev.filter((p) => p !== permiso)
        : [...prev, permiso]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; 
    setIsSubmitting(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Correo inválido",
        text: "Por favor ingrese un correo válido",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    if (formData.password.length < 6) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña muy corta",
        text: "Debe tener mínimo 6 caracteres",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

    if (!formData.tipo) {
      Swal.fire({
        icon: "info",
        title: "Rol requerido",
        text: "Debe seleccionar un rol para el usuario",
        confirmButtonColor: "#b91c1c",
      });
      return;
    }

  try {
      await axios.post("/api/usuarios/crear", {
        ...formData,
        permisos: permisosSeleccionados,
      });

      await Swal.fire({
        icon: "success",
        title: "Usuario creado",
        text: "El usuario ha sido creado correctamente",
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#166534",
      });

      resetForm();
      navigate("/dashboardUsuario");

    } catch (error: any) {
      const msg = error.response?.data?.mensaje || "Error al crear usuario";

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: msg,
        confirmButtonColor: "#b91c1c",
      });
    }
  };


  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-6 lg:px-10">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Crear Usuario</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Crear Usuario
        </p>

        <form
          className="bg-white shadow-2xl shadow-slate-200/40 rounded-[32px] border border-gray-200 p-8 max-w-3xl mx-auto space-y-8"
          onSubmit={handleSubmit}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-900/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-red-900">
              CREACIÓN CORPORATIVA
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Registrar usuario</h2>
              <p className="text-sm text-slate-500">
                Completa los datos de acceso y define permisos con un estilo moderno y profesional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 shadow-sm outline-none transition duration-300 focus:ring-2 focus:ring-red-900/10 ${
                  errors.nombre
                    ? "border-red-500 focus:border-red-600"
                    : formData.nombre
                    ? "border-green-700 focus:border-green-800"
                    : "border-gray-300 focus:border-green-800"
                }`}
                required
              />
              {errors.nombre && (
                <p className="text-red-600 text-xs mt-1 font-medium">{errors.nombre}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Correo *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 shadow-sm outline-none transition duration-300 focus:ring-2 focus:ring-red-900/10 ${
                  errors.email
                    ? "border-red-500 focus:border-red-600"
                    : formData.email
                    ? "border-green-700 focus:border-green-800"
                    : "border-gray-300 focus:border-green-800"
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1 font-medium">{errors.email}</p>
              )}
              {emailExistente && (
                <p className="text-red-600 text-xs mt-1 font-medium">
                  ⚠ Este correo ya está registrado
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 shadow-sm outline-none transition duration-300 focus:ring-2 focus:ring-red-900/10 ${
                  errors.password
                    ? "border-red-500 focus:border-red-600"
                    : formData.password
                    ? "border-green-700 focus:border-green-800"
                    : "border-gray-300 focus:border-green-800"
                }`}
                required
              />

              {formData.password && (
                <div className="mt-1">
                  {formData.password.length < 6 && (
                    <p className="text-red-600 text-xs font-semibold">Seguridad: ❌ Débil</p>
                  )}
                  {formData.password.length >= 6 && formData.password.length < 10 && (
                    <p className="text-yellow-500 text-xs font-semibold">Seguridad: 🟡 Media</p>
                  )}
                  {formData.password.length >= 10 && (
                    <p className="text-green-600 text-xs font-semibold">Seguridad: 🟢 Alta</p>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="text-red-600 text-xs mt-1 font-medium">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Género *
              </label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                required
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 shadow-sm outline-none transition duration-300 focus:ring-2 focus:ring-red-900/10 ${
                  errors.genero
                    ? "border-red-500 focus:border-red-600"
                    : formData.genero
                    ? "border-green-700 focus:border-green-800"
                    : "border-gray-300 focus:border-green-800"
                }`}
              >
                <option value="">Seleccione...</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
              {errors.genero && (
                <p className="text-red-600 text-xs mt-1 font-medium">{errors.genero}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rol *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleRolChange}
                required
                className={`w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 bg-slate-50 shadow-sm outline-none transition duration-300 focus:ring-2 focus:ring-red-900/10 ${
                  errors.tipo
                    ? "border-red-500 focus:border-red-600"
                    : formData.tipo
                    ? "border-green-700 focus:border-green-800"
                    : "border-gray-300 focus:border-green-800"
                }`}
              >
                <option value="">Seleccione...</option>
                <option value="admin">Administrador</option>
                <option value="usuario">Usuario</option>
              </select>
              {errors.tipo && (
                <p className="text-red-600 text-xs mt-1 font-medium">{errors.tipo}</p>
              )}
            </div>
          </div>

          {formData.tipo && formData.tipo !== "cliente" && (
            <div className="rounded-[28px] border border-slate-200 bg-slate-950/5 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">Permisos del usuario</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {todosLosPermisos.map((permiso) => (
                  <label
                    key={permiso}
                    className="flex justify-between items-center rounded-2xl border border-slate-200 bg-white/90 p-3 transition hover:border-green-600"
                  >
                    <span className="text-slate-700 text-sm">{permiso}</span>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={permisosSeleccionados.includes(permiso)}
                        onChange={() => togglePermiso(permiso)}
                      />
                      <span
                        className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ${
                          permisosSeleccionados.includes(permiso)
                            ? "bg-green-500"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                            permisosSeleccionados.includes(permiso)
                              ? "translate-x-5"
                              : ""
                          }`}
                        />
                      </span>
                    </label>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end sm:items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={resetForm}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                emailExistente ||
                Object.values(errors).some(error => error !== "")
              }
              className={`inline-flex items-center justify-center rounded-2xl px-6 py-2.5 text-sm font-semibold text-white transition-all ${
                isSubmitting ||
                emailExistente ||
                Object.values(errors).some(error => error !== "")
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 shadow-lg shadow-green-600/20 hover:bg-green-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        </form>

      </div>        
    </UserDashboardLayout>
  );
}
