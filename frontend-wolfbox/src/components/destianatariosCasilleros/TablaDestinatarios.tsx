import iconEdit from "../../assets/pencil-edit-button-svgrepo-com.svg";
import iconTrash from "../../assets/trash-svgrepo-com.svg";

interface Props {
  lista: any[];
  onEditar?: (dest: any) => void;
  onEliminar?: (dest: any) => void;
}

export default function TablaDestinatarios({ lista, onEditar, onEliminar }: Props) {
  return (
    <div className="mt-4 animate-fade-in">
      <div className="grid gap-3 md:hidden">
        {lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm font-semibold text-gray-500">
            No hay destinatarios registrados
          </div>
        ) : (
          lista.map((d) => (
            <article key={d.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-950">
                    Destinatario
                  </p>
                  <h3 className="mt-1 break-words text-base font-black text-gray-800">{d.nombre}</h3>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => onEditar && onEditar(d)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:bg-red-50"
                  >
                    <img src={iconEdit} alt="Editar" className="h-4.5 w-4.5 opacity-80" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => onEliminar && onEliminar(d)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 transition hover:bg-red-100"
                  >
                    <img src={iconTrash} alt="Eliminar" className="h-4.5 w-4.5 opacity-80" />
                  </button>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <Info label="Telefono" value={d.telefono} />
                <Info label="Direccion" value={d.direccion} />
                <Info label="Ciudad / Pais" value={[d.ciudad, d.pais].filter(Boolean).join(", ")} />
              </dl>
            </article>
          ))
        )}
      </div>

      <div className="hidden w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md md:block">
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
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-gray-700">{value || "No registrado"}</dd>
    </div>
  );
}
