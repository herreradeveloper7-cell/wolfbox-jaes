import { Fragment } from "react";
import { Transition } from "@headlessui/react";

interface ModalConfirmarEliminarProps {
  mensaje: string;
  onConfirm: () => void;
  onCancel: () => void;
  visible: boolean;
}

export default function ModalConfirmarEliminar({
  mensaje,
  onConfirm,
  onCancel,
  visible,

}: ModalConfirmarEliminarProps) {
  return (
    <Transition show={visible} as={Fragment}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute inset-0 bg-black/40" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95 translate-y-6"
          enterTo="opacity-100 scale-100 translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100 translate-y-0"
          leaveTo="opacity-0 scale-95 translate-y-6"
        >
          <div className="relative z-10 bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border border-gray-300">
            <div className="flex justify-center mb-4">
              <div className="text-orange-500 text-6xl">⚠️</div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              {mensaje}
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={onCancel}
                className="bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded shadow cursor-pointer"
              >
                No, ¡cancelar!
              </button>
              <button
                onClick={onConfirm}
                className="bg-green-900 hover:bg-green-950 text-white px-4 py-2 rounded shadow cursor-pointer"
              >
                Sí, ¡bórralo!
              </button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Transition>
  );
}
