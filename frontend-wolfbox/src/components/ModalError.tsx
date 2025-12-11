import ReactDOM from "react-dom";
import { useEffect, useState } from "react";
import advertenciaIcon from "../assets/warning-filled-svgrepo-com.svg";

interface ModalErrorProps {
  mensaje: string;
  onClose: () => void;
}

const ModalError: React.FC<ModalErrorProps> = ({ mensaje, onClose }) => {
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
        className={`bg-white rounded shadow-2xl border border-gray-400 w-[700px] max-w-full p-6 relative transform transition-all duration-300 ease-out
        ${show ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        `}
      >
        <div className="flex flex-col items-center pt-2">
          <img src={advertenciaIcon} alt="Alerta" className="w-10 h-10" />
          <p className="text-red-600 text-center text-base font-normal py-4">
            {mensaje}
          </p>
        </div>
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex justify-center">
          <button
            onClick={handleClose}
            className="bg-red-900 hover:bg-red-950 text-white px-5 py-2 rounded transition"
          >
            cerrar
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};

export default ModalError;
