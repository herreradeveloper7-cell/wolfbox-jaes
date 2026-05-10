import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function ModalCrearDestinatario({ onClose, onSave }: Props) {
  const [closing, setClosing] = useState(false);

  const [paises, setPaises] = useState<any[]>([]);
  const [regiones, setRegiones] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);

  const [form, setForm] = useState({
      nombre: "",
      telefono: "",
      direccion: "",
      pais_id: "",
      region_id: "",
      ciudad_id: "",
      pais: "",
      departamento: "",
      ciudad: "",
  });

  useEffect(() => {
  const cargarPaises = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/catalogos/paises");
      const data = await res.json();
      setPaises(data);
    } catch (error) {
      console.error("Error cargando países:", error);
    }
  };

  cargarPaises();
}, []);

  useEffect(() => {
    if (!form.pais_id) {
      setRegiones([]);
      setCiudades([]);
      return;
    }

    const cargarRegiones = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/catalogos/regiones/${form.pais_id}`
        );
        const data = await res.json();
        setRegiones(data);
        setCiudades([]);
      } catch (error) {
        console.error("Error cargando regiones:", error);
      }
    };

    cargarRegiones();
  }, [form.pais_id]);

  useEffect(() => {
    if (!form.region_id) {
      setCiudades([]);
      return;
    }

    const cargarCiudades = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/catalogos/ciudades/${form.region_id}`
        );
        const data = await res.json();
        setCiudades(data);
      } catch (error) {
        console.error("Error cargando ciudades:", error);
      }
    };

    cargarCiudades();
  }, [form.region_id]);

  const [errores, setErrores] = useState<{
    nombre?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      const soloDigitos = value.replace(/\D/g, "");
      setForm((f) => ({ ...f, telefono: soloDigitos }));
      if (errores.telefono) setErrores((err) => ({ ...err, telefono: undefined }));
      return;
    }

    setForm((f) => ({ ...f, [name]: value }));
    if (errores[name as keyof typeof errores]) {
      setErrores((err) => ({ ...err, [name]: undefined }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "pais_id") {
      const paisSeleccionado = paises.find((p) => String(p.id) === value);

      setForm((f) => ({
        ...f,
        pais_id: value,
        pais: paisSeleccionado?.nombre || "",
        region_id: "",
        departamento: "",
        ciudad_id: "",
        ciudad: "",
      }));
    }

    if (name === "region_id") {
      const regionSeleccionada = regiones.find((r) => String(r.id) === value);

      setForm((f) => ({
        ...f,
        region_id: value,
        departamento: regionSeleccionada?.nombre || "",
        ciudad_id: "",
        ciudad: "",
      }));
    }

    if (name === "ciudad_id") {
      const ciudadSeleccionada = ciudades.find((c) => String(c.id) === value);

      setForm((f) => ({
        ...f,
        ciudad_id: value,
        ciudad: ciudadSeleccionada?.nombre || "",
      }));
    }

    if (errores[name as keyof typeof errores]) {
      setErrores((err) => ({ ...err, [name]: undefined }));
    }
  };

  const validar = () => {
    const e: typeof errores = {};

    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
    if (!form.telefono.trim()) {
      e.telefono = "El celular es obligatorio";
    } else if (form.telefono.length < 7 || form.telefono.length > 15) {
      e.telefono = "Ingresa entre 7 y 15 dígitos";
    }

    if (!form.direccion.trim()) {
      e.direccion = "La dirección es obligatoria";
    } else if (form.direccion.trim().length < 5) {
      e.direccion = "La dirección es muy corta";
    }

    if (!form.pais_id) e.pais = "El país es obligatorio";
    if (!form.region_id) e.departamento = "La región es obligatoria";
    if (!form.ciudad_id) e.ciudad = "La ciudad es obligatoria";

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleGuardar = () => {
    if (!validar()) return;

    setClosing(true);
    setTimeout(() => {
      onSave(form);
    }, 280);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 280);
  };

return createPortal(
  <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md">
    <div
      className={`relative w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.35)] ${
        closing ? "animate-fade-out" : "animate-fade-in"
      }`}
    >
      <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#5a0c0c] via-[#b98b8b] to-[#5a0c0c]" />

      <div className="flex items-center justify-between bg-gradient-to-r from-[#5a0c0c] via-[#6f1010] to-[#3d0808] px-7 py-5 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">
            Gestión de destinatarios
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-wide">
            Nuevo Destinatario
          </h2>
          <p className="mt-1 text-sm text-white/75">
            Registra la información de envío del cliente.
          </p>
        </div>

        <button
          onClick={handleClose}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl leading-none text-white transition hover:bg-white/20"
        >
          ×
        </button>
      </div>

      <div className="max-h-[70vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-7 py-6">
        <div className="mb-5 rounded-2xl border border-red-950/10 bg-red-950/[0.03] px-4 py-3">
          <p className="text-sm font-semibold text-gray-700">
            Complete los datos obligatorios para asociar este destinatario al cliente seleccionado.
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10 ${
                  errores.nombre ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ej: Juan Pérez"
              />
              {errores.nombre && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errores.nombre}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Celular *
              </label>
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10 ${
                  errores.telefono ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="### ### ####"
                inputMode="numeric"
              />
              {errores.telefono && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errores.telefono}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Dirección *
            </label>
            <input
              type="text"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10 ${
                errores.direccion ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Calle 123 #45-67"
            />
            {errores.direccion && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                {errores.direccion}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                País *
              </label>
              <select
                name="pais_id"
                value={form.pais_id}
                onChange={handleSelectChange}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10 ${
                  errores.pais ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Seleccione país</option>
                {paises.map((pais) => (
                  <option key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </option>
                ))}
              </select>
              {errores.pais && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errores.pais}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Estado / Departamento *
              </label>
              <select
                name="region_id"
                value={form.region_id}
                onChange={handleSelectChange}
                disabled={!form.pais_id}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10 ${
                  errores.departamento ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">
                  {form.pais_id ? "Seleccione región" : "Seleccione país primero"}
                </option>
                {regiones.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.nombre}
                  </option>
                ))}
              </select>
              {errores.departamento && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errores.departamento}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Ciudad *
              </label>
              <select
                name="ciudad_id"
                value={form.ciudad_id}
                onChange={handleSelectChange}
                disabled={!form.region_id}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10 ${
                  errores.ciudad ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">
                  {form.region_id ? "Seleccione ciudad" : "Seleccione región primero"}
                </option>
                {ciudades.map((ciudad) => (
                  <option key={ciudad.id} value={ciudad.id}>
                    {ciudad.nombre}
                  </option>
                ))}
              </select>
              {errores.ciudad && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  {errores.ciudad}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t border-gray-200 bg-white/95 px-7 py-5 backdrop-blur">
        <button
          onClick={handleClose}
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
        >
          Cancelar
        </button>

        <button
          onClick={handleGuardar}
          className="rounded-xl bg-gradient-to-r from-[#5a0c0c] to-[#7a1111] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-950/25 transition hover:scale-[1.02] hover:from-[#3d0808] hover:to-[#5a0c0c]"
        >
          Guardar Destinatario
        </button>
      </div>
    </div>
  </div>,
  document.body
);
}
