import React from "react";

interface BusquedaPaquetesProps {
  filtros: {
    fechaInicial?: string;
    fechaFinal?: string;
    tracking?: string;
    contenido?: string;
    notas?: string;
    referencia?: string;
    cliente?: string;
    usuario?: string;
  };
  onChangeFiltros: (actualizador: (prev: any) => any) => void;
}

export default function BusquedaPaquetes({ filtros, onChangeFiltros }: BusquedaPaquetesProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChangeFiltros((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 bg-white shadow-md rounded-lg p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="w-44 text-sm font-medium text-green-700">Fecha inicial</label>
          <input
            type="date"
            name="fechaInicial"
            value={filtros.fechaInicial || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-44 text-sm font-medium text-green-700">Fecha final</label>
          <input
            type="date"
            name="fechaFinal"
            value={filtros.fechaFinal || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>
      </div>

      {/* Columna 2 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="w-44 text-sm font-medium text-gray-700">Tracking/Hawb</label>
          <input
            type="text"
            name="tracking"
            placeholder="Tracking o HAWB"
            value={filtros.tracking || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-44 text-sm font-medium text-gray-700">Contenido</label>
          <input
            type="text"
            name="contenido"
            value={filtros.contenido || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-44 text-sm font-medium text-gray-700">Notas</label>
          <input
            type="text"
            name="notas"
            value={filtros.notas || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>
      </div>

      {/* Columna 3 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="w-40 text-sm font-medium text-gray-700">Referencia</label>
          <input
            type="text"
            name="referencia"
            value={filtros.referencia || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-40 text-sm font-medium text-gray-700">Cliente / Destinatario</label>
          <input
            type="text"
            name="cliente"
            value={filtros.cliente || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="w-40 text-sm font-medium text-gray-700">Usuario</label>
          <input
            type="text"
            name="usuario"
            value={filtros.usuario || ""}
            onChange={handleInputChange}
            className="border px-3 py-1 rounded w-full"
          />
        </div>
      </div>
    </div>
  );
}
