import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Home from './pages/Home';
import LoginPage from './pages/Login';
import './App.css'
import RegisterPage from './pages/Register';
import ConfirmacionPage from './pages/Confirmacion';
import DashboardClientePage from './pages/DashboardCliente';
import DashboardUsuarioPage from './pages/DashboardUsuarios';
import EditarPerfilCliente from './pages/cliente/EditarPerfilCliente';
import DigitacionPaquetes from './pages/usuario/DigitacionPaquetes';
import CrearTracking from './pages/usuario/CrearTracking';
import ConsultarTracking from './pages/usuario/ConsultarTracking';
import ConsultarGuia from './pages/usuario/ConsultarGuia';  
import VerPerfil from './pages/usuario/VerPerfil';
import CrearUsuario from './pages/usuario/CrearUsuario';
import ConsultarUsuarios from './pages/usuario/ConsultarUsuarios';
import EditarUsuario from "./pages/usuario/EditarUsuario";
import SolicitarDespacho from "./pages/SolicitarDespachos";
import DestinatariosCasilleros from './pages/DestinatariosCasilleros'; 
import ConfigTRM from './pages/usuario/ConfigTRM';
import ConciliacionPago from './pages/usuario/ConciliacionPagos';
import ConfigTarifas from './pages/usuario/ConfigTarifas';
import AgruparPaquetes from './pages/usuario/AgruparPaquetes/AgruparPaquetes';
import AgruparSolicitud from './pages/usuario/AgruparPaquetes/AgruparSolicitud';
import VerClientes from './pages/usuario/VerClientes';
import ConsultarGuiaHome from './pages/consultarGuiaHome';
import PasswordResetPage from './pages/passwordReset';
import SessionExpiredOverlay from './components/SessionExpiredOverlay';
import InactivityWatcher from './components/InactivityWatcher';
import CrearDespachos from './pages/usuario/CrearDespachos';
import ArmarDespachos from './pages/usuario/ArmarDespachos';
import ReporteEstadoGuia from './pages/usuario/Reportes/ReporteEstadoGuia';
import ReporteClientesCasilleros from './pages/usuario/Reportes/ReporteClientesCasilleros';
import ReporteSolicitudes from './pages/usuario/Reportes/ReporteSolicitudes';
import Transportadoras from './pages/usuario/configuracion/Transportadoras';
import PlantillaComunicacion from './pages/usuario/configuracion/PlantillaComunicacion';

type RolInterno = "admin" | "usuario";
type PermisoModulo =
  | "Casilleros"
  | "Operaciones"
  | "Tracking"
  | "Reportes"
  | "Seguridad"
  | "Configuracion"
  | "Perfil";

const obtenerUsuarioInterno = () => {
  const stored =
    localStorage.getItem("usuario") || sessionStorage.getItem("usuario");

  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

function RutaInterna({
  children,
  roles = ["admin", "usuario"],
  permiso,
}: {
  children: ReactNode;
  roles?: RolInterno[];
  permiso?: PermisoModulo;
}) {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const usuario = obtenerUsuarioInterno();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  const permisos = Array.isArray(usuario.permisos) ? usuario.permisos : [];

  if (!roles.includes(usuario.tipo)) {
    return <Navigate to="/dashboardUsuario" replace />;
  }

  if (
    usuario.tipo !== "admin" &&
    permiso &&
    !permisos.includes(permiso)
  ) {
    return <Navigate to="/dashboardUsuario" replace />;
  }

  return <>{children}</>;
}

const interna = (
  children: ReactNode,
  permiso?: PermisoModulo,
  roles?: RolInterno[]
) => (
  <RutaInterna roles={roles} permiso={permiso}>{children}</RutaInterna>
);



function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/confirmacion" element={<ConfirmacionPage />} />
        <Route path="/consulta-hawb" element={<ConsultarGuiaHome />} />
        <Route path="/dashboardCliente" element={<DashboardClientePage />} />
        <Route path="/dashboardUsuario" element={interna(<DashboardUsuarioPage />)} />
        <Route path="/editar-perfil" element={<EditarPerfilCliente />} />
        <Route path="/digitacion-paquetes" element={interna(<DigitacionPaquetes />, "Casilleros")} />
        <Route path ="/crear-tracking" element={interna(<CrearTracking/>, "Tracking")} />
        <Route path ="/consultar-tracking" element={interna(<ConsultarTracking/>, "Tracking")} />
        <Route path ="/consultar-guia" element={interna(<ConsultarGuia/>, "Casilleros")} />
        <Route path="/perfil" element={interna(<VerPerfil />, "Perfil")} />
        <Route path="/crear-usuario" element={interna(<CrearUsuario />, "Seguridad")} />
        <Route path="/consultar-usuario" element={interna(<ConsultarUsuarios />, "Seguridad")} />
        <Route path="/usuarios/editar/:id" element={interna(<EditarUsuario />, "Seguridad")} />
        <Route path="/solicitar-despachos" element={interna(<SolicitarDespacho />, "Casilleros")} />
        <Route path="/destinatarios-casilleros" element={interna(<DestinatariosCasilleros />, "Casilleros")} />
        <Route path="/config-trm" element={interna(<ConfigTRM />, "Configuracion")} />
        <Route path="/conciliacion-pagos" element={interna(<ConciliacionPago />, "Casilleros")} />
        <Route path="/config-tarifas" element={interna(<ConfigTarifas />, "Configuracion")} />
        <Route path="/agrupar-paquetes" element={interna(<AgruparPaquetes />, "Casilleros")} />
        <Route path="/crear-despachos" element={interna(<CrearDespachos />, "Operaciones")} />
        <Route path="/armar-despachos" element={interna(<ArmarDespachos />, "Operaciones")} />
        <Route path="/armar-despachos/:id" element={interna(<ArmarDespachos />, "Operaciones")} />
        <Route path="/reporte-estado-guia" element={interna(<ReporteEstadoGuia />, "Reportes")} />
        <Route path="/reporte-clientes-casilleros" element={interna(<ReporteClientesCasilleros />, "Reportes")} />
        <Route path="/reporte-solicitudes" element={interna(<ReporteSolicitudes />, "Reportes")} />
        <Route path="/transportadoras" element={interna(<Transportadoras />, "Configuracion")} />
        <Route path="/plantilla-comunicacion" element={interna(<PlantillaComunicacion />, "Configuracion")} />
        <Route
          path="/dashboardUsuario/agrupar-solicitud/:id"
          element={interna(<AgruparSolicitud />, "Casilleros")}
        />
        <Route path="/Clientes" element={interna(<VerClientes />, "Casilleros")} />

      </Routes>
      <InactivityWatcher />
      <SessionExpiredOverlay />
    </>
  );
}

export default App;
