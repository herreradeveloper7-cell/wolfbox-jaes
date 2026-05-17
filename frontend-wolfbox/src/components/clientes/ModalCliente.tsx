import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
  cliente: any;
  onClose: () => void;
}

type CatalogoItem = {
  id: number | string;
  nombre: string;
};

const normalizarCatalogo = (data: any, key: string): CatalogoItem[] => {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
};

export default function ModalCliente({ cliente, onClose }: Props) {
  const [editando, setEditando] = useState(false);
  const [paises, setPaises] = useState<CatalogoItem[]>([]);
  const [regiones, setRegiones] = useState<CatalogoItem[]>([]);
  const [ciudades, setCiudades] = useState<CatalogoItem[]>([]);

  const [form, setForm] = useState({
    primer_nombre: cliente?.primer_nombre || "",
    segundo_nombre: cliente?.segundo_nombre || "",
    primer_apellido: cliente?.primer_apellido || "",
    segundo_apellido: cliente?.segundo_apellido || "",
    correo: cliente?.correo || "",
    tipo_cliente: cliente?.tipo_cliente || "",
    pais_id: cliente?.pais_id ? String(cliente.pais_id) : "",
    region_id: cliente?.region_id ? String(cliente.region_id) : "",
    ciudad_id: cliente?.ciudad_id ? String(cliente.ciudad_id) : "",
    pais: cliente?.pais || "",
    region: cliente?.region || "",
    ciudad: cliente?.ciudad || "",
    direccion: cliente?.direccion || "",
    indicativo: cliente?.indicativo || "",
    celular: cliente?.celular || "",
    telefono_fijo: cliente?.telefono_fijo || "",
    genero: cliente?.genero || "",
    nombre_empresa: cliente?.nombre_empresa || "",
    tipo_identificacion: cliente?.tipo_identificacion || "",
    numero_identificacion: cliente?.numero_identificacion || "",
  });

  const nombreContacto = useMemo(
    () =>
      [
        cliente?.primer_nombre,
        cliente?.segundo_nombre,
        cliente?.primer_apellido,
        cliente?.segundo_apellido,
      ]
        .filter(Boolean)
        .join(" "),
    [cliente]
  );

  const nombreCompleto =
    cliente?.tipo_cliente === "empresarial"
      ? cliente?.nombre_empresa || nombreContacto
      : nombreContacto;

  useEffect(() => {
    const cargarPaises = async () => {
      try {
        const { data } = await axios.get("/api/catalogos/paises");
        setPaises(normalizarCatalogo(data, "paises"));
      } catch (error) {
        console.error("Error cargando paises:", error);
        setPaises([]);
      }
    };

    cargarPaises();
  }, []);

  useEffect(() => {
    if (form.pais_id || !form.pais || paises.length === 0) return;

    const paisActual = paises.find(
      (pais) => pais.nombre?.toLowerCase() === form.pais.toLowerCase()
    );

    if (paisActual) {
      setForm((prev) => ({ ...prev, pais_id: String(paisActual.id) }));
    }
  }, [form.pais, form.pais_id, paises]);

  useEffect(() => {
    if (!form.pais_id) {
      setRegiones([]);
      setCiudades([]);
      return;
    }

    const cargarRegiones = async () => {
      try {
        const { data } = await axios.get(`/api/catalogos/regiones/${form.pais_id}`);
        setRegiones(normalizarCatalogo(data, "regiones"));
      } catch (error) {
        console.error("Error cargando regiones:", error);
        setRegiones([]);
      }
    };

    cargarRegiones();
  }, [form.pais_id]);

  useEffect(() => {
    if (form.region_id || !form.region || regiones.length === 0) return;

    const regionActual = regiones.find(
      (region) => region.nombre?.toLowerCase() === form.region.toLowerCase()
    );

    if (regionActual) {
      setForm((prev) => ({ ...prev, region_id: String(regionActual.id) }));
    }
  }, [form.region, form.region_id, regiones]);

  useEffect(() => {
    if (!form.region_id) {
      setCiudades([]);
      return;
    }

    const cargarCiudades = async () => {
      try {
        const { data } = await axios.get(`/api/catalogos/ciudades/${form.region_id}`);
        setCiudades(normalizarCatalogo(data, "ciudades"));
      } catch (error) {
        console.error("Error cargando ciudades:", error);
        setCiudades([]);
      }
    };

    cargarCiudades();
  }, [form.region_id]);

  useEffect(() => {
    if (form.ciudad_id || !form.ciudad || ciudades.length === 0) return;

    const ciudadActual = ciudades.find(
      (ciudad) => ciudad.nombre?.toLowerCase() === form.ciudad.toLowerCase()
    );

    if (ciudadActual) {
      setForm((prev) => ({ ...prev, ciudad_id: String(ciudadActual.id) }));
    }
  }, [form.ciudad, form.ciudad_id, ciudades]);

  if (!cliente) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUbicacionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "pais_id") {
      const paisSeleccionado = paises.find((pais) => String(pais.id) === value);

      setForm((prev) => ({
        ...prev,
        pais_id: value,
        pais: paisSeleccionado?.nombre || "",
        region_id: "",
        region: "",
        ciudad_id: "",
        ciudad: "",
      }));
      return;
    }

    if (name === "region_id") {
      const regionSeleccionada = regiones.find((region) => String(region.id) === value);

      setForm((prev) => ({
        ...prev,
        region_id: value,
        region: regionSeleccionada?.nombre || "",
        ciudad_id: "",
        ciudad: "",
      }));
      return;
    }

    if (name === "ciudad_id") {
      const ciudadSeleccionada = ciudades.find((ciudad) => String(ciudad.id) === value);

      setForm((prev) => ({
        ...prev,
        ciudad_id: value,
        ciudad: ciudadSeleccionada?.nombre || "",
      }));
    }
  };

  const handleGuardarCambios = async () => {
    try {
      await axios.put(`/api/clientes/${cliente.id}`, form);

      await Swal.fire({
        icon: "success",
        title: "Cliente actualizado",
        text: "La informacion del cliente fue actualizada correctamente.",
        confirmButtonColor: "#5a0c0c",
      });

      setEditando(false);
      onClose();
    } catch (error) {
      console.error("Error actualizando cliente:", error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar la informacion del cliente.",
        confirmButtonColor: "#5a0c0c",
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#5a0c0c] via-[#b98b8b] to-[#5a0c0c]" />

        <div className="flex items-center justify-between bg-gradient-to-r from-[#5a0c0c] via-[#6f1010] to-[#3d0808] px-7 py-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">
              {editando ? "Edicion de cliente" : "Informacion del cliente"}
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-wide">
              {nombreCompleto || "Cliente"}
            </h2>

            <p className="mt-1 font-mono text-sm text-white/75">
              {cliente.codigo_referencia}
            </p>
          </div>

          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            x
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-7 py-6">
          {!editando ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Info label="Tipo cliente" value={cliente.tipo_cliente} />
              <Info
                label="Identificacion"
                value={`${cliente.tipo_identificacion || ""} ${cliente.numero_identificacion || ""}`}
              />
              <Info label="Correo" value={cliente.correo} />
              <Info label="Primer nombre" value={cliente.primer_nombre} />
              <Info label="Segundo nombre" value={cliente.segundo_nombre} />
              <Info label="Primer apellido" value={cliente.primer_apellido} />
              <Info label="Segundo apellido" value={cliente.segundo_apellido} />
              {cliente.tipo_cliente === "empresarial" && (
                <Info label="Razon social" value={cliente.nombre_empresa} />
              )}
              <Info label="Pais" value={cliente.pais} />
              <Info label="Region" value={cliente.region} />
              <Info label="Ciudad" value={cliente.ciudad} />
              <Info label="Direccion" value={cliente.direccion} />
              <Info label="Celular" value={`${cliente.indicativo || ""} ${cliente.celular || ""}`} />
              <Info label="Telefono fijo" value={cliente.telefono_fijo} />
              <Info label="Genero" value={cliente.genero} />
              <Info label="Fecha nacimiento" value={cliente.fecha_nacimiento?.slice?.(0, 10)} />
              <Info label="Fecha creacion" value={cliente.fecha_creacion?.slice?.(0, 10)} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CampoInput
                label="Correo"
                name="correo"
                value={form.correo}
                onChange={handleChange}
                type="email"
              />

              <CampoSelect
                label="Tipo de cliente"
                name="tipo_cliente"
                value={form.tipo_cliente}
                onChange={handleChange}
                options={[
                  { value: "personal", label: "Personal" },
                  { value: "empresarial", label: "Empresarial" },
                ]}
              />

              <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-4">
                <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.22em] text-[#5a0c0c]">
                  {form.tipo_cliente === "empresarial" ? "Datos del contacto" : "Datos del cliente"}
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <CampoInput
                    label="Primer nombre"
                    name="primer_nombre"
                    value={form.primer_nombre}
                    onChange={handleChange}
                  />

                  <CampoInput
                    label="Segundo nombre"
                    name="segundo_nombre"
                    value={form.segundo_nombre}
                    onChange={handleChange}
                  />

                  <CampoInput
                    label="Primer apellido"
                    name="primer_apellido"
                    value={form.primer_apellido}
                    onChange={handleChange}
                  />

                  <CampoInput
                    label="Segundo apellido"
                    name="segundo_apellido"
                    value={form.segundo_apellido}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {form.tipo_cliente === "empresarial" && (
                <>
                  <CampoInput
                    label="Razon social"
                    name="nombre_empresa"
                    value={form.nombre_empresa}
                    onChange={handleChange}
                  />

                  <CampoSelect
                    label="Tipo de identificacion"
                    name="tipo_identificacion"
                    value={form.tipo_identificacion}
                    onChange={handleChange}
                    options={[
                      { value: "NIT", label: "NIT" },
                      { value: "RUT", label: "RUT" },
                      { value: "OTRO", label: "Otro" },
                    ]}
                  />

                  <CampoInput
                    label="Numero de identificacion"
                    name="numero_identificacion"
                    value={form.numero_identificacion}
                    onChange={handleChange}
                  />
                </>
              )}

              <CampoSelect
                label="Pais"
                name="pais_id"
                value={form.pais_id}
                onChange={handleUbicacionChange}
                options={paises.map((pais) => ({
                  value: String(pais.id),
                  label: pais.nombre,
                }))}
              />

              <CampoSelect
                label="Region"
                name="region_id"
                value={form.region_id}
                onChange={handleUbicacionChange}
                disabled={!form.pais_id}
                placeholder={form.pais_id ? "Seleccione region" : "Seleccione pais primero"}
                options={regiones.map((region) => ({
                  value: String(region.id),
                  label: region.nombre,
                }))}
              />

              <CampoSelect
                label="Ciudad"
                name="ciudad_id"
                value={form.ciudad_id}
                onChange={handleUbicacionChange}
                disabled={!form.region_id}
                placeholder={form.region_id ? "Seleccione ciudad" : "Seleccione region primero"}
                options={ciudades.map((ciudad) => ({
                  value: String(ciudad.id),
                  label: ciudad.nombre,
                }))}
              />

              <CampoInput
                label="Direccion"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
              />

              <CampoInput
                label="Indicativo"
                name="indicativo"
                value={form.indicativo}
                onChange={handleChange}
              />

              <CampoInput
                label="Celular"
                name="celular"
                value={form.celular}
                onChange={handleChange}
              />

              <CampoInput
                label="Telefono fijo"
                name="telefono_fijo"
                value={form.telefono_fijo}
                onChange={handleChange}
              />

              <CampoSelect
                label="Genero"
                name="genero"
                value={form.genero}
                onChange={handleChange}
                options={[
                  { value: "masculino", label: "Masculino" },
                  { value: "femenino", label: "Femenino" },
                  { value: "otro", label: "Otro" },
                ]}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 border-t border-gray-200 bg-white/95 px-7 py-5">
          {!editando ? (
            <>
              <button
                onClick={onClose}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                Cerrar
              </button>

              <button
                onClick={() => setEditando(true)}
                className="rounded-xl bg-gradient-to-r from-[#5a0c0c] to-[#7a1111] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-950/25 transition hover:scale-[1.02]"
              >
                Editar informacion
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditando(false)}
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
              >
                Cancelar edicion
              </button>

              <button
                onClick={handleGuardarCambios}
                className="rounded-xl bg-gradient-to-r from-[#5a0c0c] to-[#7a1111] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-950/25 transition hover:scale-[1.02]"
              >
                Guardar cambios
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-gray-700">
        {value || "No registrado"}
      </p>
    </div>
  );
}

function CampoInput({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
      />
    </div>
  );
}

function CampoSelect({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Seleccione",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
      >
        <option value="">{placeholder}</option>

        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}
