import {useEffect, useState} from "react";
import axios from "axios";  
import iconHome from "../../assets/home-svgrepo-com.svg";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import { useNavigate } from "react-router-dom";
import ModalCrearTRM from "../../components/trm/ModalCrearTRM";
import ModalEditarTRM from "../../components/trm/ModalEditarTRM";
import iconTrash from "../../assets/trash-svgrepo-com.svg";
import iconEdit from "../../assets/edit-svgrepo-com.svg";
import Swal from "sweetalert2";

export default function ConfigTRM() {
  const navigate = useNavigate();

  const [lista, setLista] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCrear, setShowCrear] = useState(false);
  const [showEditar, setShowEditar] = useState<any>(null);
  const formatFecha = (f: string) =>
  f.split("T")[0].split("-").reverse().join("/");


  const cargarTRM = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/trm`);
      setLista(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (trm: any) => {
  const confirmar = await Swal.fire({
        title: "¿Eliminar TRM?",
        text: `Se eliminará el TRM del ${new Date(trm.fecha).toLocaleDateString("es-CO")}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#7d1111",
        cancelButtonColor: "#555",
        confirmButtonText: "Sí, eliminar"
    });

    if (!confirmar.isConfirmed) return;

    try {
        await axios.delete(`/api/trm/${trm.id}`);
        await cargarTRM();

        Swal.fire("Eliminado", "TRM eliminado correctamente", "success");
    } catch (e) {
        Swal.fire("Error", "No se pudo eliminar el TRM", "error");
    }
    };


  useEffect(() => {
    cargarTRM();
  }, []);

  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-6 lg:px-10 pb-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-red-900">
          Configuración TRM
        </h1>
        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Configuración TRM
        </p>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Historial TRM</h2>
            <button
              onClick={() => setShowCrear(true)}
              className="px-5 py-2.5 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 transition shadow-md"
            >
              + Nuevo TRM
            </button>
          </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">

            {loading ? (
                <div className="animate-pulse space-y-3 p-6">
                {[1,2,3].map(i=>(
                    <div key={i} className="h-10 bg-gray-200 rounded-lg w-full"></div>
                ))}
                </div>
            ) : (
                <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-red-900/90 to-red-800 text-white">
                    <tr>
                    <th className="py-3 px-5 text-left font-semibold">Fecha</th>
                    <th className="py-3 px-5 text-left font-semibold">Valor COP</th>
                    <th className="py-3 px-5 text-center font-semibold">Acciones</th>
                    </tr>
                </thead>

                <tbody className="bg-white">
                    {lista.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500 italic">
                        No hay registros
                        </td>
                    </tr>
                    ) : (
                    lista.map( (t, idx) => (
                        <tr
                        key={t.id}
                        className={`
                            transition
                            ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            hover:bg-red-50
                        `}
                        >
                        <td className="px-5 py-3 text-gray-800">
                            {formatFecha(t.fecha)}
                        </td>
                        <td className="px-5 py-3 text-gray-900 font-bold tracking-wide">
                            {Number(t.valor).toLocaleString("es-CO")}
                        </td>
                        <td className="px-5 py-3 text-center flex justify-center gap-4">
                            <button
                            onClick={() => setShowEditar(t)}
                            title="Editar TRM"
                            className="hover:scale-110 transition-transform duration-150"
                            >
                            <img src={iconEdit} className="w-5 opacity-80 hover:opacity-100" />
                            </button>

                            <button
                            onClick={() => handleEliminar(t)}
                            title="Eliminar TRM"
                            className="hover:scale-110 transition-transform duration-150"
                            >
                            <img src={iconTrash} className="w-5 opacity-80 hover:opacity-100" />
                            </button>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            )}
            </div>


        </div>
      </div>

      {showCrear && (
        <ModalCrearTRM
          onClose={() => setShowCrear(false)}
          onSave={async () => {
            await cargarTRM();
            setShowCrear(false);
          }}
        />
      )}

      {showEditar && (
        <ModalEditarTRM
          fila={showEditar}
          onClose={() => setShowEditar(null)}
          onSave={async () => {
            await cargarTRM();
            setShowEditar(null);
          }}
        />
      )}
    </UserDashboardLayout>
  );
}
