import React, { useState } from "react";
import iconPrint from "../../assets/print2-svgrepo-com.svg";
import iconDetails from "../../assets/options-lines-svgrepo-com.svg";
import iconDelete from "../../assets/cancel-svgrepo-com.svg";
import ModalHistorialGuia from "./ModalHistorialGuia";

import Swal from "sweetalert2";
import axios from "axios";
import { openAuthenticatedPdf } from "../../utils/openAuthenticatedPdf";

export type GuiaRow = {
  id: string;
  guia: string;
  guiaAsociada?: string | null;
  tracking: string;
  fecha: string;
  ubicacion: string | null;
  estado: string;
  pesoLb: number;
  pesoKg: number;
  valorDeclarado?: number;
  contenido?: string;
  cliente?: string;
  codigo_referencia?: string;
  servicio?: string;
  destinatario_nombre?: string;
  destinatario_direccion?: string;
  destinatario_ciudad?: string;
  destinatario_telefono?: string;
  
};

interface Props {
  rows: GuiaRow[];
  loading?: boolean;
  emptyText?: string;
  fetchResults: () => void;
}

const TablaResultadosGuia: React.FC<Props> = ({
  rows,
  loading,
  emptyText,
  fetchResults,
}) => {

  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [hawbSeleccionado, setHawbSeleccionado] = useState<string | null>(null);




  const handleAnular = async (hawb: string) => {
    const result = await Swal.fire({
      title: "¿Anular guía?",
      text: `¿Deseas anular la guía ${hawb}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8B0000",
      confirmButtonText: "Sí, anular",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const usuarioGuardado = localStorage.getItem("usuario");
      const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

      await axios.put(`/api/paquetes/anular/${hawb}`, {
        responsable: usuario?.nombre || "Usuario del sistema"
      });

      await Swal.fire("Anulada", "Guía anulada correctamente", "success");
      fetchResults();
    } catch (error) {
      console.error("Error al anular guía:", error);
      Swal.fire("Error", "No se pudo anular la guía", "error");
    }
  };

  const handleDetalles = (row: GuiaRow) => {
    setHawbSeleccionado(row.guia);
    setIsHistorialOpen(true);
  };

  const handleImprimirEtiqueta = async (row: GuiaRow) => {
    try {
      await openAuthenticatedPdf(`/api/paquetes/pdf/${row.guia}`, `${row.guia}.pdf`);
    } catch (error: any) {
      Swal.fire("Error", error.message || "No se pudo generar el rotulo", "error");
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando…</div>;

  if (!rows.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        {emptyText ?? "No se encontraron resultados"}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white/95 border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-600">Resultados</div>
          <div className="text-xs text-gray-500">Mostrando {rows.length} registros</div>
        </div>

        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full border-separate border-spacing-y-3 text-sm">

            <thead>
              <tr className="text-xs uppercase text-gray-500 tracking-wider">
                <th className="px-4 text-left">Opciones</th>
                <th className="px-4 text-left">Guía</th>
                <th className="px-4 text-left">Guía asociada</th>
                <th className="px-4 text-left">Tracking</th>
                <th className="px-4 text-left">Contenido</th>
                <th className="px-4 text-left">Cliente</th>
                <th className="px-4 text-left">Casillero</th>
                <th className="px-4 text-left">Fecha</th>
                <th className="px-4 text-left">Ubicación</th>
                <th className="px-4 text-left">Estado</th>
                <th className="px-4 text-right">Peso lb</th>
                <th className="px-4 text-right">Peso kg</th>
                <th className="px-4 text-right">Valor</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">

                  <td className="px-4 py-4 align-top">
                    {r.estado !== "Anulado" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnular(r.guia)}
                          title="Anular guía"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 transition-shadow shadow-sm"
                        >
                          <img src={iconDelete} className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDetalles(r)}
                          title="Ver historial"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-shadow shadow-sm"
                        >
                          <img src={iconDetails} className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleImprimirEtiqueta(r)}
                          title="Imprimir etiqueta"
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 transition-shadow shadow-sm"
                        >
                          <img src={iconPrint} className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">Anulada</span>
                    )}
                  </td>

                  <td className="px-4 py-4 font-semibold text-gray-800">{r.guia}</td>
                  <td className="px-4 py-4 text-gray-600">{r.guiaAsociada ?? "—"}</td>
                  <td className="px-4 py-4 text-gray-600 truncate max-w-[240px]">{r.tracking}</td>
                  <td className="px-4 py-4 text-gray-600">{r.contenido ?? "—"}</td>
                  <td className="px-4 py-4 text-gray-600">{r.cliente ?? "—"}</td>
                  <td className="px-4 py-4 text-gray-600">{r.codigo_referencia ?? "—"}</td>
                  <td className="px-4 py-4 text-gray-600">{new Date(r.fecha).toLocaleString()}</td>

                  <td className="px-4 py-4">
                    {r.ubicacion ? (
                      <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">{r.ubicacion}</span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-semibold ${r.estado === 'Anulado' ? 'bg-red-100 text-red-900' : r.estado === 'Digitado' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-900'}`}>
                      {r.estado}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right text-gray-600">{r.pesoLb.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-gray-600">{r.pesoKg.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-gray-600">{(r.valorDeclarado ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {isHistorialOpen && hawbSeleccionado && (
        <ModalHistorialGuia
          hawb={hawbSeleccionado}
          onClose={() => setIsHistorialOpen(false)}
        />
      )}
    </>
  );
};

export default TablaResultadosGuia;
