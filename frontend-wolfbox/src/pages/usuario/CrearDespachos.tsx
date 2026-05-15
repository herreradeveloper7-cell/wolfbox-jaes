import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import iconHome from "../../assets/home-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";

type Despacho = {
  id: number;
  codigo: string;
  nombre?: string | null;
  observaciones?: string | null;
  estado: "abierto" | "cerrado" | string;
  creado_por?: string | null;
  fecha_creacion?: string | null;
  fecha_cierre?: string | null;
  cantidad_hawbs?: number;
  peso_total?: number;
};

type PaqueteDespacho = {
  despacho_paquete_id: number;
  paquete_id: number;
  hawb: string;
  tracking?: string | null;
  contenido?: string | null;
  tienda?: string | null;
  peso?: number | string | null;
  solicitud_id?: number | null;
  estado_actual?: string | null;
  cliente?: string | null;
  codigo_referencia?: string | null;
  fecha_agregado?: string | null;
  agregado_por?: string | null;
};

type CatalogoEstado = {
  oficina_id: number;
  oficina: string;
  punto_control_id: number;
  punto_control: string;
  estado_id: number;
  estado: string;
};

export default function CrearDespachos() {
  const navigate = useNavigate();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [despachoSeleccionado, setDespachoSeleccionado] =
    useState<Despacho | null>(null);
  const [paquetes, setPaquetes] = useState<PaqueteDespacho[]>([]);
  const [nombre, setNombre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [oficina, setOficina] = useState("");
  const [puntoControl, setPuntoControl] = useState("");
  const [estadoGuia, setEstadoGuia] = useState("");
  const [activo, setActivo] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [catalogoEstados, setCatalogoEstados] = useState<CatalogoEstado[]>([]);
  const [oficinasCatalogo, setOficinasCatalogo] = useState<CatalogoEstado[]>([]);
  const [puntosControl, setPuntosControl] = useState<CatalogoEstado[]>([]);
  const [estadosCatalogo, setEstadosCatalogo] = useState<CatalogoEstado[]>([]);
  const [hawb, setHawb] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [agregandoHawb, setAgregandoHawb] = useState(false);

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("usuario") || "{}");
    } catch {
      return {};
    }
  }, []);

  const despachoCerrado =
    despachoSeleccionado?.estado?.toLowerCase() === "cerrado";

  const fechaDespacho = useMemo(() => {
    const fecha = new Date();
    const yyyy = fecha.getFullYear();
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const hh = String(fecha.getHours()).padStart(2, "0");
    const min = String(fecha.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }, []);

  const resumen = useMemo(() => {
    const abiertos = despachos.filter(
      (d) => d.estado?.toLowerCase() === "abierto"
    ).length;
    const cerrados = despachos.filter(
      (d) => d.estado?.toLowerCase() === "cerrado"
    ).length;
    const hawbs = despachos.reduce(
      (total, d) => total + Number(d.cantidad_hawbs || 0),
      0
    );

    return { abiertos, cerrados, hawbs };
  }, [despachos]);

  const cargarDespachos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/despachos");
      const lista = Array.isArray(data.despachos) ? data.despachos : [];
      setDespachos(lista);

      if (despachoSeleccionado) {
        const actualizado = lista.find(
          (d: Despacho) => d.id === despachoSeleccionado.id
        );
        if (actualizado) {
          setDespachoSeleccionado(actualizado);
        }
      }
    } catch (error) {
      console.error("Error cargando despachos:", error);
      Swal.fire("Error", "No se pudieron cargar los despachos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (despacho: Despacho) => {
    try {
      const { data } = await axios.get(`/api/despachos/${despacho.id}`);
      setDespachoSeleccionado(data.despacho);
      setPaquetes(Array.isArray(data.paquetes) ? data.paquetes : []);
    } catch (error) {
      console.error("Error cargando detalle:", error);
      Swal.fire("Error", "No se pudo cargar el detalle del despacho", "error");
    }
  };

  const cargarCatalogos = async () => {
    setLoadingCatalogos(true);
    try {
      const { data } = await axios.get("/api/paquetes/catalogo-estados");
      const lista = Array.isArray(data) ? data : [];
      setCatalogoEstados(lista);

      const oficinasUnicas = [
        ...new Map(
          lista.map((item: CatalogoEstado) => [item.oficina_id, item])
        ).values(),
      ] as CatalogoEstado[];

      setOficinasCatalogo(oficinasUnicas);
    } catch (error) {
      console.error("Error cargando catalogos de despacho:", error);
      Swal.fire("Error", "No se pudieron cargar los catalogos", "error");
    } finally {
      setLoadingCatalogos(false);
    }
  };

  useEffect(() => {
    cargarDespachos();
    cargarCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seleccionarOficina = (oficinaSeleccionada: string) => {
    setOficina(oficinaSeleccionada);
    setPuntoControl("");
    setEstadoGuia("");
    setEstadosCatalogo([]);

    const puntos = catalogoEstados.filter(
      (item) => item.oficina === oficinaSeleccionada
    );

    const puntosUnicos = [
      ...new Map(
        puntos.map((item: CatalogoEstado) => [item.punto_control_id, item])
      ).values(),
    ] as CatalogoEstado[];

    setPuntosControl(puntosUnicos);
  };

  const seleccionarPuntoControl = (puntoSeleccionado: string) => {
    setPuntoControl(puntoSeleccionado);
    setEstadoGuia("");

    const estados = catalogoEstados.filter(
      (item) =>
        item.oficina === oficina && item.punto_control === puntoSeleccionado
    );

    setEstadosCatalogo(estados);
  };

  const crearDespacho = async () => {
    if (!nombre.trim() || !oficina || !puntoControl || !estadoGuia) {
      Swal.fire("Aviso", "Completa los campos requeridos del despacho", "warning");
      return;
    }

    setGuardando(true);
    try {
      const { data } = await axios.post("/api/despachos", {
        nombre: nombre.trim(),
        observaciones,
        oficina,
        punto_control: puntoControl,
        estado_guia: estadoGuia,
        fecha: fechaDespacho,
        responsable: usuario?.nombre,
      });

      if (!activo && data.despacho?.id) {
        await axios.patch(`/api/despachos/${data.despacho.id}/estado`, {
          estado: "cerrado",
        });
      }

      setNombre("");
      setObservaciones("");
      setOficina("");
      setPuntoControl("");
      setEstadoGuia("");
      setPuntosControl([]);
      setEstadosCatalogo([]);
      setActivo(true);
      setMostrarFormulario(false);
      await cargarDespachos();

      if (data.despacho) {
        await cargarDetalle({
          ...data.despacho,
          estado: activo ? data.despacho.estado : "cerrado",
        });
      }

      Swal.fire("Listo", "Despacho creado correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo crear el despacho",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarDespacho = async () => {
    if (!despachoSeleccionado || despachoCerrado) return;

    const resultado = await Swal.fire({
      title: "Editar despacho",
      html: `
        <input id="nombre-despacho" class="swal2-input" placeholder="Nombre" value="${despachoSeleccionado.nombre || ""}">
        <textarea id="obs-despacho" class="swal2-textarea" placeholder="Observaciones">${despachoSeleccionado.observaciones || ""}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#5B000D",
      preConfirm: () => {
        const nombreInput = document.getElementById(
          "nombre-despacho"
        ) as HTMLInputElement | null;
        const obsInput = document.getElementById(
          "obs-despacho"
        ) as HTMLTextAreaElement | null;

        return {
          nombre: nombreInput?.value || "",
          observaciones: obsInput?.value || "",
        };
      },
    });

    if (!resultado.isConfirmed) return;

    try {
      await axios.put(`/api/despachos/${despachoSeleccionado.id}`, resultado.value);
      await cargarDespachos();
      await cargarDetalle(despachoSeleccionado);
      Swal.fire("Listo", "Despacho actualizado correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo editar el despacho",
        "error"
      );
    }
  };

  const cambiarEstadoDespacho = async () => {
    if (!despachoSeleccionado) return;

    const nuevoEstado = despachoCerrado ? "abierto" : "cerrado";
    const confirmacion = await Swal.fire({
      title: despachoCerrado ? "Abrir despacho" : "Cerrar despacho",
      text: despachoCerrado
        ? "El despacho volvera a permitir modificaciones."
        : "Al cerrarlo no se podra editar, eliminar ni agregar HAWB.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: despachoCerrado ? "Abrir" : "Cerrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#5B000D",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.patch(`/api/despachos/${despachoSeleccionado.id}/estado`, {
        estado: nuevoEstado,
      });
      await cargarDespachos();
      await cargarDetalle(despachoSeleccionado);
      Swal.fire("Listo", `Despacho ${nuevoEstado} correctamente`, "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo cambiar el estado",
        "error"
      );
    }
  };

  const eliminarDespacho = async () => {
    if (!despachoSeleccionado || despachoCerrado) return;

    const confirmacion = await Swal.fire({
      title: "Eliminar despacho",
      text: `Se eliminara ${despachoSeleccionado.codigo}. Esta accion no afecta las solicitudes.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#991b1b",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.delete(`/api/despachos/${despachoSeleccionado.id}`);
      setDespachoSeleccionado(null);
      setPaquetes([]);
      await cargarDespachos();
      Swal.fire("Listo", "Despacho eliminado correctamente", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo eliminar el despacho",
        "error"
      );
    }
  };

  const agregarHawb = async () => {
    if (!despachoSeleccionado || despachoCerrado || !hawb.trim()) return;

    setAgregandoHawb(true);
    try {
      await axios.post(`/api/despachos/${despachoSeleccionado.id}/hawbs`, {
        hawb: hawb.trim(),
        responsable: usuario?.nombre,
      });

      setHawb("");
      await cargarDetalle(despachoSeleccionado);
      await cargarDespachos();
      Swal.fire("Listo", "HAWB agregado al despacho", "success");
    } catch (error: any) {
      Swal.fire(
        "No se pudo agregar",
        error.response?.data?.mensaje || "Valida el HAWB ingresado",
        "warning"
      );
    } finally {
      setAgregandoHawb(false);
    }
  };

  const quitarHawb = async (hawbSeleccionado: string) => {
    if (!despachoSeleccionado || despachoCerrado) return;

    const confirmacion = await Swal.fire({
      title: "Retirar HAWB",
      text: `Deseas retirar ${hawbSeleccionado} de este despacho?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Retirar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#991b1b",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.delete(
        `/api/despachos/${despachoSeleccionado.id}/hawbs/${encodeURIComponent(
          hawbSeleccionado
        )}`,
        { data: { responsable: usuario?.nombre } }
      );
      await cargarDetalle(despachoSeleccionado);
      await cargarDespachos();
      Swal.fire("Listo", "HAWB retirado del despacho", "success");
    } catch (error: any) {
      Swal.fire(
        "Error",
        error.response?.data?.mensaje || "No se pudo retirar el HAWB",
        "error"
      );
    }
  };

  return (
    <UserDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden text-gray-800 px-6 lg:px-10 pb-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Crear Despachos</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Crear Despachos
        </p>

        <section className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-[0_22px_55px_rgba(17,24,39,0.10)] sm:p-6">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-red-950/5" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-slate-900/5" />

          <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                Control de planillas
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-gray-800">
                Crear nuevo despacho operativo
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-gray-500">
                Registra el despacho y luego agrega los HAWB desbloqueados desde el panel de detalle.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-green-700">
                  Abiertos
                </p>
                <p className="mt-1 text-2xl font-black text-green-800">
                  {resumen.abiertos}
                </p>
              </div>
              <div className="rounded-xl border border-red-900/10 bg-red-50 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-950">
                  Cerrados
                </p>
                <p className="mt-1 text-2xl font-black text-red-950">
                  {resumen.cerrados}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-slate-50 p-3 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">
                  HAWB
                </p>
                <p className="mt-1 text-2xl font-black text-gray-800">
                  {resumen.hawbs}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setMostrarFormulario((prev) => !prev)}
              className="rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800"
            >
              {mostrarFormulario ? "Ocultar formulario" : "Crear despacho"}
            </button>
          </div>

          {mostrarFormulario && (
            <div className="relative mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-950 via-red-700 to-slate-300" />
              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full border border-red-950/10" />
              <div className="relative border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-950">
                      Nueva planilla
                    </p>
                    <h3 className="mt-1 text-lg font-black text-gray-800">
                      Datos operativos del despacho
                    </h3>
                  </div>
                  <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    * Campos requeridos
                  </span>
                </div>
              </div>

              <div className="relative grid gap-4 p-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Descripcion *
                  </label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                    placeholder="Ej: Despacho operativo del dia"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Fecha
                  </label>
                  <input
                    value={fechaDespacho}
                    readOnly
                    className="w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-green-700">
                    Usuario *
                  </label>
                  <input
                    value={usuario?.nombre || usuario?.email || "Usuario del sistema"}
                    readOnly
                    className="w-full rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-black text-gray-700 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Oficina *
                  </label>
                  <select
                    value={oficina}
                    onChange={(e) => seleccionarOficina(e.target.value)}
                    disabled={loadingCatalogos}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {loadingCatalogos ? "Cargando..." : "Seleccionar oficina"}
                    </option>
                    {oficinasCatalogo.map((item) => (
                      <option key={item.oficina_id} value={item.oficina}>
                        {item.oficina}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Punto de control *
                  </label>
                  <select
                    value={puntoControl}
                    onChange={(e) => seleccionarPuntoControl(e.target.value)}
                    disabled={!oficina}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {oficina ? "Seleccionar punto de control" : "Selecciona una oficina"}
                    </option>
                    {puntosControl.map((item) => (
                      <option key={item.punto_control_id} value={item.punto_control}>
                        {item.punto_control}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Estado de guia *
                  </label>
                  <select
                    value={estadoGuia}
                    onChange={(e) => setEstadoGuia(e.target.value)}
                    disabled={!puntoControl}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">
                      {puntoControl ? "Seleccionar estado" : "Selecciona un punto"}
                    </option>
                    {estadosCatalogo.map((item) => (
                      <option key={item.estado_id} value={item.estado}>
                        {item.estado}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Estado del despacho
                  </label>
                  <label className="flex h-[46px] cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-slate-50/80 px-4">
                    <span className={`text-sm font-black ${activo ? "text-green-700" : "text-gray-500"}`}>
                      {activo ? "Activo" : "Inactivo"}
                    </span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="relative h-8 w-16 rounded-full bg-gray-400 shadow-inner transition peer-checked:bg-green-500">
                      <span
                        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                          activo ? "translate-x-8" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </label>
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-gray-500">
                    Observaciones
                  </label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-red-950 focus:bg-white focus:ring-4 focus:ring-red-950/10"
                    placeholder="Notas internas del despacho"
                  />
                </div>
              </div>

              <div className="relative flex flex-col gap-2 border-t border-gray-200 bg-gradient-to-r from-slate-50 via-white to-red-50/30 px-5 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setNombre("");
                    setObservaciones("");
                    setOficina("");
                    setPuntoControl("");
                    setEstadoGuia("");
                    setPuntosControl([]);
                    setEstadosCatalogo([]);
                    setActivo(true);
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-black text-gray-600 shadow-sm transition hover:border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearDespacho}
                  disabled={guardando}
                  className="rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-white via-red-50/30 to-white px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">
                  Despachos
                </p>
                <h3 className="mt-1 text-lg font-semibold text-gray-800">
                  Planillas creadas
                </h3>
              </div>
              <button
                onClick={cargarDespachos}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-black text-gray-700 shadow-sm transition hover:border-red-900/30 hover:text-red-950"
              >
                Actualizar
              </button>
            </div>

            <div className="max-h-[620px] overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-900 border-t-transparent" />
                </div>
              ) : despachos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-semibold text-gray-500">
                    Aun no hay despachos creados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {despachos.map((despacho) => {
                    const activo = despachoSeleccionado?.id === despacho.id;
                    const cerrado = despacho.estado?.toLowerCase() === "cerrado";

                    return (
                      <button
                        key={despacho.id}
                        onClick={() => cargarDetalle(despacho)}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                          activo
                            ? "border-red-900/30 bg-red-50/70 shadow-lg shadow-red-950/10"
                            : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-red-900/20 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-black text-red-950">
                              {despacho.codigo}
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-gray-800">
                              {despacho.nombre || "Despacho sin nombre"}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                              cerrado
                                ? "bg-gray-200 text-gray-700"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {despacho.estado}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl bg-slate-50 p-2">
                            <p className="text-[10px] font-black uppercase text-gray-400">
                              HAWB
                            </p>
                            <p className="text-sm font-black text-gray-800">
                              {despacho.cantidad_hawbs || 0}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2">
                            <p className="text-[10px] font-black uppercase text-gray-400">
                              Peso
                            </p>
                            <p className="text-sm font-black text-gray-800">
                              {Number(despacho.peso_total || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-2">
                            <p className="text-[10px] font-black uppercase text-gray-400">
                              Fecha
                            </p>
                            <p className="truncate text-xs font-bold text-gray-700">
                              {despacho.fecha_creacion || "-"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
            {despachoSeleccionado ? (
              <>
                <div className="relative overflow-hidden bg-gradient-to-r from-red-950 via-red-900 to-slate-950 px-5 py-5 text-white">
                  <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full border border-white/10" />
                  <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-100/80">
                        Detalle del despacho
                      </p>
                      <h3 className="mt-1 font-mono text-2xl font-black">
                        {despachoSeleccionado.codigo}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-red-50/80">
                        {despachoSeleccionado.nombre || "Despacho sin nombre"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={editarDespacho}
                        disabled={despachoCerrado}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        onClick={cambiarEstadoDespacho}
                        className="rounded-xl bg-white px-4 py-2 text-xs font-black text-red-950 transition hover:bg-red-50"
                      >
                        {despachoCerrado ? "Abrir" : "Cerrar"}
                      </button>
                      <button
                        onClick={eliminarDespacho}
                        disabled={despachoCerrado}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-b border-gray-200 bg-gradient-to-r from-white via-gray-50 to-white p-5">
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Agregar HAWB al despacho
                      </label>
                      <input
                        value={hawb}
                        onChange={(e) => setHawb(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") agregarHawb();
                        }}
                        disabled={despachoCerrado}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm font-black text-gray-800 outline-none transition placeholder:font-sans placeholder:font-semibold focus:border-red-950 focus:ring-4 focus:ring-red-950/10 disabled:bg-gray-100"
                        placeholder={
                          despachoCerrado
                            ? "Despacho cerrado"
                            : "Ingrese HAWB desbloqueado"
                        }
                      />
                    </div>
                    <button
                      onClick={agregarHawb}
                      disabled={despachoCerrado || agregandoHawb || !hawb.trim()}
                      className="self-end rounded-2xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                    >
                      {agregandoHawb ? "Agregando..." : "Agregar HAWB"}
                    </button>
                  </div>

                  {despachoCerrado && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-950">
                      Este despacho esta cerrado. Para modificarlo debes abrirlo primero.
                    </div>
                  )}
                </div>

                <div className="w-full max-w-full overflow-x-auto">
                  <table className="min-w-[980px] w-full border-collapse">
                    <thead className="bg-gray-50 text-xs font-black uppercase tracking-[0.14em] text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left">HAWB</th>
                        <th className="px-4 py-3 text-left">Tracking</th>
                        <th className="px-4 py-3 text-left">Cliente</th>
                        <th className="px-4 py-3 text-left">Contenido</th>
                        <th className="px-4 py-3 text-center">Peso</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                        <th className="px-4 py-3 text-center">Opciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paquetes.length > 0 ? (
                        paquetes.map((paquete) => (
                          <tr key={paquete.despacho_paquete_id} className="text-sm hover:bg-red-50/40">
                            <td className="px-4 py-3 font-mono font-black text-red-950">
                              {paquete.hawb}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {paquete.tracking || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <p className="font-semibold">{paquete.cliente || "-"}</p>
                              <p className="font-mono text-xs text-gray-400">
                                {paquete.codigo_referencia || ""}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              <p className="line-clamp-2 max-w-[240px]">
                                {paquete.contenido || "-"}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-700">
                              {Number(paquete.peso || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                                {paquete.estado_actual || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => quitarHawb(paquete.hawb)}
                                disabled={despachoCerrado}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                Retirar
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center">
                            <p className="font-semibold text-gray-500">
                              Este despacho aun no tiene HAWB agregados.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-950">
                    +
                  </div>
                  <p className="text-lg font-black text-gray-800">
                    Selecciona o crea un despacho
                  </p>
                  <p className="mt-2 max-w-md text-sm font-semibold text-gray-500">
                    Desde aqui podras agregar HAWB, cerrar la planilla y controlar el armado operativo.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </UserDashboardLayout>
  );
}
