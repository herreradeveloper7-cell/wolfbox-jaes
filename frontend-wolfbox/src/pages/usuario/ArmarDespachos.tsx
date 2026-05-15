import { useNavigate } from "react-router-dom";
import iconHome from "../../assets/home-svgrepo-com.svg";
import UserDashboardLayout from "../../layouts/UserDashboardLayout";



export default function ArmarDespachos() {
  const navigate = useNavigate();

  return (
    <UserDashboardLayout scrollable>
      <div className="text-gray-800 px-6 lg:px-10">
        <h1 className="text-3xl font-bold mb-2 text-red-900">Armar Despachos</h1>

        <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
          <img src={iconHome} alt="Inicio" className="w-4 h-4" />
          <button
            onClick={() => navigate("/dashboardUsuario")}
            className="font-semibold hover:underline text-gray-700 cursor-pointer"
          >
            Dashboard
          </button>
          &gt; Armar Despachos
        </p>
    </div>
    </UserDashboardLayout>
  );
}