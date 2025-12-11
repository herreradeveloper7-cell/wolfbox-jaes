import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import TablaResultadosGuia from "../../components/TablaResultadosGuia";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconSearch from "../../assets/search-alt-svgrepo-com.svg";
import resetIcon from "../../assets/reset-icon-com.svg";
import axios from "axios";

type GuiaRow = {
  id: string;
  guia: string;
  guiaAsociada?: string | null;
  tracking: string;
  fecha: string;
  ubicacion: string;
  estado: string;
  total: number;
  pesoLb: number;
  pesoKg: number;
  valorDeclarado: number;
  contenido?: string;  
  notas?: string; 
  cliente?: string;              
  codigo_referencia?: string;  
};

const ConsultarGuia: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<GuiaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [mensaje, setMensaje] = useState("");

  const [filtros, setFiltros] = useState({
    guia: "",
    referencia: "",
    fechaDesde: "",
    fechaHasta: "",
    servicio: "",
    paisDestino: "",
    usuario: "",
    oficina: "",
    notificacion: "",
    tienda: "",
    cliente: "",
    pesoInicio: "",
    pesoFin: "",
    noCasillero: "",
    trackingCasillero: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };
  

  const fetchResults = async () => {
  setLoading(true);
  setMensaje("");

  try {
    const response = await axios.post("http://localhost:3000/api/guias/buscar", {
      ...filtros,
      search,
    });

    const rawData = response.data; 

    if (!rawData || rawData.length === 0) {
      setMensaje("🔍 No se encontraron resultados con los filtros ingresados.");
      setRows([]);
      setTotal(0);
    } else {
      const data: GuiaRow[] = rawData.map((p: any) => ({
        id: p.id,
        guia: p.guia || p.numero_guia || p.hawb || "",
        guiaAsociada: p.guia_asociada || p.guiaAsociada || null,
        tracking: p.tracking || "",
        fecha: p.fecha || p.fecha_registro || "",
        ubicacion: p.ubicacion || "",
        estado: p.estado || "",
        total: parseFloat(p.total) || 0,
        pesoLb: parseFloat(p.pesoLb || p.peso_lb || p.peso || 0),
        pesoKg: parseFloat(p.pesoKg || p.peso_kg || 0),
        valorDeclarado: parseFloat(p.valorDeclarado || p.declaracion_valor || 0),
        contenido: p.contenido || "",  
        notas: p.notas || "",
        cliente: p.cliente || "",
        codigo_referencia: p.codigo_referencia || "",
          
      }));

      setRows(data);
      setTotal(data.length);
      setMensaje("");
    }
  } catch (error) {
    console.error("❌ Error al buscar guías:", error);
    setMensaje("❌ Error al conectar con el servidor.");
  } finally {
    setLoading(false);
  }
};


const handleSearchClick = () => {
    const hayFiltros = Object.values(filtros).some((valor) => valor && valor.toString().trim() !== "") || search.trim() !== "";
    if (!hayFiltros) {
      setMensaje("⚠️ Por favor, ingrese al menos un campo para realizar la búsqueda.");
      setRows([]);
      setTotal(0);
      return;
    }

    setPage(1);
    fetchResults();
  };

  const handleResetClick = () => {
    setFiltros({
      guia: "",
      referencia: "",
      fechaDesde: "",
      fechaHasta: "",
      servicio: "",
      paisDestino: "",
      usuario: "",
      oficina: "",
      notificacion: "",
      tienda: "",
      cliente: "",
      pesoInicio: "",
      pesoFin: "",
      noCasillero: "",
      trackingCasillero: "",
    });
    setSearch("");
    setRows([]);
    setTotal(0);
    setMensaje("");
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const filteredRows = rows.filter((row) => {
    const texto = search.toLowerCase();
    return (
      row.guia.toLowerCase().includes(texto) ||
      row.tracking.toLowerCase().includes(texto) ||
      row.estado.toLowerCase().includes(texto) ||
      row.ubicacion.toLowerCase().includes(texto)
    );
  });

  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-2 lg:px-10">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Consultar Guías</h1>
        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Consultar Guías
        </p>

        <section className="bg-gray-100 border border-gray-300 rounded-lg shadow py-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 uppercase px-6">Consulta de guía</h2>

          <section className="bg-white border border-gray-200 rounded-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Guía</label>
                  <input name="guia" value={filtros.guia} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Referencia</label>
                  <input name="referencia" value={filtros.referencia} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Servicio</label>
                  <select name="servicio" value={filtros.servicio} onChange={handleChange} className="border rounded px-2 py-1 w-48">
                    <option value="">Seleccione una opción</option>
                    <option value="aereo">Aéreo</option>
                    <option value="maritimo">Marítimo</option>
                    <option value="terrestre">Terrestre</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Fecha desde</label>
                  <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Fecha hasta</label>
                  <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">País destino</label>
                  <select name="paisDestino" value={filtros.paisDestino} onChange={handleChange} className="border rounded px-2 py-1 w-48">
                    <option value="">Seleccione país</option>
                    <option value="co">Colombia</option>
                    <option value="us">Estados Unidos</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Usuario</label>
                  <input name="usuario" value={filtros.usuario} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-28 text-right text-sm text-gray-700">Rango de peso</label>
                  <div className="flex gap-2 w-72">
                    <input name="pesoInicio" value={filtros.pesoInicio} onChange={handleChange} placeholder="Peso inic." className="border rounded px-2 py-1 w-23" />
                    <input name="pesoFin" value={filtros.pesoFin} onChange={handleChange} placeholder="Peso fin" className="border rounded px-2 py-1 w-23" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t my-4 border-gray-300" />
            <h3 className="text-md font-semibold mb-4">CASILLERO</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Oficina</label>
                  <select name="oficina" value={filtros.oficina} onChange={handleChange} className="border rounded px-2 py-1 w-48">
                    <option value="">Seleccione oficina</option>
                    <option value="bogota">Bogotá</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Tienda</label>
                  <input name="tienda" value={filtros.tienda} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-24 text-right text-sm text-gray-700">Tracking Casillero</label>
                  <input name="trackingCasillero" value={filtros.trackingCasillero} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-28 text-right text-sm text-gray-700">No Casillero</label>
                  <input name="noCasillero" value={filtros.noCasillero} onChange={handleChange} className="border rounded px-2 py-1 w-48" />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-28 text-right text-sm text-gray-700">Notificación Solicitud</label>
                  <select name="notificacion" value={filtros.notificacion} onChange={handleChange} className="border rounded px-2 py-1 w-48">
                    <option value="">Seleccione una opción</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-28 text-right text-sm text-gray-700">Cliente</label>
                  <input name="cliente" value={filtros.cliente} onChange={handleChange} placeholder="Nombre, razón social..." className="border rounded px-2 py-1 w-48" />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end mt-6 gap-2 px-6">
            <button onClick={handleSearchClick} className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded flex items-center gap-1 cursor-pointer">
              <img src={iconSearch} alt="Buscar" className="w-4 h-4" />
              Buscar
            </button>
            <button onClick={handleResetClick} className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded flex items-center gap-1 cursor-pointer">
              <img src={resetIcon} alt="Buscar" className="w-4 h-4" />
              Borrar
            </button>
          </div>
        </section>

        {mensaje && <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">{mensaje}</div>}

        {rows.length > 0 && (
          <section className="border border-gray-300 rounded-lg shadow bg-white mt-6">
            <div className="px-4 md:px-6 py-3 border-b border-gray-200">
              <div className="flex justify-end items-center gap-3">
                <label className="text-sm text-gray-600 hidden sm:block">Registros</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
                  placeholder="Buscar"
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 md:p-6">
              <TablaResultadosGuia   
              rows={paginatedRows}
              loading={loading}
              fetchResults={fetchResults} />
            </div>

            <div className="px-4 md:px-6 py-3 border-t border-gray-200">
              <div className="flex justify-end items-center gap-2 text-sm">
                <button onClick={() => handlePageChange(page - 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50">
                  Anterior
                </button>
                <span className="px-3 py-1 rounded bg-red-900 text-white">{page}</span>
                <button onClick={() => handlePageChange(page + 1)} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50">
                  Siguiente
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default ConsultarGuia;
