import { Solicitud } from "../../types/solicitudes";
import iconEye from "../../assets/eye-open-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";

interface Props {
  solicitudes: Solicitud[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function TablaSolicitudesDespacho({
  solicitudes,
  loading,
  page,
  totalPages,
  onPageChange,
}: Props) {
  const navigate = useNavigate();

  const separarHawbs = (hawbs: any) =>
    String(hawbs || "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

  return (
    <div className="relative mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-xl">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5" />

      <div className="relative flex flex-col gap-2 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-red-950">
            Solicitudes de despacho
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight uppercase text-gray-700">
            Resultados encontrados
          </h2>
        </div>

        <span className="w-fit rounded-full border border-red-900/15 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-950">
          {solicitudes.length} registros
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-900/20 border-r-red-900 border-t-red-900" />
          <p className="font-black text-gray-800">Cargando solicitudes...</p>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            Consultando información operacional.
          </p>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-950">
            !
          </div>
          <p className="font-black text-gray-800">
            No hay solicitudes para agrupar
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-500">
            Ajusta los filtros e intenta nuevamente.
          </p>
        </div>
      ) : (
        <>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed text-sm">
              <colgroup>
                <col className="w-[86px]" />
                <col className="w-[82px]" />
                <col className="w-[112px]" />
                <col className="w-[230px]" />
                <col className="w-[150px]" />
                <col className="w-[330px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead className="border-b border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50">
                <tr className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                  <th className="px-5 py-4 text-center font-black">Ver</th>
                  <th className="px-5 py-4 text-left font-black">ID</th>
                  <th className="px-5 py-4 text-left font-black">Fecha</th>
                  <th className="px-5 py-4 text-left font-black">
                    Cliente / Código casillero
                  </th>
                  <th className="px-5 py-4 text-left font-black">Estado</th>
                  <th className="px-5 py-4 text-center font-black">HAWB(s)</th>
                  <th className="px-5 py-4 text-center font-black">
                    Paquetes
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {solicitudes.map((s) => {
                  const hawbs = separarHawbs(s.hawbs);

                  return (
                    <tr
                      key={s.id}
                      className="bg-white transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/70 hover:to-transparent"
                    >
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboardUsuario/agrupar-solicitud/${s.id}`
                              )
                            }
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 shadow-lg shadow-red-950/20 transition-all duration-200 hover:scale-105 hover:from-red-900 hover:to-red-800 hover:shadow-xl"
                            title="Ver solicitud"
                          >
                            <img src={iconEye} alt="Ver" className="h-5 w-5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-black text-red-950">
                          #{s.id}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-bold text-gray-700">
                        {s.fecha}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-800">
                          {s.cliente_nombre || "Sin cliente"}
                        </div>
                        <div className="mt-1 w-fit rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-[11px] font-bold text-gray-500">
                          {s.codigo_referencia || "Sin código"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-red-900/15 bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-red-950">
                          {s.estado || "Sin estado"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {hawbs.length > 0 ? (
                          <div className="mx-auto max-h-24 max-w-[310px] overflow-y-auto rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2 scrollbar-thin">
                            {hawbs.map((h, i) => (
                              <div
                                key={i}
                                className="border-b border-gray-100 py-1 font-mono text-[11px] font-bold leading-5 text-gray-700 last:border-b-0"
                                title={h}
                              >
                                <span className="block truncate">{h}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center font-bold text-gray-400">
                            —
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-red-950 px-3 font-mono text-sm font-black text-white shadow-md shadow-red-950/20">
                          {s.cantidadPaquetes ?? 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Página{" "}
                <span className="font-black text-red-950">{page}</span> de{" "}
                <span className="font-black text-red-950">{totalPages}</span>
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => onPageChange(page - 1)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all duration-200 hover:border-red-900/20 hover:bg-red-50 hover:text-red-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                <button
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:from-red-900 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
