import UserDashboardLayout from "../layouts/UserDashboardLayout";

export default function DashboardUsuarios() {
  return (
    <UserDashboardLayout>
      <div className="flex flex-col items-center justify-center flex-1 text-center">
        <h1 className="text-3xl font-bold mb-4">Bienvenido a la Dashboard de Usuarios</h1>
        <p className="text-lg">Aquí podrás gestionar los paquetes, cambiar estados, ver reportes y más.</p>
      </div>
    </UserDashboardLayout>
  );
}
