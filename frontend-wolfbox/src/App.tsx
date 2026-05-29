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
}: {
  children: ReactNode;
  roles?: RolInterno[];
}) {
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const usuario = obtenerUsuarioInterno();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(usuario.tipo)) {
    return <Navigate to="/dashboardUsuario" replace />;
  }

  return <>{children}</>;
}

const interna = (children: ReactNode, roles?: RolInterno[]) => (
  <RutaInterna roles={roles}>{children}</RutaInterna>
);

const soloAdmin: RolInterno[] = ["admin"];



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
        <Route path="/digitacion-paquetes" element={interna(<DigitacionPaquetes />)} />
        <Route path ="/crear-tracking" element={interna(<CrearTracking/>)} />
        <Route path ="/consultar-tracking" element={interna(<ConsultarTracking/>)} />
        <Route path ="/consultar-guia" element={interna(<ConsultarGuia/>)} />
        <Route path="/perfil" element={interna(<VerPerfil />)} />
        <Route path="/crear-usuario" element={interna(<CrearUsuario />, soloAdmin)} />
        <Route path="/consultar-usuario" element={interna(<ConsultarUsuarios />, soloAdmin)} />
        <Route path="/usuarios/editar/:id" element={interna(<EditarUsuario />, soloAdmin)} />
        <Route path="/solicitar-despachos" element={interna(<SolicitarDespacho />)} />
        <Route path="/destinatarios-casilleros" element={interna(<DestinatariosCasilleros />)} />
        <Route path="/config-trm" element={interna(<ConfigTRM />, soloAdmin)} />
        <Route path="/conciliacion-pagos" element={interna(<ConciliacionPago />)} />
        <Route path="/config-tarifas" element={interna(<ConfigTarifas />, soloAdmin)} />
        <Route path="/agrupar-paquetes" element={interna(<AgruparPaquetes />)} />
        <Route path="/crear-despachos" element={interna(<CrearDespachos />)} />
        <Route path="/armar-despachos" element={interna(<ArmarDespachos />)} />
        <Route path="/armar-despachos/:id" element={interna(<ArmarDespachos />)} />
        <Route path="/reporte-estado-guia" element={interna(<ReporteEstadoGuia />, soloAdmin)} />
        <Route path="/reporte-clientes-casilleros" element={interna(<ReporteClientesCasilleros />, soloAdmin)} />
        <Route path="/reporte-solicitudes" element={interna(<ReporteSolicitudes />, soloAdmin)} />
        <Route path="/transportadoras" element={interna(<Transportadoras />, soloAdmin)} />
        <Route path="/plantilla-comunicacion" element={interna(<PlantillaComunicacion />, soloAdmin)} />
        <Route
          path="/dashboardUsuario/agrupar-solicitud/:id"
          element={interna(<AgruparSolicitud />)}
        />
        <Route path="/Clientes" element={interna(<VerClientes />)} />

      </Routes>
      <InactivityWatcher />
      <SessionExpiredOverlay />
    </>
  );
}

export default App;
