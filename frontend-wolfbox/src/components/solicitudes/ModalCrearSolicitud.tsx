import { useState, useEffect } from "react";
import axios from "axios";
import { createPortal } from "react-dom";

interface Props {
  paquetesSeleccionados: any[];
  destinatariosCliente: any[];
  onClose: () => void;
  onConfirm: (formData: any) => void;
}

export default function ModalCrearSolicitud({
  paquetesSeleccionados,
  destinatariosCliente,
  onClose,
  onConfirm,
}: Props) {

  const [formValues, setFormValues] = useState(
    paquetesSeleccionados.map((p) => ({
      ...p,
      asegurado: p.asegurado || 100.0,
    }))
  );

  const [destinatario, setDestinatario] = useState<number | null>(null);
  const [medioPago, setMedioPago] = useState("EFECTIVO");
  const [observaciones, setObservaciones] = useState("");

  const [trmActual, setTrmActual] = useState<number>(0);

  const [servicio, setServicio] = useState<any>(null);
  const [cargandoServicio, setCargandoServicio] = useState(true);

  const [errorDestinatario, setErrorDestinatario] = useState(false);


  const servicioId = paquetesSeleccionados[0]?.servicio_id;



  useEffect(() => {
    const cargarTRM = async () => {
      try {
        const { data } = await axios.get("/api/trm/actual");
        if (data?.valor) {
          setTrmActual(Number(data.valor));
        }
      } catch (e) {
        console.log("Error cargando TRM", e);
      }
    };

    cargarTRM();
  }, []);



  useEffect(() => {
    const cargarServicio = async () => {
      try {
        const { data } = await axios.get(`/api/servicios/${servicioId}`);

        if (data.ok) {
          setServicio(data.servicio);
        }
      } catch (err) {
        console.error("❌ Error cargando servicio:", err);
      } finally {
        setCargandoServicio(false);
      }
    };

    cargarServicio();
  }, []);

  useEffect(() => {
    if (!destinatariosCliente || destinatariosCliente.length === 0) return;

    const activos = destinatariosCliente.filter(d => d.activo === 1);
    if (activos.length === 0) return;

    const defaultDest = activos.find(d => d.es_default === 1);
    const seleccionado = defaultDest ? defaultDest.id : activos[0].id;

    setDestinatario(prev => prev ?? seleccionado);

  }, [destinatariosCliente]);



  if (cargandoServicio) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-semibold">
          Cargando tarifas del servicio...
        </div>
      </div>
    );
  }

  const porcentajeSeguro = Number(servicio?.porcentaje_seguro || 0);

  const totalPeso = formValues.reduce((acc, p) => acc + Number(p.peso), 0);
  const totalValorAsegurado = formValues.reduce(
    (acc, p) => acc + Number(p.asegurado),
    0
  );

  const calcularFleteServicio = (servicio: any, pesoTotal: number) => {
  const aplicaPesoMaximo = Boolean(servicio?.aplica_peso_maximo);
  const pesoMaximo = Number(servicio?.peso_maximo || 0);

  if (aplicaPesoMaximo && pesoMaximo > 0 && pesoTotal > pesoMaximo) {
    return {
      ok: false,
      mensaje: `El servicio ${servicio?.nombre} solo permite hasta ${pesoMaximo} lb. Peso actual: ${pesoTotal} lb.`,
      fleteUSD: 0,
    };
  }

  const aplicaMinimo = Boolean(servicio?.aplica_minimo);
  const pesoMinimo = Number(servicio?.peso_minimo || 0);
  const tarifaMinimaUSD = Number(servicio?.tarifa_minima_usd || 0);

  if (
    aplicaMinimo &&
    pesoMinimo > 0 &&
    tarifaMinimaUSD > 0 &&
    pesoTotal <= pesoMinimo
  ) {
    return {
      ok: true,
      mensaje: "",
      fleteUSD: tarifaMinimaUSD,
    };
  }

  const tarifa1 = Number(servicio?.tarifa_fija_1lb || 0);
  const tarifa2a5 = Number(servicio?.tarifa_fija_2a5 || 0);
  const tarifa6a10 = Number(servicio?.tarifa_fija_6a10 || 0);
  const tarifaExtra = Number(servicio?.tarifa_por_libra_extra || 0);
  const tarifaLibra = Number(servicio?.tarifa_por_libra_cc || 0);

  const tieneRangos =
      tarifa1 > 0 || tarifa2a5 > 0 || tarifa6a10 > 0 || tarifaExtra > 0;

    if (tieneRangos) {
      if (pesoTotal <= 1) return { ok: true, mensaje: "", fleteUSD: tarifa1 };
      if (pesoTotal <= 5) return { ok: true, mensaje: "", fleteUSD: tarifa2a5 };
      if (pesoTotal <= 10) return { ok: true, mensaje: "", fleteUSD: tarifa6a10 };

      return {
        ok: true,
        mensaje: "",
        fleteUSD: tarifa6a10 + (pesoTotal - 10) * tarifaExtra,
      };
    }

    if (tarifaLibra > 0) {
      const pesoFacturable = pesoTotal < 10 ? 10 : pesoTotal;

      return {
        ok: true,
        mensaje: "",
        fleteUSD: pesoFacturable * tarifaLibra,
      };
    }

    return {
      ok: false,
      mensaje: `El servicio ${servicio?.nombre} no tiene una tarifa válida configurada.`,
      fleteUSD: 0,
    };
  };

  const calculoFlete = calcularFleteServicio(servicio, totalPeso);
  const fleteUSD = calculoFlete.fleteUSD;

  const seguroUSD = totalValorAsegurado * (porcentajeSeguro / 100);
  const totalUSD = fleteUSD + seguroUSD;
  const totalCOP = trmActual > 0 ? totalUSD * trmActual : 0;



  const handleChangeValor = (index: number, value: string) => {
    const nuevosValores = [...formValues];
    nuevosValores[index].asegurado = value;
    setFormValues(nuevosValores);
  };



  const handleSubmit = () => {
    if (!destinatario) {
      setErrorDestinatario(true);
      return;
    }

    if (!calculoFlete.ok) {
      alert(calculoFlete.mensaje);
      return;
    }

    setErrorDestinatario(false);

    const formData = {
      paquetes: formValues,
      destinatario,
      medioPago,
      observaciones,
      totalPeso,
      totalValorAsegurado,
      fleteUSD,
      seguroUSD,
      totalUSD,
      totalCOP,
    };

    onConfirm(formData);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.35)]">

        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#5a0c0c] via-[#b98b8b] to-[#5a0c0c]" />

        <div className="flex items-center justify-between bg-gradient-to-r from-[#5a0c0c] via-[#6f1010] to-[#3d0808] px-7 py-5 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-white/60">
              Solicitud de despacho
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-wide">
              Crear Solicitud de Despacho
            </h2>

            {servicio && (
              <p className="mt-1 text-sm text-white/80">
                Servicio aplicado: <b>{servicio.nombre}</b> — {servicio.tipo}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl leading-none text-white transition hover:bg-white/20"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-7">
          <p className="mb-6 text-sm font-medium text-gray-500">
            Diligencie el valor asegurado y la información complementaria para generar la solicitud.
          </p>

          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-4 text-left">Vl. Asegurado</th>
                    <th className="px-4 py-4 text-left">Tracking</th>
                    <th className="px-4 py-4 text-left">Estado</th>
                    <th className="px-4 py-4 text-left">Peso</th>
                    <th className="px-4 py-4 text-left">Contenido</th>
                    <th className="px-4 py-4 text-left">Tienda</th>
                    <th className="px-4 py-4 text-left">HAWB</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {formValues.map((p, index) => (
                    <tr key={p.id} className="transition hover:bg-red-50/40">
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={p.asegurado}
                          onChange={(e) => handleChangeValor(index, e.target.value)}
                          className="w-28 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-center font-semibold text-gray-700 outline-none transition focus:border-[#5a0c0c] focus:bg-white focus:ring-4 focus:ring-[#5a0c0c]/10"
                        />
                      </td>

                      <td className="px-4 py-3 font-semibold text-gray-700">{p.tracking}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-600">
                          {p.estado || "Sin estado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.peso} lb</td>
                      <td className="px-4 py-3 text-gray-600">{p.contenido}</td>
                      <td className="px-4 py-3 text-gray-600">{p.tienda}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#5a0c0c]">{p.hawb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Paquetes</p>
              <p className="mt-1 text-2xl font-extrabold text-[#5a0c0c]">{formValues.length}</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Peso total</p>
              <p className="mt-1 text-2xl font-extrabold text-[#5a0c0c]">{totalPeso} lb</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Seguro total</p>
              <p className="mt-1 text-2xl font-extrabold text-[#5a0c0c]">{totalValorAsegurado}</p>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-yellow-700">TRM aplicada</p>
              <p className="mt-1 text-2xl font-extrabold text-[#5a0c0c]">
                {trmActual.toLocaleString("es-CO")}
              </p>
            </div>
          </div>

          <div className="mb-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.25em] text-gray-400">
              Cálculo final
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs font-bold text-gray-400">Flete USD</p>
                <p className="text-lg font-extrabold text-gray-700">${fleteUSD.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400">Seguro USD</p>
                <p className="text-lg font-extrabold text-gray-700">${seguroUSD.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400">Total USD</p>
                <p className="text-lg font-extrabold text-[#5a0c0c]">${totalUSD.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400">Total COP</p>
                <p className="text-lg font-extrabold text-[#5a0c0c]">
                  {totalCOP.toLocaleString("es-CO", {
                    style: "currency",
                    currency: "COP",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Destinatario
              </label>

              <select
                value={destinatario ?? ""}
                onChange={(e) => setDestinatario(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
              >
                <option value="" disabled>
                  Seleccione un destinatario...
                </option>

                {destinatariosCliente.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} — {d.pais}, {d.ciudad}
                  </option>
                ))}
              </select>

              {errorDestinatario && (
                <div className="mt-3 rounded-2xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 shadow-sm animate-fade-in">
                  <p className="font-extrabold">⚠️ Destinatario requerido</p>
                  <p className="mt-1 text-yellow-800">
                    Por favor selecciona un destinatario para poder crear la solicitud de despacho.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Medio de Pago
              </label>

              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
              >
                <option>TRANSFERENCIA</option>
                <option>PSE (PAGO EN LÍNEA)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-700">
                Observaciones
              </label>

              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
                rows={3}
                placeholder="Comentarios u observaciones adicionales..."
              />
            </div>
          </div>

          <div className="sticky bottom-0 -mx-7 -mb-7 flex justify-end gap-4 border-t border-gray-200 bg-white/95 px-7 py-5 backdrop-blur">
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              className="rounded-xl bg-gradient-to-r from-[#5a0c0c] to-[#7a1111] px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-950/25 transition hover:scale-[1.02] hover:from-[#3d0808] hover:to-[#5a0c0c]"
            >
              Aceptar Solicitud
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
