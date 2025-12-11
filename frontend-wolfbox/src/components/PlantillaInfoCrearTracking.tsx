import ReactDOM from "react-dom";
import { useState,useEffect } from "react";
import iconExcel from "../assets/file-excel-svgrepo-com.svg";
import iconInfo from "../assets/info-circle-svgrepo-com.svg";


export default function PlantillaInfoCrearTracking({ onClose }: { onClose: () => void }) {
    const [show, setShow] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);


    useEffect(() => {
        const timeout = setTimeout(() => setShow(true), 10); 
        return () => clearTimeout(timeout);
    }, []);

    const handleClose = () => {
    setShow(false);
        setTimeout(() => {
        setShouldRender(false);
        onClose();
        }, 300); 
    };

    if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-5 overflow-y-auto">
      <div 
        className={`bg-white rounded-xl shadow-2xl border border-gray-400 w-full max-w-2xl p-6 relative
          transform transition-all duration-300 ease-out
          ${show ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
        >
            
        <h2 className="text-lg font-semibold flex items-center justify-center mb-4">
            <img src={iconInfo} alt="Info Icon" className="w-6 h-6 mr-2" />
            <span className="text-gray-600 mr-2 text-xl">Información sobre la plantilla</span> 
        </h2>

        <table className="w-full text-sm mb-4">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-2 border-t border-gray-300">Columna</th>
              <th className="text-left p-2 border-t border-gray-300">Descripción</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-300 bg-gray-50 text-gray-600">
              <td className="p-2 ">Fecha</td>
              <td className="p-2 ">Formato: [YYYY-MM-DD, YYYY/MM/DD] (Ej: 2023-06-15, 2023/06/15)</td>
            </tr>
            <tr className="border-t border-gray-300 text-gray-600">
              <td className="p-2">Hora</td>
              <td className="p-2 ">Formato: HH:MM (24 horas) (Ej: 14:30)</td>
            </tr>
            <tr className="border-t border-gray-300 bg-gray-50 text-gray-600">
              <td className="p-2">HAWB/Referencia</td>
              <td className="p-2 ">requerido | Texto alfanumérico</td>
            </tr>
            <tr className="border-t border-gray-300 text-gray-600">
              <td className="p-2 ">Estado</td>
              <td className="p-2 ">requerido | Texto (Ej: Entregado, En tránsito, etc.)</td>
            </tr>
            <tr className="border-t border-gray-300 bg-gray-50 text-gray-600">
              <td className="p-2 ">Observacion</td>
              <td className="p-2 ">Texto (Comentarios adicionales)</td>
            </tr>
            <tr className="border-t border-gray-300 text-gray-600">
              <td className="p-2">Remesa</td>
              <td className="p-2">Texto alfanumérico</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-end gap-4">
          <button
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded flex items-center gap-2 shadow-md cursor-pointer transition-all"
            onClick={() => alert("Descargando plantilla...")}
          >
            <img src={iconExcel} alt="Excel Icon" className="w-4 h-4" />
            Descargar plantilla
          </button>
          <button
            onClick={handleClose}
            className="bg-red-900 hover:bg-red-950 text-white text-sm px-4 py-2 cursor-pointer transition-all rounded shadow-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
    );
}