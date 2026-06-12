import { FormEvent, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout";
import iconHome from "../../../assets/home-svgrepo-com.svg";

type Promocion = {
  id: number;
  tienda: string;
  titulo: string;
  descripcion: string;
  categoria: string | null;
  evento: string | null;
  url_destino: string;
  imagen: string | null;
  imagen_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  orden: number;
  estado: "Borrador" | "Programada" | "Activa" | "Finalizada";
};

const formInicial = {
  tienda: "",
  titulo: "",
  descripcion: "",
  categoria: "",
  evento: "",
  url_destino: "",
  fecha_inicio: "",
  fecha_fin: "",
  orden: "0",
};

const fechaInput = (valor?: string) => valor ? new Date(valor).toISOString().slice(0, 16) : "";

export default function PromocionesTiendas() {
  const navigate = useNavigate();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Promocion | null>(null);
  const [form, setForm] = useState(formInicial);
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pagina: String(pagina), limite: "10", estado });
      if (busquedaAplicada) params.set("busqueda", busquedaAplicada);
      const { data } = await axios.get(`/api/promociones?${params}`);
      setPromociones(data.promociones || []);
      setTotal(Number(data.paginacion?.total || 0));
      setTotalPaginas(Number(data.paginacion?.total_paginas || 1));
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron cargar las promociones", "error");
    } finally {
      setLoading(false);
    }
  }, [busquedaAplicada, estado, pagina]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const nueva = () => {
    setEditando(null);
    setForm(formInicial);
    setImagen(null);
    setPreview(null);
    setMostrarFormulario(true);
  };

  const editar = (promo: Promocion) => {
    setEditando(promo);
    setForm({
      tienda: promo.tienda,
      titulo: promo.titulo,
      descripcion: promo.descripcion,
      categoria: promo.categoria || "",
      evento: promo.evento || "",
      url_destino: promo.url_destino,
      fecha_inicio: fechaInput(promo.fecha_inicio),
      fecha_fin: fechaInput(promo.fecha_fin),
      orden: String(promo.orden || 0),
    });
    setImagen(null);
    setPreview(promo.imagen);
    setMostrarFormulario(true);
  };

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    if (!imagen && !editando?.imagen) {
      Swal.fire("Imagen requerida", "Carga una imagen para la promoción.", "warning");
      return;
    }
    const data = new FormData();
    Object.entries(form).forEach(([clave, valor]) => data.append(clave, String(valor)));
    if (imagen) data.append("imagen", imagen);

    setSaving(true);
    try {
      if (editando) await axios.put(`/api/promociones/${editando.id}`, data);
      else await axios.post("/api/promociones", data);
      setMostrarFormulario(false);
      await cargar();
      Swal.fire("Guardada", "La promoción quedó publicada y se mostrará a los clientes durante su vigencia.", "success");
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.mensaje || "No se pudo guardar la promoción", "error");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (promo: Promocion) => {
    const respuesta = await Swal.fire({ title: "¿Eliminar promoción?", text: promo.titulo, icon: "warning", showCancelButton: true, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar", confirmButtonColor: "#5a0c0c" });
    if (!respuesta.isConfirmed) return;
    try {
      await axios.delete(`/api/promociones/${promo.id}`);
      await cargar();
      Swal.fire("Eliminada", "La promoción fue eliminada.", "success");
    } catch (error: any) {
      Swal.fire("Error", error.response?.data?.mensaje || "No se pudo eliminar", "error");
    }
  };

  return (
    <UserDashboardLayout scrollable>
      <div className="overflow-x-hidden px-4 py-4 text-gray-800 animate-fade-in sm:px-6 lg:px-10">
        <h1 className="mb-2 text-3xl font-bold text-red-900">Promociones de Tiendas</h1>
        <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
          <img src={iconHome} alt="Inicio" className="h-4 w-4" />
          <button onClick={() => navigate("/dashboardUsuario")} className="cursor-pointer font-semibold text-gray-700 hover:underline">Dashboard</button>
          &gt; Gestión de promociones
        </p>

        <section className="relative mb-8 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-950/5" />
          <div className="relative p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-gray-200/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-950">Contenido para clientes</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-700">Administración de campañas</h2>
                <p className="mt-1 text-xs font-semibold text-gray-500">Programa ofertas y temporadas sin almacenar imágenes en la base de datos.</p>
              </div>
              <button onClick={nueva} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20"><Plus size={17} /> Nueva promoción</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setPagina(1); setBusquedaAplicada(busqueda.trim()); }} className="grid gap-5 md:grid-cols-[1fr_220px_auto]">
              <Campo label="Buscar promoción"><input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Tienda, título, categoría o evento" className={inputClase} /></Campo>
              <Campo label="Estado"><select value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} className={inputClase}>{["Todos", "Borrador", "Programada", "Activa", "Finalizada"].map((item) => <option key={item}>{item}</option>)}</select></Campo>
              <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-950 px-6 text-sm font-bold text-white"><Search size={16} /> Buscar</button>
            </form>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-[0_22px_55px_rgba(17,24,39,0.10)]">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-red-950 via-[#8B0D16] to-gray-300" />
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-white via-red-50/40 to-white px-6 py-5">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-red-950">Campañas</p><h2 className="mt-1 text-xl font-semibold text-gray-700">Promociones registradas</h2></div>
            <span className="rounded-full border border-red-900/15 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-950">{total} registros</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-gradient-to-r from-gray-100 via-white to-gray-50 text-[10px] font-black uppercase tracking-[0.16em] text-gray-600"><tr><th className="px-5 py-4 text-left">Promoción</th><th className="px-5 py-4 text-left">Tienda</th><th className="px-5 py-4 text-left">Vigencia</th><th className="px-5 py-4 text-center">Estado</th><th className="px-5 py-4 text-center">Acciones</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan={5} className="h-40 text-center font-semibold text-gray-500">Cargando promociones...</td></tr> : promociones.length === 0 ? <tr><td colSpan={5} className="h-40 text-center font-semibold text-gray-500">No hay promociones registradas</td></tr> : promociones.map((promo) => (
                  <tr key={promo.id} className="hover:bg-red-50/30">
                    <td className="px-5 py-4"><div className="flex items-center gap-3">{promo.imagen ? <img src={promo.imagen} alt="" className="h-14 w-20 rounded-lg border border-gray-200 object-cover" /> : <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-gray-100 text-gray-400"><ImagePlus size={20} /></div>}<div><p className="font-black text-gray-800">{promo.titulo}</p><p className="mt-1 text-xs font-semibold text-gray-500">{promo.evento || promo.categoria || "Promoción general"}</p></div></div></td>
                    <td className="px-5 py-4 font-bold text-gray-700">{promo.tienda}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-gray-600">{new Date(promo.fecha_inicio).toLocaleDateString("es-CO")} - {new Date(promo.fecha_fin).toLocaleDateString("es-CO")}</td>
                    <td className="px-5 py-4 text-center"><Estado estado={promo.estado} /></td>
                    <td className="px-5 py-4"><div className="flex justify-center gap-2"><button title="Editar" onClick={() => editar(promo)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-red-950 hover:bg-red-50"><Pencil size={16} /></button><button title="Eliminar" onClick={() => eliminar(promo)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-800 hover:bg-red-100"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/60 px-6 py-4 text-sm font-semibold text-gray-500"><span>Página {pagina} de {totalPaginas}</span><div className="flex gap-2"><button disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"><ChevronLeft size={17} /></button><button disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40"><ChevronRight size={17} /></button></div></div>
        </section>

        {mostrarFormulario && <ModalPromocion form={form} setForm={setForm} preview={preview} setPreview={setPreview} setImagen={setImagen} saving={saving} editando={editando} onClose={() => setMostrarFormulario(false)} onSubmit={guardar} />}
      </div>
    </UserDashboardLayout>
  );
}

const inputClase = "mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 outline-none focus:border-red-950 focus:ring-4 focus:ring-red-950/10";
function Campo({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="text-sm font-bold text-gray-700">{label}</span>{children}</label>; }
function Estado({ estado }: { estado: Promocion["estado"] }) { const estilos = estado === "Activa" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : estado === "Programada" ? "bg-blue-50 text-blue-700 border-blue-200" : estado === "Finalizada" ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-amber-50 text-amber-700 border-amber-200"; return <span className={`rounded-full border px-3 py-1 text-xs font-black ${estilos}`}>{estado}</span>; }

function ModalPromocion({ form, setForm, preview, setPreview, setImagen, saving, editando, onClose, onSubmit }: any) {
  const [tiendasCatalogo, setTiendasCatalogo] = useState<string[]>([]);
  const [mostrarTiendas, setMostrarTiendas] = useState(false);

  const tiendasSugeridas = tiendasCatalogo
    .filter((tienda) => tienda.toLowerCase().includes(form.tienda.trim().toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    let activo = true;

    axios.get("/api/guias/tiendas")
      .then(({ data }) => {
        if (!activo || !data.ok) return;
        const unicas = new Map<string, string>();
        (data.tiendas || []).forEach((item: { tienda?: string }) => {
          const tienda = item.tienda?.trim();
          if (tienda) unicas.set(tienda.toLowerCase(), tienda);
        });
        setTiendasCatalogo(Array.from(unicas.values()));
      })
      .catch((error) => console.error("Error cargando tiendas sugeridas:", error));

    return () => { activo = false; };
  }, []);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", cerrarConEscape);
    };
  }, [onClose, saving]);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={() => !saving && onClose()}
      role="presentation"
    >
      <section
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-promocion"
      >
        <div className="h-1 shrink-0 bg-gradient-to-r from-red-950 via-red-800 to-red-500" />
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-950">Contenido promocional</p>
            <h2 id="titulo-modal-promocion" className="mt-1 text-xl font-black text-gray-900">
              {editando ? "Editar promoción" : "Nueva promoción"}
            </h2>
          </div>
          <button
            type="button"
            title="Cerrar"
            aria-label="Cerrar modal"
            disabled={saving}
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto overscroll-contain p-5 md:grid-cols-2 sm:p-6">
            <label>
              <span className="text-sm font-bold text-gray-700">Tienda</span>
              <div className="relative">
                <input
                  required
                  autoComplete="off"
                  value={form.tienda}
                  onChange={(e) => {
                    setForm({ ...form, tienda: e.target.value });
                    setMostrarTiendas(true);
                  }}
                  onFocus={() => setMostrarTiendas(true)}
                  onBlur={() => window.setTimeout(() => setMostrarTiendas(false), 150)}
                  className={inputClase}
                  placeholder="Escribe o selecciona una tienda"
                />
                {mostrarTiendas && tiendasSugeridas.length > 0 && (
                  <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="sticky top-0 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-red-900">
                      Tiendas registradas
                    </div>
                    {tiendasSugeridas.map((tienda) => (
                      <button
                        type="button"
                        key={tienda}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          setForm({ ...form, tienda });
                          setMostrarTiendas(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-semibold text-gray-800 transition hover:bg-red-50 hover:text-red-900"
                      >
                        <span className="truncate">{tienda}</span>
                        <span className="rounded-full bg-red-900/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-900">BD</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
            <Campo label="Título"><input required maxLength={180} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputClase} /></Campo>
            <Campo label="Categoría"><input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputClase} placeholder="Tecnología, hogar, moda..." /></Campo>
            <Campo label="Evento"><input value={form.evento} onChange={(e) => setForm({ ...form, evento: e.target.value })} className={inputClase} placeholder="Black Friday, Mother's Day..." /></Campo>
            <label className="md:col-span-2"><span className="text-sm font-bold text-gray-700">Descripción</span><textarea required maxLength={600} rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold outline-none focus:border-red-950 focus:ring-4 focus:ring-red-950/10" /></label>
            <Campo label="Enlace de la oferta"><input required type="url" value={form.url_destino} onChange={(e) => setForm({ ...form, url_destino: e.target.value })} className={inputClase} placeholder="https://..." /></Campo>
            <Campo label="Fecha de inicio"><input required type="datetime-local" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className={inputClase} /></Campo>
            <Campo label="Fecha de finalización"><input required type="datetime-local" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className={inputClase} /></Campo>
            <Campo label="Orden de aparición"><input type="number" min="0" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} className={inputClase} /></Campo>
            <label>
              <span className="text-sm font-bold text-gray-700">Imagen</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (!file) return;
                  if (!new Set(["image/jpeg", "image/webp"]).has(file.type)) {
                    event.target.value = "";
                    Swal.fire("Formato no permitido", "Selecciona una imagen JPG, JPEG o WEBP.", "warning");
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    event.target.value = "";
                    Swal.fire("Imagen demasiado pesada", "La imagen debe pesar máximo 2 MB.", "warning");
                    return;
                  }
                  setImagen(file);
                  setPreview(URL.createObjectURL(file));
                }}
                className="mt-2 block w-full text-sm font-semibold text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-red-50 file:px-4 file:py-3 file:font-bold file:text-red-950"
              />
              <span className="mt-2 block text-xs font-semibold text-gray-500">JPG, JPEG o WEBP. Máximo 2 MB.</span>
            </label>
            {preview && <div className="md:col-span-2"><img src={preview} alt="Vista previa" className="h-40 w-full rounded-xl border border-gray-200 object-cover" /></div>}
          </div>

          <footer className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-white px-5 py-4 sm:px-6">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
            <button disabled={saving} className="rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-7 py-3 text-sm font-black text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar promoción"}</button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
