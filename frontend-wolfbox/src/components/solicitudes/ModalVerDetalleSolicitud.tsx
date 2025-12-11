import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ModalVerDetalleSolicitud({
  solicitud,
  onClose,
}: {
  solicitud: any;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<any>({
    solicitud: null,
    paquetes: [],
    cargos: [],
  });

  const [cargando, setCargando] = useState(true);
  const [trmActual, setTrmActual] = useState<number>(0);

  const [servicio, setServicio] = useState<any>(null);
  const [loadingServicio, setLoadingServicio] = useState(true);


  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:3000/api/solicitudes/detalle/${solicitud.id}`
        );

        setDetalle({
          solicitud: data.solicitud,
          paquetes: data.paquetes || [],
          cargos: data.cargos || [],
        });
      } catch (error) {
        Swal.fire("Error", "No se pudo obtener el detalle", "error");
      } finally {
        setCargando(false);
      }
    };

    cargar();

    const cargarTRM = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:3000/api/trm/actual"
        );
        if (data?.valor) setTrmActual(Number(data.valor));
      } catch {}
    };

    cargarTRM();
  }, [solicitud.id]);

  /* =======================================================
      2. CARGAR SERVICIO REAL (servicio_id)
  ======================================================= */
  useEffect(() => {
    if (!detalle.solicitud?.servicio_id) return;

    const cargarServicio = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:3000/api/servicios/${detalle.solicitud.servicio_id}`
        );

        if (data.ok) {
          setServicio(data.servicio);
        }
      } catch (err) {
        console.error("❌ Error cargando servicio:", err);
      } finally {
        setLoadingServicio(false);
      }
    };

    cargarServicio();
  }, [detalle.solicitud?.servicio_id]);

  /* =======================================================
      3. MOSTRAR MENSAJE MIENTRAS CARGA SERVICIO
  ======================================================= */
  if (loadingServicio || cargando) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg font-semibold text-gray-700">
          Cargando información...
        </div>
      </div>
    );
  }

  if (!servicio) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg font-semibold text-red-600">
          Error: No se encontró el servicio asociado
        </div>
      </div>
    );
  }

  /* =======================================================
      4. CÁLCULOS DINÁMICOS CON SERVICIO REAL
  ======================================================= */

  const totalPeso = detalle.paquetes.reduce(
    (acc: number, p: any) => acc + Number(p.peso),
    0
  );

  const totalValorAsegurado = detalle.paquetes.reduce(
    (acc: number, p: any) => acc + Number(p.asegurado || 0),
    0
  );

  // Tarifas desde BD
  const tarifa1 = Number(servicio.tarifa_fija_1lb || 0);
  const tarifa2 = Number(servicio.tarifa_fija_2a5 || 0);
  const tarifa3 = Number(servicio.tarifa_fija_6a10 || 0);
  const tarifaExtra = Number(servicio.tarifa_por_libra_extra || 0);
  const tarifaCC = Number(servicio.tarifa_por_libra_cc || 0);
  const porcentajeSeguro = Number(servicio.porcentaje_seguro || 0) / 100;

  let fleteUSD = 0;

  if (servicio.codigo === "CC") {
    // CC-Casilleros
    const pesoFacturable = totalPeso < 10 ? 10 : totalPeso;
    fleteUSD = pesoFacturable * tarifaCC;
  } else {
    // US-CO
    if (totalPeso <= 1) fleteUSD = tarifa1;
    else if (totalPeso <= 5) fleteUSD = tarifa2;
    else if (totalPeso <= 10) fleteUSD = tarifa3;
    else fleteUSD = totalPeso * tarifaExtra;
  }

  const seguroUSD = totalValorAsegurado * porcentajeSeguro;

  const totalCargosUSD = detalle.cargos.reduce(
    (acc: number, c: any) => acc + Number(c.valor_usd || 0),
    0
  );

  const totalUSD = fleteUSD + seguroUSD + totalCargosUSD;

  const totalCOP = trmActual ? totalUSD * trmActual : 0;

  /* =======================================================
      5. UI DEL MODAL (INTACTA)
  ======================================================= */
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white w-[92%] md:w-[800px] rounded-2xl shadow-2xl p-6">

        <h2 className="text-2xl font-bold text-red-900 mb-4">
          Detalle Solicitud #{solicitud.id}
        </h2>

        {/* INFO GENERAL */}
        <div className="bg-gray-50 border p-3 rounded-lg mb-5 text-sm">
          <p>
            Destinatario: <b>{solicitud.destinatario_nombre}</b>
          </p>
          <p>
            Medio de pago: <b>{solicitud.medio_pago}</b>
          </p>
          <p>
            Observaciones: <b>{solicitud.observaciones || "—"}</b>
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Servicio aplicado: <b>{servicio.nombre}</b> — {servicio.tipo}
          </p>
        </div>

        {/* TABLA PAQUETES */}
        <table className="w-full text-sm border border-gray-200 mb-5">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">HAWB</th>
              <th className="p-2 text-left">Tracking</th>
              <th className="p-2 text-center">Peso (lb)</th>
              <th className="p-2 text-center">Asegurado</th>
              <th className="p-2 text-left">Contenido</th>
            </tr>
          </thead>
          <tbody>
            {detalle.paquetes.map((p: any, idx: number) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-2">{p.hawb}</td>
                <td className="p-2">{p.tracking}</td>
                <td className="p-2 text-center">{p.peso}</td>
                <td className="p-2 text-center">{p.asegurado}</td>
                <td className="p-2">{p.contenido}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TABLA CARGOS ADICIONALES */}
        <h3 className="text-lg font-bold text-red-900 mb-2">Cargos Adicionales</h3>

        {detalle.cargos.length === 0 ? (
          <p className="text-sm text-gray-500 italic mb-4">
            No hay cargos adicionales registrados.
          </p>
        ) : (
          <table className="w-full text-sm border border-gray-200 mb-5">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Tipo de Cargo</th>
                <th className="p-2 text-center">Valor USD</th>
                <th className="p-2 text-center">Valor COP</th>
              </tr>
            </thead>
            <tbody>
              {detalle.cargos.map((c: any) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{c.tipo_cargo}</td>
                  <td className="p-2 text-center">${c.valor_usd}</td>
                  <td className="p-2 text-center">
                    {Number(c.valor_cop).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* RESUMEN FINAL */}
        <div className="bg-gray-50 border rounded-xl p-4 text-sm space-y-1">
          <div>📦 Paquetes: <b>{detalle.paquetes.length}</b></div>
          <div>⚖️ Peso Total: <b>{totalPeso} lb</b></div>
          <div>🛡️ Seguro Total: <b>{totalValorAsegurado}</b></div>
          <div>➕ Cargos adicionales: <b>${totalCargosUSD.toFixed(2)}</b></div>

          <hr className="my-2" />

          <div>Flete USD: <b>${fleteUSD.toFixed(2)}</b></div>
          <div>Seguro USD: <b>${seguroUSD.toFixed(2)}</b></div>
          <div>Total USD: <b className="text-[#5a0c0c]">${totalUSD.toFixed(2)}</b></div>

          <div>
            Total COP:
            <b className="text-[#5a0c0c]">
              {totalCOP.toLocaleString("es-CO", {
                style: "currency",
                currency: "COP",
              })}
            </b>
          </div>

          <div className="text-center mt-2 text-xs text-gray-500">
            TRM usada: {trmActual.toLocaleString("es-CO")}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-red-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-red-950 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
