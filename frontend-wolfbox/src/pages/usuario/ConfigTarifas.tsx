import { useEffect, useState } from "react";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import iconHome from "../../assets/home-svgrepo-com.svg";
import Swal from "sweetalert2";
import axios from "axios";
import ModalServicio from "../../components/servicios/ModalServicio";

export default function ConfigTarifas() {
  const navigate = useNavigate();

  const [servicios, setServicios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [modo, setModo] = useState<"crear" | "editar">("crear");

  // ============================================================
  // 1. Cargar servicios al iniciar
  // ============================================================
  const cargarServicios = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/servicios");
      setServicios(data.servicios || []);
    } catch (error) {
      console.error("❌ Error cargando servicios:", error);
      Swal.fire("Error", "No se pudieron cargar los servicios", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarServicios();
  }, []);

  // ============================================================
  // 2. Abrir modal crear
  // ============================================================
  const abrirCrear = () => {
    setEditData(null);
    setModo("crear");
    setModalOpen(true);
  };

  // ============================================================
  // 3. Abrir modal editar
  // ============================================================
  const abrirEditar = (srv: any) => {
    setEditData(srv);
    setModo("editar");
    setModalOpen(true);
  };

  // ============================================================
  // 4. Guardar servicio (crear o editar)
  // ============================================================
  const manejarGuardar = async (data: any) => {
    try {
      if (modo === "crear") {
        await axios.post("/api/servicios", data);
        Swal.fire("OK", "Servicio creado correctamente", "success");
      } else {
        await axios.put(`/api/servicios/${editData.id}`, data);
        Swal.fire("OK", "Servicio actualizado correctamente", "success");
      }
      cargarServicios();

    } catch (error) {
      console.error("❌ Error guardando servicio:", error);
      Swal.fire("Error", "No se pudo guardar el servicio", "error");
    }
  };

  // ============================================================
  // 5. Eliminar servicio
  // ============================================================
  const eliminarServicio = async (id: number) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar servicio?",
      text: "Esta acción no puede deshacerse",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#777",
      confirmButtonText: "Sí, eliminar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`/api/servicios/${id}`);
      Swal.fire("Eliminado", "Servicio eliminado", "success");
      cargarServicios();
    } catch (error) {
      console.error("❌ Error eliminando servicio:", error);
      Swal.fire("Error", "No se pudo eliminar el servicio", "error");
    }
  };

  // ============================================================
  // 🌟 RENDER DEL COMPONENTE
  // ============================================================
  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">

        <h1 className="text-3xl font-bold mb-2 text-red-900">Configuración de Tarifas</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Configuración de Tarifas
        </p>

        <div className="flex justify-end mb-4">
          <button
            onClick={abrirCrear}
            className="bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
          >
            + Crear servicio
          </button>
        </div>

        {/* TABLA */}
        <div className="bg-white shadow-lg border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-red-900 mb-4">Listado de servicios</h3>

          {loading ? (
            <p className="text-center py-10 text-gray-500">Cargando...</p>
          ) : servicios.length === 0 ? (
            <p className="text-center py-10 text-gray-500">No hay servicios registrados.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-2 px-3 border-b">Código</th>
                  <th className="py-2 px-3 border-b">Nombre</th>
                  <th className="py-2 px-3 border-b">Tipo</th>
                  <th className="py-2 px-3 border-b">Seguro (%)</th>
                  <th className="py-2 px-3 border-b text-center">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {servicios.map((srv) => (
                  <tr key={srv.id} className="hover:bg-gray-50 transition">
                    <td className="py-2 px-3 border-b">{srv.codigo}</td>
                    <td className="py-2 px-3 border-b">{srv.nombre}</td>
                    <td className="py-2 px-3 border-b">{srv.tipo}</td>
                    <td className="py-2 px-3 border-b">{srv.porcentaje_seguro}%</td>

                    <td className="py-2 px-3 border-b text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                          onClick={() => abrirEditar(srv)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-red-700 hover:text-red-900 font-semibold"
                          onClick={() => eliminarServicio(srv.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

        {/* MODAL */}
        <ModalServicio
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialData={editData}
          modo={modo}
          onSave={manejarGuardar}
        />
    </UserDashboardLayout>
  );
}
