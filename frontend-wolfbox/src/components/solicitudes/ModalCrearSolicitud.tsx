import { useState, useEffect } from "react";
import axios from "axios";

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

  /* =======================================================
     ESTADOS
  ======================================================= */
  const [formValues, setFormValues] = useState(
    paquetesSeleccionados.map((p) => ({
      ...p,
      asegurado: p.asegurado || 100.0,
    }))
  );

  const [destinatario, setDestinatario] = useState("");
  const [medioPago, setMedioPago] = useState("EFECTIVO");
  const [observaciones, setObservaciones] = useState("");

  const [trmActual, setTrmActual] = useState<number>(0);

  // Servicio dinámico
  const [servicio, setServicio] = useState<any>(null);
  const [cargandoServicio, setCargandoServicio] = useState(true);

  const servicioId = paquetesSeleccionados[0]?.servicio_id;


  /* =======================================================
     CARGAR TRM
  ======================================================= */
  useEffect(() => {
    const cargarTRM = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/trm/actual");
        if (data?.valor) {
          setTrmActual(Number(data.valor));
        }
      } catch (e) {
        console.log("Error cargando TRM", e);
      }
    };

    cargarTRM();
  }, []);


  /* =======================================================
     CARGAR DATOS DEL SERVICIO
  ======================================================= */
  useEffect(() => {
    const cargarServicio = async () => {
      try {
        const { data } = await axios.get(`http://localhost:3000/api/servicios/${servicioId}`);

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


  /* =======================================================
     MOSTRAR MENSAJE SI ESTÁ CARGANDO SERVICIO
  ======================================================= */
  if (cargandoServicio) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        <div className="bg-white px-6 py-4 rounded-xl shadow-lg font-semibold">
          Cargando tarifas del servicio...
        </div>
      </div>
    );
  }

  /* =======================================================
     VARIABLES DE CÁLCULO (Tomadas del servicio real)
  ======================================================= */
  const tarifa1lb = Number(servicio?.tarifa_fija_1lb || 0);
  const tarifa2a5 = Number(servicio?.tarifa_fija_2a5 || 0);
  const tarifa6a10 = Number(servicio?.tarifa_fija_6a10 || 0);
  const tarifaExtra = Number(servicio?.tarifa_por_libra_extra || 0);
  const porcentajeSeguro = Number(servicio?.porcentaje_seguro || 0);

  // Sumatorias
  const totalPeso = formValues.reduce((acc, p) => acc + Number(p.peso), 0);
  const totalValorAsegurado = formValues.reduce(
    (acc, p) => acc + Number(p.asegurado),
    0
  );

  /* =======================================================
     FLETE DINÁMICO SEGÚN TARIFA CONFIGURADA
  ======================================================= */
  let fleteUSD = 0;

  // ⭐ Si es servicio CC-Casilleros
  if (servicio?.codigo === "CC") {
    const libraUSD = Number(servicio.tarifa_por_libra_cc || 0);

    // mínimo facturable 10 lbs
    const peso_facturable = totalPeso < 10 ? 10 : totalPeso;

    fleteUSD = peso_facturable * libraUSD;
  }
  // ⭐ Otro servicio (US-CO)
  else {
    if (totalPeso <= 1) {
      fleteUSD = tarifa1lb;
    } else if (totalPeso <= 5) {
      fleteUSD = tarifa2a5;
    } else if (totalPeso <= 10) {
      fleteUSD = tarifa6a10;
    } else {
      fleteUSD = tarifa6a10 + (totalPeso - 10) * tarifaExtra;
    }
  }


  /* =======================================================
     SEGURO Y TOTALES
  ======================================================= */
  const seguroUSD = totalValorAsegurado * (porcentajeSeguro / 100);
  const totalUSD = fleteUSD + seguroUSD;
  const totalCOP = trmActual > 0 ? totalUSD * trmActual : 0;


  /* =======================================================
     MANEJAR CAMBIO DE ASEGURADO
  ======================================================= */
  const handleChangeValor = (index: number, value: string) => {
    const nuevosValores = [...formValues];
    nuevosValores[index].asegurado = value;
    setFormValues(nuevosValores);
  };


  /* =======================================================
     ENVIAR FORMULARIO
  ======================================================= */
  const handleSubmit = () => {
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


  /* =======================================================
     UI DEL MODAL (NO TOCADO)
  ======================================================= */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-[95%] md:w-[80%] lg:w-[65%] max-h-[90vh] overflow-y-auto p-8 transform transition-all duration-300 scale-100 hover:scale-[1.01]">

        <div className="border-b pb-4 mb-5">
          <h2 className="text-2xl font-extrabold text-[#5a0c0c] tracking-wide">
            Crear Solicitud de Despacho
          </h2>

          {servicio && (
            <p className="text-sm text-gray-600">
              Servicio aplicado: <b>{servicio.nombre}</b> — {servicio.tipo}
            </p>
          )}

          <p className="text-sm text-gray-500 mt-1">
            Diligencie el valor asegurado y la información complementaria.
          </p>
        </div>

        {/* TABLA DE PAQUETES */}
        <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="p-3 text-left">Vl. Asegurado</th>
                <th className="p-3 text-left">Tracking</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-left">Peso (lb)</th>
                <th className="p-3 text-left">Contenido</th>
                <th className="p-3 text-left">Tienda</th>
                <th className="p-3 text-left">HAWB</th>
              </tr>
            </thead>

            <tbody>
              {formValues.map((p, index) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <input
                      type="number"
                      value={p.asegurado}
                      onChange={(e) => handleChangeValor(index, e.target.value)}
                      className="w-24 text-center border rounded-md p-1 focus:ring-2 focus:ring-[#5a0c0c]/40 focus:outline-none"
                    />
                  </td>
                  <td className="p-3">{p.tracking}</td>
                  <td className="p-3">{p.estado_actual}</td>
                  <td className="p-3">{p.peso}</td>
                  <td className="p-3">{p.contenido}</td>
                  <td className="p-3">{p.tienda}</td>
                  <td className="p-3">{p.hawb}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm shadow-sm">
          <div>📦 Paquetes: <b className="text-[#5a0c0c]">{formValues.length}</b></div>
          <div>⚖️ Peso Total: <b className="text-[#5a0c0c]">{totalPeso} lb</b></div>
          <div>🛡️ Seguro Total: <b className="text-[#5a0c0c]">{totalValorAsegurado}</b></div>

          <div className="font-semibold col-span-full border-t pt-3 text-gray-700">Cálculo final</div>

          <div>Flete USD: <b>${fleteUSD.toFixed(2)}</b></div>
          <div>Seguro USD: <b>${seguroUSD.toFixed(2)}</b></div>
          <div>Total USD: <b className="text-[#5a0c0c]">${totalUSD.toFixed(2)}</b></div>
          <div>Total COP: <b className="text-[#5a0c0c]">{totalCOP.toLocaleString("es-CO",{style:"currency",currency:"COP"})}</b></div>
        </div>


        {/* TRM INFO */}
        <div className="flex justify-center mb-6">
          <div className="bg-yellow-50 border border-yellow-300 px-4 py-2 rounded-lg text-sm font-semibold text-yellow-900 shadow-sm">
            TRM aplicada hoy: <span className="text-[#5a0c0c]">{trmActual.toLocaleString("es-CO")}</span>
          </div>
        </div>


        {/* FORMULARIO DESTINATARIO / PAGO / OBS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Destinatario
            </label>

            <select
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              className="w-full border p-2 rounded-md bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-[#5a0c0c]/40 focus:outline-none"
            >
              <option value="">Seleccione un destinatario...</option>

              {destinatariosCliente?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — {d.pais}, {d.ciudad}
                </option>
              ))}
            </select>

          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Medio de Pago
            </label>
            <select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
              className="w-full border p-2 rounded-md focus:ring-2 focus:ring-[#5a0c0c]/40 focus:outline-none"
            >
              <option>TRANSFERENCIA</option>
              <option>PSE (PAGO EN LÍNEA)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full border p-2 rounded-md focus:ring-2 focus:ring-[#5a0c0c]/40 focus:outline-none"
              rows={3}
              placeholder="Comentarios u observaciones adicionales..."
            ></textarea>
          </div>
        </div>


        {/* BOTONES */}
        <div className="flex justify-end gap-4 border-t pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-md bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-md bg-[#5a0c0c] text-white font-bold shadow-md hover:bg-[#3d0808] transition"
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
}
