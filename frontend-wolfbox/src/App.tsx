import { Routes, Route } from 'react-router-dom';
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
import CrearDespachos from './pages/usuario/CrearDespachos';
import ArmarDespachos from './pages/usuario/ArmarDespachos';
import ReporteEstadoGuia from './pages/usuario/Reportes/ReporteEstadoGuia';
import ReporteClientesCasilleros from './pages/usuario/Reportes/ReporteClientesCasilleros';
import ReporteSolicitudes from './pages/usuario/Reportes/ReporteSolicitudes';




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
        <Route path="/dashboardUsuario" element={<DashboardUsuarioPage />} />
        <Route path="/editar-perfil" element={<EditarPerfilCliente />} />
        <Route path="/digitacion-paquetes" element={<DigitacionPaquetes />} />
        <Route path ="/crear-tracking" element={<CrearTracking/>} />
        <Route path ="/consultar-tracking" element={<ConsultarTracking/>} />
        <Route path ="/consultar-guia" element={<ConsultarGuia/>} />
        <Route path="/perfil" element={<VerPerfil />} />
        <Route path="/crear-usuario" element={<CrearUsuario />} />
        <Route path="/consultar-usuario" element={<ConsultarUsuarios />} />
        <Route path="/usuarios/editar/:id" element={<EditarUsuario />} />
        <Route path="/solicitar-despachos" element={<SolicitarDespacho />} />
        <Route path="/destinatarios-casilleros" element={<DestinatariosCasilleros />} />
        <Route path="/config-trm" element={<ConfigTRM />} />
        <Route path="/conciliacion-pagos" element={<ConciliacionPago />} />
        <Route path="/config-tarifas" element={<ConfigTarifas />} />
        <Route path="/agrupar-paquetes" element={<AgruparPaquetes />} />
        <Route path="/crear-despachos" element={<CrearDespachos />} />
        <Route path="/armar-despachos" element={<ArmarDespachos />} />
        <Route path="/armar-despachos/:id" element={<ArmarDespachos />} />
        <Route path="/reporte-estado-guia" element={<ReporteEstadoGuia />} />
        <Route path="/reporte-clientes-casilleros" element={<ReporteClientesCasilleros />} />
        <Route path="/reporte-solicitudes" element={<ReporteSolicitudes />} />
        
        <Route
          path="/dashboardUsuario/agrupar-solicitud/:id"
          element={<AgruparSolicitud />}
        />
        <Route path="/Clientes" element={<VerClientes />} />

      </Routes>
      <SessionExpiredOverlay />
    </>
  );
}

export default App;
