import UserDashboardLayout from "../../../layouts/UserDashboardLayout"
import { useNavigate } from "react-router-dom";
import iconHome from "../../../assets/home-svgrepo-com.svg";

export default function ReporteSolicitudes() {
    const navigate = useNavigate();
    return (
        <UserDashboardLayout>
        <div className="min-w-0 max-w-full overflow-x-hidden px-4 pb-8 text-gray-800 animate-fade-in sm:px-6 lg:px-8">
            <h1 className="mb-1 text-3xl font-bold text-red-900">Reporte Solicitudes</h1>

            <p className="mb-6 flex items-center gap-1 text-sm text-gray-500">
            <img src={iconHome} alt="Inicio" className="h-4 w-4" />
            <button
                onClick={() => navigate("/dashboardUsuario")}
                className="cursor-pointer font-semibold text-gray-700 hover:underline"
            >
                Dashboard
            </button>
            &gt; Reporte Solicitudes
            </p>
        </div>
        </UserDashboardLayout>
    );
}