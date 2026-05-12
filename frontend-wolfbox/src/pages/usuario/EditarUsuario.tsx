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
      "Casilleros",
      "Operaciones",
      "Operacion Logistica",
      "Validacion",
      "Agencias",
      "Operativo Origen",
      "Operativo Destino",
      "Contabilidad",
      "Servicio al Cliente",
      "Control Facturacion",
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
      Swal.fire("Error", "No se pudo cargar la informacion", "error");
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
      title: "Guardar cambios?",
      text: "Se actualizara la informacion del usuario",
      showCancelButton: true,
      confirmButtonColor: "#991b1b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);

    try {
      await axios.put(`/api/usuarios/editar/${id}`, formData);

      await Swal.fire({
        icon: "success",
        title: "Usuario actualizado",
        confirmButtonColor: "#991b1b",
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
      <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2 text-red-900">Digitación de paquetes</h1>
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
            <img src={iconHome} alt="Inicio" className="w-4 h-4" />
            <button
                onClick={() => navigate("/dashboardUsuario")}
                className="font-semibold hover:underline text-gray-700 cursor-pointer"
            >
                Dashboard
            </button>
            &gt; Digitación de paquetes
            </p>

          <div className="overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/95 shadow-xl shadow-slate-400/25">
            <div className="grid lg:grid-cols-[280px_1fr]">
              <aside className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-950 p-5 text-white">
                <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />

                <div className="relative flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="rounded-[1.5rem] bg-white/95 p-3 shadow-xl shadow-slate-950/35 ring-2 ring-white/70">
                    <img
                      src={formData.genero === "femenino" ? iconMujer : iconHombre}
                      alt="Avatar"
                      className="h-24 w-24 rounded-[1rem] object-contain"
                    />
                  </div>

                  <h2 className="mt-4 max-w-full text-xl font-black leading-tight">
                    {formData.nombre || "Usuario"}
                  </h2>
                  <p className="mt-1.5 max-w-full break-all text-xs text-white/70">
                    {formData.email || "correo@empresa.com"}
                  </p>

                  <span
                    className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${
                      formData.tipo_usuario === "admin"
                        ? "bg-white text-red-950"
                        : "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/25"
                    }`}
                  >
                    {formData.tipo_usuario || "Rol no definido"}
                  </span>
                </div>
              </aside>

              <main className="p-4 sm:p-5 lg:p-6">
                {loading ? (
                  <div className="flex min-h-[340px] items-center justify-center">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-center shadow-inner">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-red-900">
                        Cargando datos...
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Estamos consultando la informacion del usuario.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <section className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Correo *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`mt-1.5 w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:bg-white focus:ring-4 ${
                            emailExistente
                              ? "border-red-500 focus:border-red-600 focus:ring-red-600/10"
                              : "border-slate-200 focus:border-red-900 focus:ring-red-900/10"
                          }`}
                          required
                        />
                        {emailExistente && (
                          <p className="mt-2 text-xs font-bold text-red-700">
                            Este correo ya esta registrado.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Nueva Contrasena
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Dejalo vacio si no cambia"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Genero *
                        </label>
                        <select
                          name="genero"
                          value={formData.genero}
                          onChange={handleChange}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10 cursor-pointer"
                          required
                        >
                          <option value="">Seleccione...</option>
                          <option value="masculino">Masculino</option>
                          <option value="femenino">Femenino</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                          Rol *
                        </label>
                        <select
                          name="tipo_usuario"
                          value={formData.tipo_usuario}
                          onChange={handleChange}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10 cursor-pointer"
                          required
                        >
                          <option value="">Seleccione...</option>
                          <option value="admin">Administrador</option>
                          <option value="usuario">Usuario</option>
                        </select>
                      </div>
                    </section>

                    {formData.tipo_usuario && (
                      <section className="rounded-[1.15rem] border border-slate-200 bg-slate-50/80 p-4">
                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-900">
                              Matriz de permisos
                            </p>
                            <h3 className="text-base font-black text-gray-700">
                              Permisos del Usuario
                            </h3>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-sm">
                            {formData.permisos.length} activos
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {permisosPorRol[formData.tipo_usuario]?.map((permiso) => {
                            const checked = formData.permisos.includes(permiso);

                            return (
                              <label
                                key={permiso}
                                className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 shadow-sm transition cursor-pointer ${
                                  checked
                                    ? "border-red-900 bg-white text-gray-700 shadow-red-900/10"
                                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-red-900/30 hover:bg-white"
                                }`}
                              >
                                <span className="text-xs font-bold sm:text-sm">{permiso}</span>

                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePermiso(permiso)}
                                  className="h-4 w-4 cursor-pointer accent-red-900"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 cursor-pointer"
                        onClick={() => navigate("/consultar-usuario")}
                      >
                        Cancelar
                      </button>

                      <button
                        type="submit"
                        disabled={emailExistente || isSubmitting}
                        className={`rounded-xl px-6 py-2.5 text-sm font-black text-white shadow-lg transition ${
                          emailExistente || isSubmitting
                            ? "bg-slate-400 cursor-not-allowed"
                            : "bg-red-900 shadow-red-950/20 hover:-translate-y-0.5 hover:bg-red-950 cursor-pointer"
                        }`}
                      >
                        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                      </button>
                    </div>
                  </form>
                )}
              </main>
            </div>
          </div>

      </div>
    </UserDashboardLayout>
  );
}
