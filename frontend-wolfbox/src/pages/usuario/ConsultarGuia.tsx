import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import TablaResultadosGuia from "../../components/busquedaPaquetes/TablaResultadosGuia";
import { useNavigate } from "react-router-dom";
import { useState,useEffect } from "react";
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
  servicio?: string;
  destinatario_nombre?: string;
  destinatario_direccion?: string;
  destinatario_ciudad?: string;
  destinatario_telefono?: string;
};

const ConsultarGuia: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<GuiaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [servicios, setServicios] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tiendas, setTiendas] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [, setTotal] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);

  

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
  
  useEffect(() => {
    const fetchServicios = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/servicios");

        if (res.data.ok) {
          setServicios(res.data.servicios);
        }

      } catch (error) {
        console.error("❌ Error cargando servicios:", error);
      }
    };

    fetchServicios();
  }, []);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/usuarios/select");
        if (res.data.ok) {
          setUsuarios(res.data.usuarios);
        }
      } catch (error) {
        console.error("❌ Error cargando usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/guias/tiendas");

        if (res.data.ok) {
          // res.data.tiendas = [{tienda:"Amazon"}, {tienda:"eBay"}...]
          const lista = (res.data.tiendas ?? [])
            .map((t: any) => t.tienda)
            .filter(Boolean);

          setTiendas(lista);
        }
      } catch (error) {
        console.error("❌ Error cargando tiendas:", error);
      }
    };

    fetchTiendas();
  }, []);

  useEffect(() => {

  if (!filtros.cliente || filtros.cliente.length < 2) {
    setClientesSugeridos([]);
    return;
  }

  const delay = setTimeout(async () => {

    try {

      const res = await axios.get(
        `http://localhost:3000/api/clientes/buscar/${encodeURIComponent(filtros.cliente)}`
      );

      if (res.data.ok) {
        setClientesSugeridos(res.data.clientes);
      }

    } catch (error) {
      console.error("❌ Error buscando clientes:", error);
    }

  }, 400);

  return () => clearTimeout(delay);

}, [filtros.cliente]);

  const fetchResults = async () => {
  setLoading(true);
  setMensaje("");

  try {
    const response = await axios.post("http://localhost:3000/api/guias/buscar", {
      ...filtros,
      fechaDesde: filtros.fechaDesde || null,
      fechaHasta: filtros.fechaHasta || null,
      guia: filtros.guia || search,

    });

    const rawData = response.data.guias;

    if (!rawData || rawData.length === 0) {
      setMensaje("🔍 No se encontraron resultados con los filtros ingresados.");
      setRows([]);
      setTotal(0);
    } else {
      const data: GuiaRow[] = rawData.map((p: any) => ({
        id: p.id,
        guia: p.guia,
        guiaAsociada: null,
        tracking: p.tracking,
        fecha: p.fecha,
        ubicacion: p.ubicacion ?? "—",
        estado: p.estado,
        pesoLb: Number(p.pesoLb ?? 0),
        pesoKg: Number(p.pesoKg ?? 0),
        valorDeclarado: Number(p.declaracion_valor ?? 0),
        contenido: p.contenido ?? "—",
        cliente: p.cliente ?? "—",
        codigo_referencia: p.codigo_referencia ?? "—",
        servicio: p.servicio ?? "—",
        destinatario_nombre: p.destinatario_nombre ?? "—",
        destinatario_direccion: p.destinatario_direccion ?? "—",
        destinatario_ciudad: p.destinatario_ciudad ?? "—",
        destinatario_telefono: p.destinatario_telefono ?? "—",
      }));

      setRows(data);
      setTotal(data.length);
      setMensaje("");
    }
  } catch (error) {
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

    if ((filtros.fechaDesde && !filtros.fechaHasta) || (!filtros.fechaDesde && filtros.fechaHasta)) {
      setMensaje("⚠️ Para filtrar por fecha debes seleccionar Fecha desde y Fecha hasta.");
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

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const inputBase = "px-3 py-2 rounded-lg text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400";
  const selectBase = "px-3 py-2 rounded-lg text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400 cursor-pointer";

  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">
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

        <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

          <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-700 tracking-wide">
                Búsqueda avanzada de guías
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Filtros avanzados para localizar y analizar guías registradas
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span className="text-xs font-semibold text-gray-600">
                Módulo activo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 tracking-tighter">Guía</label>
                  <input name="guia" value={filtros.guia} onChange={handleChange} placeholder="Ingrese número de guía" className={inputBase} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 tracking-tighter">Referencia</label>
                  <input name="referencia" value={filtros.referencia} onChange={handleChange} placeholder="Código de referencia" className={inputBase} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 tracking-tighter">Servicio</label>
                  <select name="servicio" value={filtros.servicio} onChange={handleChange} className={selectBase}>
                    <option value="">Seleccione servicio</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.codigo} - {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 tracking-tighter">Usuario</label>
                  <select name="usuario" value={filtros.usuario} onChange={handleChange} className={selectBase}>
                    <option value="">Seleccione usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.nombre}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 tracking-tighter">Fecha desde</label>
                  <input type="date" name="fechaDesde" value={filtros.fechaDesde} onChange={handleChange} className={inputBase} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-600 tracking-tighter">Fecha hasta</label>
                  <input type="date" name="fechaHasta" value={filtros.fechaHasta} onChange={handleChange} className={inputBase} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 my-6 pt-6">
            <h3 className="text-sm font-bold text-gray-600 tracking-wide uppercase mb-4">Filtros por casillero</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 tracking-tighter">Oficina</label>
                    <select name="oficina" value={filtros.oficina} onChange={handleChange} className={selectBase}>
                      <option value="">Seleccione oficina</option>
                      <option value="bogota">Bogotá</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 tracking-tighter">Tienda</label>
                    <select name="tienda" value={filtros.tienda} onChange={handleChange} className={selectBase}>
                      <option value="">Seleccione tienda</option>
                      {tiendas.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 tracking-tighter">Tracking Casillero</label>
                    <input name="trackingCasillero" value={filtros.trackingCasillero} onChange={handleChange} placeholder="Tracking" className={inputBase} />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 tracking-tighter">Notificación Solicitud</label>
                    <select name="notificacion" value={filtros.notificacion} onChange={handleChange} className={selectBase}>
                      <option value="">Seleccione una opción</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-600 tracking-tighter">Cliente</label>
                    <input
                      name="cliente"
                      value={filtros.cliente}
                      onChange={handleChange}
                      list="clientes-list"
                      placeholder="Código o nombre"
                      className={inputBase}
                    />
                    <datalist id="clientes-list">
                      {clientesSugeridos.map((cliente) => (
                        <option key={cliente.id} value={cliente.codigo_referencia}>
                          {cliente.codigo_referencia} - {cliente.nombre}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={handleResetClick} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition">
              <img src={resetIcon} alt="Limpiar" className="w-4 h-4" />
              Limpiar
            </button>
            <button onClick={handleSearchClick} className="bg-red-900 hover:bg-red-950 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition shadow-md">
              <img src={iconSearch} alt="Buscar" className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </div>


        {mensaje && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-semibold">
            {mensaje}
          </div>
        )}

        {rows.length > 0 && (
          <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl overflow-hidden mt-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-600">Resultados de búsqueda</h3>
                  <p className="text-xs text-gray-500 mt-1">Se encontraron {rows.length} guías</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-600">Registros por página:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
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
                    placeholder="Filtrar resultados..."
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 bg-white shadow-sm focus:ring-2 focus:ring-red-900/20 focus:border-red-900"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              <TablaResultadosGuia   
              rows={paginatedRows}
              loading={loading}
              fetchResults={fetchResults}/>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-end items-center gap-1 mt-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((num) => {
                    return (
                      num <= 5 ||
                      num === totalPages ||
                      Math.abs(num - page) <= 1
                    );
                  })
                  .map((num, index, array) => (
                    <div key={num} className="flex items-center">
                      {index > 0 && num - array[index - 1] > 1 && (
                        <span className="px-3 py-2 text-gray-500">...</span>
                      )}

                      <button
                        onClick={() => handlePageChange(num)}
                        className={`px-4 py-2 border border-gray-300 font-semibold transition ${
                          page === num
                            ? "bg-red-900 text-white"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {num}
                      </button>
                    </div>
                  ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default ConsultarGuia;
