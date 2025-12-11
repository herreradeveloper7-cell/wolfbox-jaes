import { useState } from "react";
import PersonalForm from "../components/PersonalForm";
import EmpresarialForm from "../components/EmpresarialForm";


export default function RegisterPages() {
    const [accountType, setAccountType] = useState("");

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex justify-center overflow-hidden relative">
        <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-6xl z-10 relative">
          <h2 className="text-center text-3xl font-semibold mb-2">Regístrate!</h2>
          <p className="text-center text-sm text-gray-500 mb-10">* Campos requeridos</p>
  
          <div className="mb-6">
            <label htmlFor="accountType" className="block font-medium mb-2">Tipo de cuenta *</label>
            <select
              id="accountType"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="" disabled>Selecciona una opción</option>
              <option value="personal">Personal</option>
              <option value="empresarial">Empresarial</option>
            </select>
          </div>

          {accountType === "personal" && <PersonalForm tipoCliente="personal" />}
          {accountType === "empresarial" && <EmpresarialForm tipoCliente="empresarial" />}

        </div>
        
        <div className="absolute bg-red-900 rounded-full opacity-90 w-[25vw] h-[25vw] top-[-10vw] right-[-15vw]"></div>
        <div className="absolute bg-red-900 rounded-full opacity-90 w-[10vw] h-[10vw] top-[25vh] right-[10vw] hidden sm:block"></div>
        <div className="absolute bg-red-900 rounded-full opacity-90 w-[8vw] h-[8vw] top-[75vh] left-[20vw] hidden md:block"></div>
        <div className="absolute bg-red-900 rounded-full opacity-90 w-[10vw] h-[10vw] top-[50vh] left-[5vw] hidden md:block"></div>
        <div className="absolute bg-red-900 rounded-full opacity-90 w-[25vw] h-[25vw] bottom-[-15vw] left-[-10vw]"></div>
      </div> 
    );
}