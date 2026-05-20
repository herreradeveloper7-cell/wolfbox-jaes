import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Ban,
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Truck,
  UserRound,
} from "lucide-react";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout";
import iconHome from "../../../assets/home-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";
import ModalTransportadora from "../../../components/transportadoras/ModalTransportadora";

type Oficina = {
  id: number;
  nombre: string;
};

type Transportadora = {
  id: number;
  oficina_id: number;
  oficina?: string | null;
  nombre: string;
  nit?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  activo: number | boolean;
};

export default function Transportadoras() {
  const navigate = useNavigate();
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modo, setModo] = useState<"crear" | "editar">("crear");
  const [editData, setEditData] = useState<Transportadora | null>(null);

  const totalActivas = useMemo(
    () => transportadoras.filter((item) => Number(item.activo) === 1).length,
    [transportadoras]
  );

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resTransportadoras, resOficinas] = await Promise.all([
        axios.get("/api/transportadoras?incluir_inactivas=1"),
        axios.get("/api/oficinas"),
      ]);

      setTransportadoras(
        Array.isArray(resTransportadoras.data.transportadoras)
          ? resTransportadoras.data.transportadoras
          : []
      );
      setOficinas(Array.isArray(resOficinas.data) ? resOficinas.data : []);
    } catch (error) {
      console.error("Error cargando transportadoras:", error);
      Swal.fire("Error", "No se pudieron cargar las transportadoras", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditData(null);
    setModo("crear");
    setModalOpen(true);
  };

  const abrirEditar = (transportadora: Transportadora) => {
    setEditData(transportadora);
    setModo("editar");
    setModalOpen(true);
  };

  const manejarGuardar = async (data: any) => {
    try {
      if (modo === "crear") {
        await axios.post("/api/transportadoras", data);
        Swal.fire("OK", "Transportadora creada correctamente", "success");
      } else if (editData) {
        await axios.put(`/api/transportadoras/${editData.id}`, data);
        Swal.fire("OK", "Transportadora actualizada correctamente", "success");
      }

      setModalOpen(false);
      setEditData(null);
      await cargarDatos();
    } catch (error: any) {
      console.error("Error guardando transportadora:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.mensaje || "No se pudo guardar la transportadora",
        "error"
      );
    }
  };

  const inhabilitarTransportadora = async (transportadora: Transportadora) => {
    const confirmacion = await Swal.fire({
      title: "Inhabilitar transportadora",
      text: `La transportadora ${transportadora.nombre} ya no estara disponible para nuevos despachos.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Si, inhabilitar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.patch(`/api/transportadoras/${transportadora.id}/inhabilitar`);
      Swal.fire("Listo", "Transportadora inhabilitada correctamente", "success");
      await cargarDatos();
    } catch (error: any) {
      console.error("Error inhabilitando transportadora:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.mensaje || "No se pudo inhabilitar la transportadora",
        "error"
      );
    }
  };

  const dato = (valor?: string | null) => valor || "-";

  return (
    <UserDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 pb-8 text-gray-600 animate-fade-in sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-red-900">
              Transportadoras
            </h1>

            <p className="flex items-center gap-1 text-sm text-gray-500">
              <img src={iconHome} alt="Inicio" className="h-4 w-4" />
              <button
                onClick={() => navigate("/dashboardUsuario")}
                className="cursor-pointer font-semibold text-gray-700 hover:underline"
              >
                Dashboard
              </button>
              &gt; Transportadoras
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={cargarDatos}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-900 cursor-pointer"
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={abrirCrear}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-800 hover:shadow-xl cursor-pointer"
            >
              <Plus size={18} />
              Crear transportadora
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-red-900/10 p-2 text-red-900">
                <Truck size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Total
                </p>
                <p className="text-2xl font-black text-gray-700">
                  {transportadoras.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-green-700/10 p-2 text-green-700">
                <Building2 size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Activas
                </p>
                <p className="text-2xl font-black text-gray-700">{totalActivas}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-gray-900/10 p-2 text-gray-700">
                <Ban size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Inhabilitadas
                </p>
                <p className="text-2xl font-black text-gray-700">
                  {transportadoras.length - totalActivas}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-5 shadow-xl">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />

          <div className="mb-5 flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-wide text-gray-600">
                Listado de transportadoras
              </h2>
              <p className="text-xs text-gray-500">
                Administra las transportadoras asociadas a cada oficina.
              </p>
            </div>
            <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600">
              {oficinas.length} oficinas disponibles
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : transportadoras.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="font-bold text-gray-700">No hay transportadoras registradas.</p>
              <p className="mt-1 text-sm text-gray-500">
                Crea la primera transportadora para poder asociarla a despachos.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-gray-500">
                    <th className="px-4 py-2">Transportadora</th>
                    <th className="px-4 py-2">Oficina</th>
                    <th className="px-4 py-2">Contacto</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {transportadoras.map((item) => {
                    const activa = Number(item.activo) === 1;

                    return (
                      <tr
                        key={item.id}
                        className="group bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50/70 hover:shadow-lg"
                      >
                        <td className="rounded-l-xl border-y border-l border-gray-100 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 rounded-xl bg-red-900/10 p-2 text-red-900 transition group-hover:bg-red-900 group-hover:text-white">
                              <Truck size={18} />
                            </span>
                            <div>
                              <p className="font-black text-gray-700">{item.nombre}</p>
                              <p className="text-xs font-semibold text-gray-500">
                                NIT: {dato(item.nit)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="border-y border-gray-100 px-4 py-4">
                          <p className="font-semibold text-gray-600">
                            {dato(item.oficina)}
                          </p>
                        </td>

                        <td className="border-y border-gray-100 px-4 py-4">
                          <div className="space-y-1 text-xs text-gray-600">
                            <p className="flex items-center gap-2">
                              <UserRound size={14} className="text-red-900" />
                              <span>{dato(item.contacto)}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone size={14} className="text-red-900" />
                              <span>{dato(item.telefono)}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail size={14} className="text-red-900" />
                              <span>{dato(item.email)}</span>
                            </p>
                          </div>
                        </td>

                        <td className="border-y border-gray-100 px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              activa
                                ? "bg-green-700/10 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {activa ? "Activa" : "Inhabilitada"}
                          </span>
                        </td>

                        <td className="rounded-r-xl border-y border-r border-gray-100 px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => abrirEditar(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-900 cursor-pointer"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => inhabilitarTransportadora(item)}
                              disabled={!activa}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-950 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 cursor-pointer"
                            >
                              <Ban size={14} />
                              Inhabilitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ModalTransportadora
        isOpen={modalOpen}
        modo={modo}
        initialData={editData}
        oficinas={oficinas}
        onClose={() => setModalOpen(false)}
        onSave={manejarGuardar}
      />
    </UserDashboardLayout>
  );
}
