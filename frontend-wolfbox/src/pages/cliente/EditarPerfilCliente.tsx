import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  AtSign,
  Building2,
  MapPin,
  PackageCheck,
  Pencil,
  Phone,
  Save,
  Send,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import ClientDashboardLayout from "../../layouts/ClientDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";

type PerfilCliente = {
  id: number;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  nombre_empresa?: string;
  tipo_cliente?: string;
  nombre: string;
  email: string;
  genero?: string;
  direccion?: string;
  ciudad?: string;
  region?: string;
  pais?: string;
  indicativo?: string;
  celular?: string;
  telefono_fijo?: string;
  codigoReferencia: string;
  solicitudes_creadas: number;
  paquetes_digitados: number;
  destinatarios_creados: number;
};

const perfilVacio: PerfilCliente = {
  id: 0,
  nombre: "",
  email: "",
  codigoReferencia: "",
  solicitudes_creadas: 0,
  paquetes_digitados: 0,
  destinatarios_creados: 0,
};

export default function EditarPerfilCliente() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<PerfilCliente>(perfilVacio);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  const guardarSesion = (cliente: PerfilCliente) => {
    const storage = localStorage.getItem("authToken") ? localStorage : sessionStorage;
    const sesionActual = storage.getItem("cliente");
    let base = {};

    try {
      base = sesionActual ? JSON.parse(sesionActual) : {};
    } catch {
      base = {};
    }

    storage.setItem(
      "cliente",
      JSON.stringify({
        ...base,
        ...cliente,
        codigoReferencia: cliente.codigoReferencia,
      })
    );
  };

  const cargarPerfil = async () => {
    setLoading(true);

    try {
      const { data } = await axios.get("/api/clientes/perfil");
      const cliente = data?.cliente;

      if (!cliente) throw new Error("Perfil no disponible");

      setPerfil(cliente);
      guardarSesion(cliente);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      Swal.fire("Error", "No se pudo cargar la informacion del perfil", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  return (
    <ClientDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden px-0 pb-10 text-gray-800 sm:px-2 lg:px-4">
        <h1 className="mb-2 text-2xl font-bold text-red-900 sm:text-3xl">Mi Perfil</h1>

        <p className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button
            onClick={() => navigate("/dashboardCliente")}
            className="cursor-pointer font-semibold text-gray-700 hover:underline"
          >
            Mi casillero
          </button>
          &gt; Mi perfil
        </p>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-900 border-t-transparent" />
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
              <div className="relative grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-900/10 bg-red-50 text-red-950 sm:h-16 sm:w-16">
                    {perfil.tipo_cliente === "empresarial" ? (
                      <Building2 className="h-8 w-8" />
                    ) : (
                      <UserRound className="h-8 w-8" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                      Perfil del cliente
                    </p>
                    <h2 className="mt-1 break-words text-xl font-black text-gray-800 sm:text-2xl" title={perfil.nombre}>
                      {perfil.nombre || "Cliente"}
                    </h2>
                    <p className="mt-1 font-mono text-sm font-black text-red-950">
                      {perfil.codigoReferencia || "Sin casillero"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalAbierto(true)}
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800"
                >
                  <Pencil className="h-4 w-4" />
                  Editar perfil
                </button>
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <Estadistica icono={Send} label="Solicitudes creadas" valor={perfil.solicitudes_creadas} tono="red" />
              <Estadistica icono={PackageCheck} label="Paquetes digitados" valor={perfil.paquetes_digitados} tono="green" />
              <Estadistica icono={UsersRound} label="Destinatarios" valor={perfil.destinatarios_creados} tono="gray" />
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
              <div className="border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-4 py-5 sm:px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                  Informacion registrada
                </p>
                <h2 className="mt-1 text-xl font-semibold text-gray-800">Datos de contacto</h2>
              </div>

              <div className="grid gap-x-8 gap-y-2 p-4 sm:p-6 md:grid-cols-2">
                <Dato icono={AtSign} label="Correo electronico" valor={perfil.email} />
                <Dato icono={Phone} label="Celular" valor={[perfil.indicativo, perfil.celular].filter(Boolean).join(" ")} />
                <Dato icono={MapPin} label="Direccion" valor={perfil.direccion} />
                <Dato icono={MapPin} label="Ciudad / Region" valor={[perfil.ciudad, perfil.region].filter(Boolean).join(", ")} />
                <Dato icono={Building2} label="Tipo de cliente" valor={perfil.tipo_cliente === "empresarial" ? "Empresarial" : "Personal"} />
                <Dato icono={UserRound} label="Genero" valor={perfil.genero} />
              </div>
            </section>
          </>
        )}
      </div>

      {modalAbierto && (
        <ModalEditarPerfil
          perfil={perfil}
          onClose={() => setModalAbierto(false)}
          onUpdated={async () => {
            setModalAbierto(false);
            await cargarPerfil();
          }}
        />
      )}
    </ClientDashboardLayout>
  );
}

function Estadistica({ icono: Icon, label, valor, tono }: any) {
  const tonos: Record<string, string> = {
    red: "border-red-900/10 bg-red-50 text-red-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    gray: "border-gray-200 bg-slate-50 text-gray-700",
  };

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-5 shadow-sm ${tonos[tono]}`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] opacity-70">{label}</p>
        <p className="mt-1 text-2xl font-black">{valor}</p>
      </div>
    </div>
  );
}

function Dato({ icono: Icon, label, valor }: any) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-gray-100 py-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-950">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</p>
        <p className="mt-1 break-words text-sm font-bold text-gray-700">{valor || "No registrado"}</p>
      </div>
    </div>
  );
}

function ModalEditarPerfil({ perfil, onClose, onUpdated }: { perfil: PerfilCliente; onClose: () => void; onUpdated: () => void }) {
  const [form, setForm] = useState({ ...perfil });
  const [saving, setSaving] = useState(false);
  const empresarial = perfil.tipo_cliente === "empresarial";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await axios.put("/api/clientes/actualizar-perfil", {
        id: form.id,
        primer_nombre: form.primer_nombre,
        segundo_nombre: form.segundo_nombre,
        primer_apellido: form.primer_apellido,
        segundo_apellido: form.segundo_apellido,
        nombre_empresa: form.nombre_empresa,
        email: form.email,
        genero: form.genero,
        direccion: form.direccion,
        ciudad: form.ciudad,
        region: form.region,
        celular: form.celular,
      });

      await Swal.fire("Perfil actualizado", "Los cambios se guardaron correctamente.", "success");
      onUpdated();
    } catch (error: any) {
      console.error("Error actualizando perfil:", error);
      Swal.fire("Error", error.response?.data?.message || "No se pudo actualizar el perfil", "error");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-white/70 bg-white shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">Gestion de perfil</p>
            <h2 className="mt-1 text-xl font-black text-gray-800">Editar mis datos</h2>
          </div>
          <button onClick={onClose} title="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
          {empresarial ? (
            <Campo label="Razon social" name="nombre_empresa" value={form.nombre_empresa || ""} onChange={handleChange} required className="md:col-span-2" />
          ) : (
            <>
              <Campo label="Primer nombre" name="primer_nombre" value={form.primer_nombre || ""} onChange={handleChange} required />
              <Campo label="Segundo nombre" name="segundo_nombre" value={form.segundo_nombre || ""} onChange={handleChange} />
              <Campo label="Primer apellido" name="primer_apellido" value={form.primer_apellido || ""} onChange={handleChange} required />
              <Campo label="Segundo apellido" name="segundo_apellido" value={form.segundo_apellido || ""} onChange={handleChange} />
            </>
          )}

          <Campo label="Correo electronico" name="email" type="email" value={form.email || ""} onChange={handleChange} required />
          <Campo label="Celular" name="celular" value={form.celular || ""} onChange={handleChange} />
          <Campo label="Direccion" name="direccion" value={form.direccion || ""} onChange={handleChange} className="md:col-span-2" />
          <Campo label="Ciudad" name="ciudad" value={form.ciudad || ""} onChange={handleChange} />
          <Campo label="Departamento / Region" name="region" value={form.region || ""} onChange={handleChange} />

          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-gray-500">Genero</span>
            <select name="genero" value={form.genero || ""} onChange={handleChange} className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-red-950 focus:ring-4 focus:ring-red-950/10">
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-end sm:justify-end md:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-600 transition hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function Campo({ label, name, value, onChange, type = "text", required = false, className = "" }: any) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-gray-500">
        {label} {required && <span className="text-red-900">*</span>}
      </span>
      <input name={name} type={type} value={value} onChange={onChange} required={required} className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10" />
    </label>
  );
}
