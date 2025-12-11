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
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<any[]>([]);
  const [nuevoPaquete, setNuevoPaquete] = useState<number | null>(null);
  const [catalogoCargos, setCatalogoCargos] = useState<any[]>([]);
  const [trm, setTrm] = useState<number>(0);
  const [eliminando, setEliminando] = useState<number | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

    const cargarDatos = async () => {
        try {
            const { data } = await axios.get(
            `http://localhost:3000/api/solicitudes/detalle/${solicitud.id}`
            );

            setDetalle(data.paquetes || []);
            setCargos(data.cargos || []);

            const libres = await axios.get(
            `http://localhost:3000/api/paquetes/por-cliente/${solicitud.codigoCasillero}`
            );

            setPaquetesDisponibles(
            libres.data.filter((p:any)=>!p.solicitud_id)
            );

            const catalogo = await axios.get("http://localhost:3000/api/solicitudes/catalogo/cargos");
            setCatalogoCargos(catalogo.data);

            const trmData = await axios.get(`http://localhost:3000/api/trm/actual`);
            setTrm(Number(trmData.data.valor));

        } catch (err) {
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
        `http://localhost:3000/api/solicitudes/paquete/remover/${paquete.paquete_id}`
      );

      setDetalle(detalle.filter((p) => p.paquete_id !== paquete.paquete_id));

      Swal.fire("Eliminado", "Paquete removido", "success");
    } catch {
      Swal.fire("Error", "No se pudo eliminar el paquete", "error");
    }
  };

  const agregarPaquete = async () => {
    if (!nuevoPaquete) return;

    try {
      await axios.put(
        `http://localhost:3000/api/solicitudes/paquete/agregar/${solicitud.id}`,
        { paquete_id: nuevoPaquete }
      );

      Swal.fire("Agregado", "Paquete añadido a la solicitud", "success");
      cargarDatos();
      setNuevoPaquete(null);
    } catch (err) {
      Swal.fire("Error", "No se pudo agregar el paquete", "error");
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

  const guardarCambios = async () => {
    try {
      await axios.put(
        `http://localhost:3000/api/solicitudes/editar/${solicitud.id}`,
        {
          paquetes: detalle,
          cargos,
        }
      );

      Swal.fire("Actualizado", "Solicitud actualizada correctamente", "success");
      onUpdated();
      onClose();
    } catch (err) {
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  };


  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in flex items-center justify-center z-50">
      <div className="bg-white w-[92%] md:w-[800px] p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in">

        <h2 className="text-2xl font-bold text-[#5a0c0c] mb-4 tracking-wide">
          Editar Solicitud #{solicitud.id}
        </h2>


        <h3 className="text-lg font-semibold mt-4 mb-3 text-gray-800">
          Paquetes incluidos en la solicitud
        </h3>

        <div className="space-y-3">
          {detalle.map((p, index) => (
            <div
              key={p.paquete_id}
              className="grid grid-cols-5 gap-3 p-3 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 bg-white animate-fade-in"
            >
              <input
                className="border p-2 rounded-lg text-sm bg-gray-50"
                value={p.hawb}
                disabled
              />

              <input
                className="border p-2 rounded-lg text-sm bg-gray-50"
                value={p.tracking}
                disabled
              />

              <input
                type="number"
                className="border p-2 rounded-lg text-sm focus:ring-2 focus:ring-red-300 outline-none transition"
                value={p.peso}
                onChange={(e) => editarCampoPaquete(index, "peso", e.target.value)}
              />

              <input
                type="number"
                className="border p-2 rounded-lg text-sm focus:ring-2 focus:ring-red-300 outline-none transition"
                value={p.asegurado}
                onChange={(e) =>
                  editarCampoPaquete(index, "asegurado", e.target.value)
                }
              />

              <button
                onClick={() => eliminarPaquete(p)}
                className="text-red-700 hover:text-red-900 transition font-bold text-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>


        <div className="mt-6">
          <h4 className="font-semibold text-gray-800">Agregar nuevo paquete</h4>

          <div className="flex gap-3 mt-2">
            <select
              className="border p-2 rounded-lg w-full bg-gray-50 focus:ring-2 focus:ring-red-300"
              value={nuevoPaquete || ""}
              onChange={(e) => setNuevoPaquete(Number(e.target.value))}
            >
              <option value="">Seleccione un paquete libre...</option>
              {paquetesDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.tracking} — {p.peso} lb
                </option>
              ))}
            </select>

            <button
              onClick={agregarPaquete}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl transition shadow-md"
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="mt-6 mb-4 p-4 rounded-xl bg-red-100 border border-red-300 shadow-sm flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-[#5a0c0c] text-white flex items-center justify-center text-lg font-bold shadow-md">
            $
          </div>

          <div>
            <p className="text-sm text-gray-700 font-semibold">
              Tasa representativa del mercado (TRM) aplicada
            </p>

            <p className="text-xl font-bold text-[#5a0c0c] mt-1 tracking-wide">
              {trm.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
              <span className="text-gray-700 text-base font-medium ml-1">COP</span>
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mt-8 mb-2 text-gray-800">
          Cargos adicionales
        </h3>

        <button
          onClick={agregarCargo}
          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition mb-3"
        >
          + Agregar Cargo
        </button>

        <div className="space-y-3">
          {cargos.map((c, index) => (
            <div
              key={c.id || index}
              className={`
                grid grid-cols-4 gap-2 mb-3 p-3 border rounded-lg bg-gray-50
                transition-all duration-300
                ${eliminando === (c.id || index) ? "animate-fade-out" : "animate-slide-up"}
              `}
            >
              <select
                className="border p-2 rounded bg-white"
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

              <input
                type="text"
                className="border p-2 rounded"
                placeholder="USD"
                value={c.valor_usd === null ? "" : c.valor_usd}
                onChange={(e) => {
                  const text = e.target.value;

                  if (text === "") {
                    editarCargo(index, "valor_usd", "");
                    editarCargo(index, "valor_cop", "");
                    return;
                  }

                  if (!/^\d*\.?\d*$/.test(text)) return;

                  const usd = Number(text);
                  editarCargo(index, "valor_usd", text);  
                  editarCargo(index, "valor_cop", usd * trm); 
                }}
              />


              <input
                type="number"
                className="border p-2 rounded bg-gray-100"
                disabled
                value={c.valor_cop}
              />

              <button
                onClick={() => eliminarCargo(index)}
                className="text-red-600 hover:text-red-800 font-bold text-xl transition"
              >
                ✕
              </button>
            </div>
          ))}


        </div>


        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition shadow-sm"
          >
            Cerrar
          </button>

          <button
            onClick={guardarCambios}
            className="px-6 py-2 bg-[#5a0c0c] hover:bg-[#430808] text-white rounded-xl transition shadow-md"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
