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


  const abrirCrear = () => {
    setEditData(null);
    setModo("crear");
    setModalOpen(true);
  };


  const abrirEditar = (srv: any) => {
    setEditData(srv);
    setModo("editar");
    setModalOpen(true);
  };


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

      <div className="flex justify-end mb-5">
        <button
          onClick={abrirCrear}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md bg-green-700 text-white hover:bg-green-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="text-lg leading-none">+</span>
          Crear servicio
        </button>
      </div>

      <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

        <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-600 tracking-wide">
              LISTADO DE SERVICIOS
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Administra servicios, tarifas y reglas de seguro
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-green-600"></span>
            <span className="text-xs font-semibold text-gray-600">
              Total: <span className="text-gray-800">{servicios.length}</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Cargando servicios...
          </div>
        ) : servicios.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 border border-gray-200 rounded-2xl">
            No hay servicios registrados.
          </div>
        ) : (
        <div className="overflow-x-auto rounded-2xl">

          <table className="w-full border-separate border-spacing-y-2 text-sm">

            {/* HEADER */}
            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider">
                <th className="px-4 text-left">Código</th>
                <th className="px-4 text-left">Nombre</th>
                <th className="px-4 text-left">Tipo</th>
                <th className="px-4 text-left">Seguro</th>
                <th className="px-4 text-center">Acciones</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {servicios.map((srv) => (
                <tr
                  key={srv.id}
                  className="bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl"
                >

                  {/* CÓDIGO */}
                  <td className="px-4 py-4">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {srv.codigo}
                    </span>
                  </td>

                  {/* NOMBRE */}
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-800">
                      {srv.nombre}
                    </p>
                  </td>

                  {/* TIPO */}
                  <td className="px-4 py-4">
                    <span className="text-gray-600">
                      {srv.tipo}
                    </span>
                  </td>

                  {/* SEGURO */}
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-800">
                      {Number(srv.porcentaje_seguro || 0).toFixed(2)}%
                    </span>
                  </td>

                  {/* ACCIONES */}
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">

                      <button
                        onClick={() => abrirEditar(srv)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:scale-[1.05] transition"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarServicio(srv.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-900 text-white hover:bg-red-950 hover:scale-[1.05] transition"
                      >
                        Eliminar
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>
        )}
      </div>

      </div>

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
