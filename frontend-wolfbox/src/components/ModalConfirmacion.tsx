import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  mensaje: string | null;
  onClose: () => void;
}

export default function ModalConfirmacion({ mensaje, onClose }: Props) {
  useEffect(() => {
    const timeout = setTimeout(onClose, 5000);
    return () => clearTimeout(timeout);
  }, [onClose]);

  if (!mensaje) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]  flex items-center justify-center bg-black/40 pt-5 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-gray-300 shadow-lg p-6 rounded-xl w-[360px] text-center animate-fade-in">
        <div className="text-green-600 text-5xl mb-2">✓</div>
        <h2 className="text-lg font-semibold text-gray-800">{mensaje}</h2>
        <button
          className="mt-4 px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}
