import { useNavigate, useLocation } from "react-router-dom";

export default function ConfirmacionPage() {
  const location = useLocation();
  const codigoReferencia = location.state?.codigoReferencia || "No disponible";
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-200">
      <div className="flex flex-col justify-center items-center h-full text-center p-4 z-10 relative">
        <img
          src="/check-circle.svg"
          alt="check circle"
          className="w-40 h-40 mb-4"
        />
        <p className="text-lg font-semibold">
          Tu casillero ha sido creado con éxito ✅
        </p>
        <p className="mt-2 text-gray-700">
          Tu código de casillero es:{" "}
          <span className="text-red-900 font-bold">{codigoReferencia}</span>
        </p>
        <p className="text-red-900 font-bold mt-2">
          ¡Importante!:{" "}
          <span className="font-normal text-black">
            A tu correo llegará toda la información de uso
          </span>
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 px-8 py-3 bg-red-900 text-white font-semibold rounded-xl shadow-md hover:bg-red-950 hover:scale-105 transition-transform duration-300 cursor-pointer"
        >
          Volver
        </button>
      </div>

      <p className="absolute bottom-2 w-full text-center text-sm text-black z-10">
        Copyright © Wolfbox Software 2025
      </p>

      <div className="absolute w-[20vw] h-[20vw] bg-red-900 rounded-full top-[-5vh] right-[-10vw] opacity-85" />
      <div className="absolute w-[10vw] h-[10vw] bg-red-900 rounded-full top-[30vh] right-[15vw] opacity-85" />
      <div className="absolute w-[5vw] h-[5vw] bg-red-900 rounded-full bottom-[5vh] left-[30vw] opacity-85" />
      <div className="absolute w-[10vw] h-[10vw] bg-red-900 rounded-full bottom-[10vh] left-[10vw] opacity-85" />
      <div className="absolute w-[20vw] h-[20vw] bg-red-900 rounded-full bottom-[-10vh] left-[-10vw] opacity-85" />
    </div>
  );
}
