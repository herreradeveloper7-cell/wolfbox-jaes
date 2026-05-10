import { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import Swal from "sweetalert2";

interface Props {
  cliente: any;
  onClose: () => void;
}

export default function ModalCliente({ cliente, onClose }: Props) {
    const [editando, setEditando] = useState(false);

    const [form, setForm] = useState({
        correo: cliente?.correo || "",
        tipo_cliente: cliente?.tipo_cliente || "",
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

  if (!cliente) return null;

    const nombreCompleto =
    cliente.tipo_cliente === "empresarial"
      ? cliente.nombre_empresa
      : `${cliente.primer_nombre || ""} ${cliente.segundo_nombre || ""} ${cliente.primer_apellido || ""} ${cliente.segundo_apellido || ""}`.trim();

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleGuardarCambios = async () => {
        try {
            await axios.put(
            `/api/clientes/${cliente.id}`,
            form
            );

            await Swal.fire({
            icon: "success",
            title: "Cliente actualizado",
            text: "La información del cliente fue actualizada correctamente.",
            confirmButtonColor: "#5a0c0c",
            });

            setEditando(false);
            onClose();
        } catch (error) {
            console.error("❌ Error actualizando cliente:", error);

            Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo actualizar la información del cliente.",
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
                {editando ? "Edición de cliente" : "Información del cliente"}
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
                ×
            </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50 px-7 py-6">
            {!editando ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Info label="Tipo cliente" value={cliente.tipo_cliente} />
                <Info label="Identificación" value={`${cliente.tipo_identificacion || ""} ${cliente.numero_identificacion || ""}`} />
                <Info label="Correo" value={cliente.correo} />
                <Info label="País" value={cliente.pais} />
                <Info label="Región" value={cliente.region} />
                <Info label="Ciudad" value={cliente.ciudad} />
                <Info label="Dirección" value={cliente.direccion} />
                <Info label="Celular" value={`${cliente.indicativo || ""} ${cliente.celular || ""}`} />
                <Info label="Teléfono fijo" value={cliente.telefono_fijo} />
                <Info label="Género" value={cliente.genero} />
                <Info label="Fecha nacimiento" value={cliente.fecha_nacimiento?.slice?.(0, 10)} />
                <Info label="Fecha creación" value={cliente.fecha_creacion?.slice?.(0, 10)} />
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

                    {form.tipo_cliente === "empresarial" && (
                        <>
                            <CampoInput
                            label="Razón social"
                            name="nombre_empresa"
                            value={form.nombre_empresa}
                            onChange={handleChange}
                            />

                            <CampoSelect
                            label="Tipo de identificación"
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
                            label="Número de identificación"
                            name="numero_identificacion"
                            value={form.numero_identificacion}
                            onChange={handleChange}
                            />
                        </>
                    )}

                    <CampoInput
                        label="País"
                        name="pais"
                        value={form.pais}
                        onChange={handleChange}
                    />

                    <CampoInput
                        label="Región"
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                    />

                    <CampoInput
                        label="Ciudad"
                        name="ciudad"
                        value={form.ciudad}
                        onChange={handleChange}
                    />

                    <CampoInput
                        label="Dirección"
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
                        label="Teléfono fijo"
                        name="telefono_fijo"
                        value={form.telefono_fijo}
                        onChange={handleChange}
                    />

                    <CampoSelect
                        label="Género"
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
                    Editar información
                </button>
                </>
            ) : (
                <>
                <button
                    onClick={() => setEditando(false)}
                    className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
                >
                    Cancelar edición
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
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
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
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
      >
        <option value="">Seleccione</option>

        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}