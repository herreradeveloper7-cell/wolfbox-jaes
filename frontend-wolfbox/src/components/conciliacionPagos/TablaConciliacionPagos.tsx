import { useState } from "react";

interface SolicitudConciliacion {
  id: number;
  hawb: string;
  cliente: string;
  monto: number;
  fecha: string;
  estado: string;
  comprobante?: string;
}

interface Props {
  solicitudes: SolicitudConciliacion[];
  onSubirComprobante: (id: number, archivo: File) => void;
  onAutorizar: (id: number) => void;
  onRechazar?: (id: number) => void; 
}

export default function TablaConciliacionPagos({
  solicitudes,
  onSubirComprobante,
  onAutorizar,
  onRechazar,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openUploadId, setOpenUploadId] = useState<number | null>(null);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
        RESULTADOS DE CONCILIACIÓN DE PAGO
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm border">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-3 py-2 border">ID</th>
              <th className="px-3 py-2 border">HAWB</th>
              <th className="px-3 py-2 border">Cliente</th>
              <th className="px-3 py-2 border">Monto</th>
              <th className="px-3 py-2 border">Fecha</th>
              <th className="px-3 py-2 border">Estado</th>
              <th className="px-3 py-2 border">Comprobante</th>
              <th className="px-3 py-2 border">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {solicitudes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  No hay solicitudes registradas…
                </td>
              </tr>
            ) : (
              solicitudes.map((sol) => (
                <tr key={sol.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-3 py-2 border text-center">{sol.id}</td>
                  <td className="px-3 py-2 border text-center">{sol.hawb}</td>
                  <td className="px-3 py-2 border">{sol.cliente}</td>
                  <td className="px-3 py-2 border text-center">${sol.monto}</td>
                  <td className="px-3 py-2 border text-center">{sol.fecha}</td>
                  <td className="px-3 py-2 border text-center">
                    <span
                      className={`
                        px-2 py-1 rounded text-white text-xs font-semibold
                        ${sol.estado === "Pendiente" && "bg-yellow-500"}
                        ${sol.estado === "Autorizado" && "bg-green-600"}
                        ${sol.estado === "Rechazado" && "bg-red-600"}
                      `}
                    >
                      {sol.estado}
                    </span>
                  </td>

                  <td className="px-3 py-2 border text-center">
                    {sol.comprobante ? (
                      <a
                        href={sol.comprobante}
                        target="_blank"
                        className="text-blue-600 underline text-sm"
                      >
                        Ver archivo
                      </a>
                    ) : (
                      <button
                        onClick={() =>
                          setOpenUploadId(openUploadId === sol.id ? null : sol.id)
                        }
                        className="text-red-900 font-semibold flex items-center gap-1 mx-auto"
                      >
                        Subir
                      </button>
                    )}

                    {/* Input de archivo */}
                    {openUploadId === sol.id && (
                      <div className="mt-2">
                        <input
                          type="file"
                          className="text-sm"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                        />

                        <button
                          onClick={() => {
                            if (selectedFile) {
                              onSubirComprobante(sol.id, selectedFile);
                              setSelectedFile(null);
                              setOpenUploadId(null);
                            }
                          }}
                          className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-xs"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2 border text-center">
                    <div className="flex justify-center gap-3">

                      <button
                        onClick={() => onAutorizar(sol.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                      </button>

                      {onRechazar && (
                        <button
                          onClick={() => onRechazar(sol.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                        </button>
                      )}
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
