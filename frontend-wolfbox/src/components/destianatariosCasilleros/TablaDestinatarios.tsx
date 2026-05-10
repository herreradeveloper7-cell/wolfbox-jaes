import iconEdit from "../../assets/pencil-edit-button-svgrepo-com.svg";
import iconTrash from "../../assets/trash-svgrepo-com.svg";

interface Props {
  lista: any[];
  onEditar?: (dest: any) => void;
  onEliminar?: (dest: any) => void;
}

export default function TablaDestinatarios({ lista, onEditar, onEliminar }: Props) {
  return (
    <div className="mt-4 w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md animate-fade-in">
      <table className="w-full min-w-[900px] border-collapse">
        <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-sm uppercase font-semibold tracking-wide">
          <tr>
            <th className="py-3 px-4 text-left">Nombre</th>
            <th className="py-3 px-4 text-left">Teléfono</th>
            <th className="py-3 px-4 text-left">Dirección</th>
            <th className="py-3 px-4 text-left">Ciudad</th>
            <th className="py-3 px-4 text-left">País</th>
            <th className="py-3 px-4 text-center">Opciones</th>
          </tr>
        </thead>

        <tbody>
          {lista.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-500 italic">
                No hay destinatarios registrados
              </td>
            </tr>
          ) : (
            lista.map((d) => (
              <tr
                key={d.id}
                className="text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 font-medium text-gray-800">{d.nombre}</td>
                <td className="p-3 text-gray-700">{d.telefono}</td>
                <td className="p-3 text-gray-700">{d.direccion}</td>
                <td className="p-3 text-gray-700">{d.ciudad}</td>
                <td className="p-3 text-gray-700">{d.pais}</td>

                <td className="p-3 text-center">
                  <div className="flex justify-center gap-3">

                  <button
                    onClick={() => onEditar && onEditar(d)}
                    className="hover:scale-110 transition-transform"
                  >
                    <img
                      src={iconEdit}
                      alt="Editar"
                      className="w-5 h-5 opacity-80 hover:opacity-100"
                    />
                  </button>

                  <button
                    onClick={() => onEliminar && onEliminar(d)}
                    className="hover:scale-110 transition-transform"
                  >
                    <img
                      src={iconTrash}
                      alt="Eliminar"
                      className="w-5 h-5 opacity-80 hover:opacity-100"
                    />
                  </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
