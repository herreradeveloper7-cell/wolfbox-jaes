import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ClientDashboardLayout from "../layouts/ClientDashboardLayout";

type Cliente = {
  nombre: string;
  primer_apellido: string;
  genero: string;
  codigoReferencia: string;
};

export default function DashboardClients() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  
  useEffect(() => {
    const stored = localStorage.getItem("cliente");
    if (stored) {
      setTimeout(() => {
        try {
          const parsed = JSON.parse(stored);
          setCliente(parsed);  
        } catch (err) {
          console.error("Error al parsear cliente:", err);
          navigate("/login");
        }
      }, 2000);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!cliente) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700">Cargando cliente...</p>
      </div>
    );
  }  

  return (
    <ClientDashboardLayout>
      <div className="relative flex flex-col justify-center items-center h-full px-4 pt-12 pb-28 text-center">
      <h1 className="text-3xl font-bold mb-2">¡BIENVENIDO A TU CASILLERO!</h1>
        <p className="text-lg font-medium mt-4">
          Código de casillero:{" "}
          <span className="font-bold text-red-800">
            *{cliente.codigoReferencia || "No disponible"}*
          </span>
        </p>

        <div className="fixed bottom-20 z-30">
          <button
            onClick={() => {
              localStorage.removeItem("cliente");
              navigate("/login");
            }}
            className="mt-6 px-6 py-2 bg-red-900 text-white rounded hover:bg-red-950 transition cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="absolute w-[15vw] h-[15vw] bg-red-900 rounded-full top-[-15vh] right-[-8vw] opacity-85" />
        <div className="absolute w-[15vw] h-[15vw] bg-red-900 rounded-full top-[55vh] right-[-3vw] opacity-85" />
        <div className="absolute w-[6vw] h-[6vw] bg-red-900 rounded-full bottom-[10vh] right-[15vw] opacity-85" />
      </div>
    </ClientDashboardLayout>
  );
}
