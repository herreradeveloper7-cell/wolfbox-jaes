import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ModalEditarSolicitud({
  solicitud,
  onClose,
  onUpdated,
}: any) {
  const [detalle, setDetalle] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [catalogoCargos, setCatalogoCargos] = useState<any[]>([]);
  const [trm, setTrm] = useState<number>(0);
  const [eliminando, setEliminando] = useState<number | null>(null);
  const [destinatarios, setDestinatarios] = useState<any[]>([]);
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] = useState<number | null>(null);


  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data } = await axios.get(
        `/api/solicitudes/detalle/${solicitud.id}`
      );

      setDetalle(data.paquetes || []);
      setCargos(data.cargos || []);

      setDestinatarioSeleccionado(data.solicitud?.destinatario ?? null);

      const codigoCasillero =
        solicitud.codigoCasillero || solicitud.codigo || solicitud.codigo_casillero;

      if (!codigoCasillero) {
        Swal.fire("Error", "No se encontró el código de casillero del cliente.", "error");
        return;
      }

      const dest = await axios.get(
        `/api/destinatarios/por-cliente/${codigoCasillero}`
      );

      const lista = Array.isArray(dest.data.destinatarios)
        ? dest.data.destinatarios
        : [];

      setDestinatarios(lista);

      if (lista.length === 1) {
        setDestinatarioSeleccionado(lista[0].id);
      }

      const catalogo = await axios.get(
        "/api/solicitudes/catalogo/cargos"
      );
      setCatalogoCargos(catalogo.data);

      const trmData = await axios.get(`/api/trm/actual`);
      setTrm(Number(trmData.data.valor));
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo obtener la información.", "error");
    }
  };

  const editarCampoPaquete = (index: number, campo: string, valor: any) => {
    const updated = [...detalle];
    updated[index][campo] = valor;
    setDetalle(updated);
  };

  const eliminarPaquete = async (paquete: any) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar paquete?",
      text: `Se removerá el tracking ${paquete.tracking} de esta solicitud`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(
        `/api/solicitudes/paquete/remover/${paquete.paquete_id}`
      );

      setDetalle(detalle.filter((p) => p.paquete_id !== paquete.paquete_id));

      Swal.fire("Eliminado", "Paquete removido", "success");
    } catch {
      Swal.fire("Error", "No se pudo eliminar el paquete", "error");
    }
  };

  const agregarCargo = () => {
    setCargos((prev) => [
      ...prev,
      { id: null, tipo_cargo: "", valor_usd: 0, valor_cop: 0 },
    ]);
  };

  const eliminarCargo = (index: number) => {
    const cargo = cargos[index];

    setEliminando(cargo.id || index);

    setTimeout(() => {
      setCargos((prev) => prev.filter((_, i) => i !== index));
      setEliminando(null);
    }, 300); 
  };


  const editarCargo = (index: number, campo: string, valor: any) => {
    const updated = [...cargos];
    updated[index][campo] = valor;
    setCargos(updated);
  };

  const esHawbPadre = (p: any) => {
    return (
      p.es_padre === true ||
      p.es_padre === 1 ||
      p.es_padre === "1" ||
      String(p.hawb || "").toUpperCase().endsWith("G")
    );
  };

  const hawbPadre = detalle.find((p: any) => esHawbPadre(p));
  const hawbHijos = detalle.filter((p: any) => !esHawbPadre(p));
  const paquetesParaMostrar = hawbPadre ? hawbHijos : detalle;

  const guardarCambios = async () => {
    if (!destinatarioSeleccionado) {
      Swal.fire("Atención", "Debe seleccionar un destinatario.", "warning");
      return;
    }

    try {
      await axios.put(
        `/api/solicitudes/editar/${solicitud.id}`,
        {
          paquetes: detalle,
          cargos,
          // ✅ este nombre debe coincidir con backend
          destinatario: destinatarioSeleccionado,
        }
      );

      Swal.fire("Actualizado", "Solicitud actualizada correctamente", "success");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-950/65 backdrop-blur-xl animate-fade-in flex items-center justify-center z-50 px-3 py-5">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[1.75rem] border border-white/20 bg-white/95 shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur-md animate-scale-in">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-950 via-red-700 to-gray-400" />

        <header className="relative overflow-hidden border-b border-gray-200/50 bg-gradient-to-br from-white via-red-50/30 to-white px-6 py-8 pb-20">
          <div className="absolute bottom-0 right-0 h-32 w-80 rounded-tl-full bg-red-950/5 pointer-events-none" />
          <div className="absolute right-12 top-0 h-px w-96 bg-gradient-to-r from-transparent via-red-900/20 to-transparent" />
          
          <div className="relative">
            <span className="inline-block rounded-full border border-red-900/20 bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-950 mb-3">
              Editar solicitud
            </span>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-700">
              Solicitud #{solicitud.id}
            </h2>
          </div>
        </header>

        <div className="overflow-y-auto flex-1 px-6 py-8 space-y-8">

        {hawbPadre && (
          <section className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-gradient-to-br from-red-950 via-red-900 to-[#3b0505] text-white shadow-[0_24px_60px_rgba(69,10,10,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10 pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full border border-white/5 pointer-events-none" />

            <div className="relative p-6 md:p-8">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200/70">
                    Agrupación principal
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight">HAWB Padre</h3>
                </div>
                <p className="font-mono text-sm font-bold text-red-100/80 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                  {hawbPadre.hawb}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                {[
                  { label: "HAWB", value: hawbPadre.hawb },
                  { label: "Tracking", value: hawbPadre.tracking },
                  { label: "Peso", value: `${hawbPadre.peso} lb` },
                  { label: "Seguro (10%)", value: `$${(Number(hawbPadre.asegurado) * 0.1).toFixed(2)}` },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 hover:bg-white/15 transition-all duration-300 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-100/60">
                      {item.label}
                    </p>
                    <p className="mt-2 break-all font-mono  sm:text-sm  font-semibold relative z-10">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {hawbPadre.contenido && (
                <div className="mt-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-100/60">
                    Contenido
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/95">
                    {hawbPadre.contenido}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
                Paquetes
              </p>
              <h3 className="text-lg font-semibold text-gray-700">
                {hawbPadre ? "Desglose de agrupación" : "Incluidos en la solicitud"}
              </h3>
            </div>
            <span className="text-xs font-bold text-red-950 bg-red-50 px-3 py-1 rounded-full">
              {paquetesParaMostrar.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                <tr className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                  <th className="px-4 py-3 text-left font-black">HAWB</th>
                  <th className="px-4 py-3 text-left font-black">Tracking</th>
                  <th className="px-4 py-3 text-center font-black">Peso</th>
                  <th className="px-4 py-3 text-center font-black">Valor asegurado</th>
                  <th className="px-4 py-3 text-center font-black">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paquetesParaMostrar.map((p) => (
                  <tr
                    key={p.paquete_id}
                    className="bg-white transition-all duration-200 hover:bg-red-50/60 group"
                  >
                    <td className="px-4 py-3">
                      <input
                        className="border-0 bg-transparent font-mono font-semibold text-red-950 outline-none"
                        value={p.hawb}
                        disabled
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="border-0 bg-transparent font-mono text-gray-700 outline-none"
                        value={p.tracking}
                        disabled
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        className="border-0 bg-transparent text-center font-semibold text-gray-700 outline-none"
                        value={Number(p.peso || 0).toLocaleString("es-CO", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        disabled
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        className="border border-gray-200 bg-white/60 rounded-lg px-3 py-2 text-center font-semibold text-gray-900 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition"
                        value={p.asegurado ?? ""}
                        onChange={(e) => {
                          const valor = e.target.value;
                          if (!/^\d*\.?\d*$/.test(valor) && valor !== "") return;
                          editarCampoPaquete(detalle.indexOf(p), "asegurado", valor);
                        }}
                        onBlur={() => {
                          const valorActual = p.asegurado;
                          if (valorActual === "" || valorActual === null || valorActual === undefined) return;
                          const numero = Number(valorActual);
                          if (isNaN(numero)) return;
                          editarCampoPaquete(detalle.indexOf(p), "asegurado", numero.toFixed(2));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => eliminarPaquete(p)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-red-50/0 text-red-700 hover:bg-red-100/60 transition-all duration-200 font-bold text-lg group-hover:bg-red-100"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


        <section className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-2">
              Destinatario
            </p>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Selecciona el destinatario de la solicitud
            </label>

            <select
              className="border border-gray-200 bg-white/70 backdrop-blur-sm rounded-xl w-full px-4 py-3 font-semibold text-gray-900 focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition"
              value={destinatarioSeleccionado || ""}
              onChange={(e) => setDestinatarioSeleccionado(Number(e.target.value))}
            >
              <option value="">Seleccione un destinatario</option>
              {destinatarios.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} — {d.ciudad}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-red-900/20 bg-gradient-to-br from-red-950 via-red-900 to-[#3b0505] p-6 text-white shadow-[0_24px_60px_rgba(69,10,10,0.22)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full border border-white/10 pointer-events-none" />

          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-2xl font-semibold backdrop-blur-md">
              $
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-100">
                Tasa representativa del mercado
              </p>
              <p className="text-3xl font-semibold mt-1 tracking-tight">
                {trm.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                <span className="text-lg font-semibold ml-2 text-red-100">COP/USD</span>
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
                Finanzas
              </p>
              <h3 className="text-lg font-semibold text-gray-700">
                Cargos adicionales
              </h3>
            </div>
            <button
              onClick={agregarCargo}
              className="px-4 py-2 bg-gradient-to-r from-red-900 to-red-950 hover:from-red-950 hover:to-red-900 cursor-pointer text-white text-sm font-bold rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              + Agregar Cargo
            </button>
          </div>

          <div className="space-y-3">
            {cargos.map((c, index) => (
              <div
                key={c.id || index}
                className={`
                  grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border border-gray-200/60 rounded-xl bg-white/60 backdrop-blur-sm
                  transition-all duration-300
                  ${eliminando === (c.id || index) ? "opacity-0 scale-95" : "opacity-100 scale-100"}
                  hover:border-gray-300 hover:shadow-md
                `}
              >
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Tipo de cargo
                  </label>
                  <select
                    className="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition w-full h-10"
                    value={c.tipo_cargo}
                    onChange={(e) => editarCargo(index, "tipo_cargo", e.target.value)}
                  >
                    <option value="">Seleccione tipo</option>
                    {catalogoCargos.map((op) => (
                      <option key={op.id} value={op.nombre_cargo}>
                        {op.nombre_cargo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    USD
                  </label>
                  <input
                    type="text"
                    className="border border-gray-200 bg-white rounded-lg px-3 py-2 w-full h-10 font-mono font-semibold text-gray-900 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                    placeholder="0.00"
                    value={c.valor_usd === null ? "" : c.valor_usd}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (text === "") {
                        editarCargo(index, "valor_usd", "");
                        editarCargo(index, "valor_cop", "");
                        return;
                      }
                      if (!/^-?\d*\.?\d*$/.test(text)) return;
                      const usd = Number(text);
                      editarCargo(index, "valor_usd", text);
                      editarCargo(index, "valor_cop", usd * trm);
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    COP
                  </label>
                  <input
                    type="text"
                    className="border border-gray-200 bg-gray-50/60 rounded-lg px-3 py-2 w-full h-10 font-mono font-semibold text-gray-700 outline-none"
                    disabled
                    value={c.valor_cop}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Acción
                  </label>
                  <button
                    onClick={() => eliminarCargo(index)}
                    className="inline-flex items-center justify-center h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xl transition-all duration-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>

        <footer className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white/80 px-6 py-4">
          <p className="text-xs font-semibold text-gray-500">
            Los cambios se guardarán en la solicitud actual.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Cerrar
            </button>

            <button
              onClick={guardarCambios}
              className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Guardar Cambios
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
