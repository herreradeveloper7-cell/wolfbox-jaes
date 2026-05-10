import React from "react";

interface BusquedaPaquetesProps {
  filtros: {
    fechaInicial?: string;
    fechaFinal?: string;
    trackingHawb?: string;
    contenido?: string;
    notas?: string;
    referencia?: string;
    cliente?: string;
    usuario?: string;
  };

  clientesSugeridos?: any[];
  usuariosSugeridos?: any[];

  onChangeFiltros: (actualizador: (prev: any) => any) => void;
  onBuscarCliente?: (texto: string) => void;
  onSeleccionarCliente?: (cliente: any) => void;
  onBuscarUsuario?: (texto: string) => void;
  onSeleccionarUsuario?: (usuario: any) => void;
}

export default function BusquedaPaquetes({
  filtros,
  onChangeFiltros,
  clientesSugeridos = [],
  usuariosSugeridos = [],
  onBuscarCliente,
  onSeleccionarCliente,
  onBuscarUsuario,
  onSeleccionarUsuario,
}: BusquedaPaquetesProps) {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChangeFiltros((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
        Rango de fechas
      </h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-green-700 tracking-wide">
          Fecha inicial
        </label>
        <input
          type="date"
          name="fechaInicial"
          value={filtros.fechaInicial || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-green-700 tracking-wide">
          Fecha final
        </label>
        <input
          type="date"
          name="fechaFinal"
          value={filtros.fechaFinal || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />
      </div>
    </div>

    <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
        Información del paquete
      </h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600 tracking-wide">
          Tracking / HAWB
        </label>
        <input
          type="text"
          name="trackingHawb"
          placeholder="Tracking o HAWB"
          value={filtros.trackingHawb || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600 tracking-wide">
          Contenido
        </label>
        <input
          type="text"
          name="contenido"
          value={filtros.contenido || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600 tracking-wide">
          Notas
        </label>
        <input
          type="text"
          name="notas"
          value={filtros.notas || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />
      </div>
    </div>

    <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
        Cliente y usuario
      </h3>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-gray-600 tracking-wide">
          Referencia
        </label>
        <input
          type="text"
          name="referencia"
          value={filtros.referencia || ""}
          onChange={handleInputChange}
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />
      </div>

      <div className="flex flex-col gap-1 relative">
        <label className="text-sm font-semibold text-gray-600 tracking-wide">
          Cliente / Codigo de suite
        </label>

        <input
          type="text"
          name="cliente"
          value={filtros.cliente || ""}
          onChange={(e) => {
            handleInputChange(e);
            onBuscarCliente?.(e.target.value);
          }}
          placeholder="Buscar cliente o codigo de suite"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />

        {clientesSugeridos.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {clientesSugeridos.map((cliente, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSeleccionarCliente?.(cliente)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition"
              >
                {cliente.nombre_completo || cliente.nombre || cliente.cliente}
                {cliente.codigo_referencia && (
                  <span className="text-gray-400"> - {cliente.codigo_referencia}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 relative">
        <label className="text-sm font-semibold text-gray-600 tracking-wide">
          Usuario
        </label>

        <input
          type="text"
          name="usuario"
          value={filtros.usuario || ""}
          onChange={(e) => {
            handleInputChange(e);
            onBuscarUsuario?.(e.target.value);
          }}
          placeholder="Buscar usuario"
          className="w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
        />

        {usuariosSugeridos.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {usuariosSugeridos.map((usuario, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSeleccionarUsuario?.(usuario)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 transition"
              >
                {usuario.nombre_completo || usuario.nombre || usuario.usuario}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}
