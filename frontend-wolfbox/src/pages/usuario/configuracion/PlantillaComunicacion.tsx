import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Ban,
  Clock,
  FileText,
  Inbox,
  Mail,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserDashboardLayout from "../../../layouts/UserDashboardLayout";
import iconHome from "../../../assets/home-svgrepo-com.svg";

type Plantilla = {
  id: number;
  clave_evento?: string | null;
  nombre: string;
  email_remitente: string;
  asunto: string;
  cuerpo: string;
  activo: number | boolean;
  creado_por?: string | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
};

type FormPlantilla = {
  nombre: string;
  clave_evento: string;
  email_remitente: string;
  asunto: string;
  cuerpo: string;
  activo: boolean;
};

type TabActiva = "plantillas" | "logs";

type EmailLog = {
  id: number;
  plantilla_id?: number | null;
  plantilla_nombre?: string | null;
  evento?: string | null;
  destinatario?: string | null;
  asunto?: string | null;
  proveedor?: string | null;
  estado?: string | null;
  message_id?: string | null;
  error?: string | null;
  fecha_envio?: string | null;
};

type FiltrosLogs = {
  estado: string;
  evento: string;
  destinatario: string;
  fecha_desde: string;
  fecha_hasta: string;
};

const formInicial: FormPlantilla = {
  nombre: "",
  clave_evento: "",
  email_remitente: "",
  asunto: "",
  cuerpo: "",
  activo: true,
};

const filtrosLogsIniciales: FiltrosLogs = {
  estado: "",
  evento: "",
  destinatario: "",
  fecha_desde: "",
  fecha_hasta: "",
};

const variablesDisponibles = [
  "{{cliente_nombre}}",
  "{{codigo_casillero}}",
  "{{tracking}}",
  "{{hawb}}",
  "{{fecha}}",
  "{{total}}",
  "{{email}}",
  "{{reset_url}}",
  "{{expira_minutos}}",
  "{{tipo_cuenta}}",
  "{{login_url}}",
  "{{whatsapp_url}}",
  "{{tienda}}",
  "{{contenido}}",
  "{{peso}}",
  "{{servicio}}",
  "{{consulta_url}}",
  "{{solicitud_id}}",
  "{{total_cop}}",
  "{{total_usd}}",
  "{{whatsapp_servicio}}",
  "{{banco_titular}}",
  "{{banco_nombre}}",
  "{{banco_cuenta}}",
  "{{banco_nit}}",
  "{{banco_llave}}",
];

const eventosPlantilla = [
  { value: "", label: "Sin evento automatico" },
  { value: "recuperacion_password", label: "Recuperacion de contrasena" },
  { value: "apertura_cuenta", label: "Apertura de cuenta" },
  { value: "paquete_digitado", label: "Digitacion de paquete" },
  { value: "solicitud_facturada", label: "Solicitud facturada" },
  { value: "cambio_estado", label: "Cambio de estado" },
];

const plantillaRecuperacionPassword = {
  nombre: "Recuperacion de contrasena",
  clave_evento: "recuperacion_password",
  asunto: "Restablece tu contrasena de JAES Cargo",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 10px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox · JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Restablece tu contrasena
        </h1>
        <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, recibimos una solicitud para recuperar el acceso de tu cuenta.
        </p>
      </div>
      <div style="padding:14px 24px 24px;">
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:16px;">
          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
            Haz clic en el boton para crear una nueva contrasena. Este enlace vence en <strong>{{expira_minutos}} minutos</strong>.
          </p>
          <a href="{{reset_url}}" style="display:inline-block;background:#7f1d1d;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;border-radius:12px;padding:12px 18px;">
            Crear nueva contrasena
          </a>
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          Si no solicitaste este cambio, puedes ignorar este correo. Por seguridad, no compartas este enlace.
        </p>
      </div>
    </div>
    <p style="text-align:center;margin:14px 0 0;color:#9ca3af;font-size:11px;">
      JAES Cargo Internacional · Notificacion automatica
    </p>
  </div>
</div>`,
};

const plantillaAperturaCuenta = {
  nombre: "Apertura de cuenta",
  clave_evento: "apertura_cuenta",
  asunto: "Bienvenido a JAES Cargo",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 24px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox · JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Tu cuenta fue creada
        </h1>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, tu acceso ya se encuentra activo en nuestra plataforma.
        </p>
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:14px;margin:14px 0;">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            <strong>Correo:</strong> {{email}}<br />
            <strong>Codigo casillero:</strong> {{codigo_casillero}}<br />
            <strong>Tipo de cuenta:</strong> {{tipo_cuenta}}
          </p>
        </div>
        <a href="{{login_url}}" style="display:inline-block;background:#7f1d1d;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;border-radius:12px;padding:12px 18px;">
          Ingresar a Wolfbox
        </a>
        <div style="border-radius:14px;background:#7f1d1d0d;border:1px solid #7f1d1d22;padding:14px;margin:16px 0 0;">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            Adjunto encontraras las tarifas del servicio, nuestras politicas y el paso a paso para realizar tu primera compra.
          </p>
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          Cualquier duda puedes comunicarte por WhatsApp a nuestra linea de servicio al cliente:
          <a href="{{whatsapp_url}}" style="color:#7f1d1d;font-weight:800;text-decoration:none;">{{whatsapp_servicio}}</a>.
        </p>
      </div>
    </div>
    <p style="text-align:center;margin:14px 0 0;color:#9ca3af;font-size:11px;">
      JAES Cargo Internacional · Notificacion automatica
    </p>
  </div>
</div>`,
};

const plantillaPaqueteDigitado = {
  nombre: "Paquete digitado",
  clave_evento: "paquete_digitado",
  asunto: "Paquete digitado: {{tracking}}",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 24px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox · JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Paquete digitado
        </h1>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, tu paquete fue registrado correctamente en nuestro sistema.
        </p>
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:14px;margin:14px 0;">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            <strong>Tracking:</strong> {{tracking}}<br />
            <strong>HAWB:</strong> {{hawb}}<br />
            <strong>Tienda:</strong> {{tienda}}<br />
            <strong>Contenido:</strong> {{contenido}}<br />
            <strong>Peso:</strong> {{peso}} lb<br />
            <strong>Servicio:</strong> {{servicio}}
          </p>
        </div>
        <a href="{{consulta_url}}" style="display:inline-block;background:#7f1d1d;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;border-radius:12px;padding:12px 18px;">
          Consultar guia
        </a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          Conserva este correo como soporte de digitacion.
        </p>
      </div>
    </div>
    <p style="text-align:center;margin:14px 0 0;color:#9ca3af;font-size:11px;">
      JAES Cargo Internacional · Notificacion automatica
    </p>
  </div>
</div>`,
};

const plantillaSolicitudFacturada = {
  nombre: "Solicitud facturada",
  clave_evento: "solicitud_facturada",
  asunto: "Solicitud #{{solicitud_id}} disponible para pago en Colombia",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 24px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox Â· JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Solicitud disponible para pago
        </h1>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, tu solicitud <strong>#{{solicitud_id}}</strong> ya se encuentra facturada y disponible para pago en Colombia.
        </p>
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:14px;margin:14px 0;">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            <strong>Solicitud:</strong> #{{solicitud_id}}<br />
            <strong>Codigo casillero:</strong> {{codigo_casillero}}<br />
            <strong>Total COP:</strong> {{total_cop}}<br />
            <strong>Total USD:</strong> {{total_usd}}<br />
            <strong>Fecha:</strong> {{fecha}}
          </p>
        </div>
        <div style="border-radius:14px;background:#7f1d1d0d;border:1px solid #7f1d1d22;padding:14px;margin:14px 0;">
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
            Por favor realiza el pago y responde a este mismo correo con el comprobante. Tambien puedes enviarlo por WhatsApp a nuestro numero de servicio al cliente:
            <strong>{{whatsapp_servicio}}</strong>.
          </p>
        </div>
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:14px;margin:14px 0;">
          <p style="margin:0 0 8px;color:#7f1d1d;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">
            Informacion bancaria
          </p>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            <strong>{{banco_titular}}</strong><br />
            <strong>{{banco_nombre}}</strong><br />
            <strong>Cuenta de Ahorros:</strong> {{banco_cuenta}}<br />
            <strong>NIT:</strong> {{banco_nit}}<br />
            <strong>Llave:</strong> {{banco_llave}}
          </p>
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          Adjuntamos el PDF de la solicitud de envio para que puedas revisar el detalle del cobro.
        </p>
      </div>
    </div>
    <p style="text-align:center;margin:14px 0 0;color:#9ca3af;font-size:11px;">
      JAES Cargo Internacional Â· Notificacion automatica
    </p>
  </div>
</div>`,
};

export default function PlantillaComunicacion() {
  const navigate = useNavigate();
  const cuerpoRef = useRef<HTMLTextAreaElement | null>(null);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modo, setModo] = useState<"crear" | "editar">("crear");
  const [editData, setEditData] = useState<Plantilla | null>(null);
  const [form, setForm] = useState<FormPlantilla>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [tabActiva, setTabActiva] = useState<TabActiva>("plantillas");
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [filtrosLogs, setFiltrosLogs] = useState<FiltrosLogs>(
    filtrosLogsIniciales
  );

  const totalActivas = useMemo(
    () => plantillas.filter((item) => Number(item.activo) === 1).length,
    [plantillas]
  );

  const logsEnviados = useMemo(
    () => logs.filter((item) => item.estado === "enviado").length,
    [logs]
  );

  const logsFallidos = useMemo(
    () => logs.filter((item) => item.estado === "fallido").length,
    [logs]
  );

  const cargarPlantillas = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "/api/plantillas-comunicacion?incluir_inactivas=1"
      );
      setPlantillas(Array.isArray(data.plantillas) ? data.plantillas : []);
    } catch (error) {
      console.error("Error cargando plantillas:", error);
      Swal.fire("Error", "No se pudieron cargar las plantillas", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlantillas();
  }, []);

  const cargarLogs = async () => {
    try {
      setLoadingLogs(true);

      const params = new URLSearchParams();
      Object.entries(filtrosLogs).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set("limite", "150");

      const { data } = await axios.get(
        `/api/plantillas-comunicacion/logs?${params.toString()}`
      );
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (error) {
      console.error("Error cargando logs:", error);
      Swal.fire("Error", "No se pudieron cargar los logs de email", "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (tabActiva === "logs") {
      cargarLogs();
    }
  }, [tabActiva]);

  const abrirCrear = () => {
    setTabActiva("plantillas");
    setModo("crear");
    setEditData(null);
    setForm(formInicial);
    setMostrarFormulario(true);
  };

  const abrirEditar = (plantilla: Plantilla) => {
    setModo("editar");
    setEditData(plantilla);
    setForm({
      nombre: plantilla.nombre || "",
      clave_evento: plantilla.clave_evento || "",
      email_remitente: plantilla.email_remitente || "",
      asunto: plantilla.asunto || "",
      cuerpo: plantilla.cuerpo || "",
      activo: Number(plantilla.activo ?? 1) === 1,
    });
    setMostrarFormulario(true);
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEditData(null);
    setForm(formInicial);
    setModo("crear");
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "clave_evento" && value === "recuperacion_password") {
      setForm((prev) => ({
        ...prev,
        ...plantillaRecuperacionPassword,
        email_remitente: prev.email_remitente,
        activo: prev.activo,
      }));
      return;
    }

    if (name === "clave_evento" && value === "apertura_cuenta") {
      setForm((prev) => ({
        ...prev,
        ...plantillaAperturaCuenta,
        email_remitente: prev.email_remitente,
        activo: prev.activo,
      }));
      return;
    }

    if (name === "clave_evento" && value === "paquete_digitado") {
      setForm((prev) => ({
        ...prev,
        ...plantillaPaqueteDigitado,
        email_remitente: prev.email_remitente,
        activo: prev.activo,
      }));
      return;
    }

    if (name === "clave_evento" && value === "solicitud_facturada") {
      setForm((prev) => ({
        ...prev,
        ...plantillaSolicitudFacturada,
        email_remitente: prev.email_remitente,
        activo: prev.activo,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const insertarVariable = (variable: string) => {
    const textarea = cuerpoRef.current;
    const inicio = textarea?.selectionStart ?? form.cuerpo.length;
    const fin = textarea?.selectionEnd ?? form.cuerpo.length;
    const siguiente =
      form.cuerpo.slice(0, inicio) + variable + form.cuerpo.slice(fin);

    setForm((prev) => ({ ...prev, cuerpo: siguiente }));

    setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(
        inicio + variable.length,
        inicio + variable.length
      );
    }, 0);
  };

  const guardarPlantilla = async () => {
    if (
      !form.nombre.trim() ||
      !form.email_remitente.trim() ||
      !form.asunto.trim() ||
      !form.cuerpo.trim()
    ) {
      Swal.fire(
        "Campos requeridos",
        "Completa nombre, email remitente, asunto y cuerpo del correo.",
        "warning"
      );
      return;
    }

    try {
      setGuardando(true);

      if (modo === "crear") {
        await axios.post("/api/plantillas-comunicacion", form);
        Swal.fire("OK", "Plantilla creada correctamente", "success");
      } else if (editData) {
        await axios.put(`/api/plantillas-comunicacion/${editData.id}`, form);
        Swal.fire("OK", "Plantilla actualizada correctamente", "success");
      }

      cancelarFormulario();
      await cargarPlantillas();
    } catch (error: any) {
      console.error("Error guardando plantilla:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.mensaje || "No se pudo guardar la plantilla",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const inhabilitarPlantilla = async (plantilla: Plantilla) => {
    const confirmacion = await Swal.fire({
      title: "Inhabilitar plantilla",
      text: `La plantilla ${plantilla.nombre} dejara de estar disponible para envio.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Si, inhabilitar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await axios.patch(`/api/plantillas-comunicacion/${plantilla.id}/inhabilitar`);
      Swal.fire("Listo", "Plantilla inhabilitada correctamente", "success");
      await cargarPlantillas();
    } catch (error: any) {
      console.error("Error inhabilitando plantilla:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.mensaje || "No se pudo inhabilitar la plantilla",
        "error"
      );
    }
  };

  const enviarPrueba = async (plantilla: Plantilla) => {
    const resultado = await Swal.fire({
      title: "Enviar prueba",
      input: "email",
      inputLabel: "Correo destinatario",
      inputPlaceholder: "correo@dominio.com",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Enviar prueba",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value) return "Ingresa un correo destinatario.";
        return undefined;
      },
    });

    if (!resultado.isConfirmed || !resultado.value) return;

    try {
      await axios.post(`/api/plantillas-comunicacion/${plantilla.id}/enviar-prueba`, {
        destinatario: resultado.value,
      });

      Swal.fire("Enviado", "Correo de prueba enviado correctamente", "success");
    } catch (error: any) {
      console.error("Error enviando prueba:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.mensaje || "No se pudo enviar el correo de prueba",
        "error"
      );
    }
  };

  const fecha = (valor?: string | null) => {
    if (!valor) return "-";
    return new Date(valor).toLocaleDateString("es-CO");
  };

  const fechaHora = (valor?: string | null) => {
    if (!valor) return "-";
    return new Date(valor).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const recortar = (texto = "", max = 110) =>
    texto.length > max ? `${texto.slice(0, max)}...` : texto;

  const estadoLogClass = (estado?: string | null) => {
    if (estado === "enviado") {
      return "border-green-700/20 bg-green-700/10 text-green-700";
    }

    if (estado === "fallido") {
      return "border-red-900/20 bg-red-900/10 text-red-900";
    }

    return "border-gray-200 bg-gray-100 text-gray-600";
  };

  const inputBase =
    "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/15";
  const labelBase = "text-xs font-bold uppercase tracking-[0.16em] text-gray-500";

  return (
    <UserDashboardLayout scrollable>
      <div className="min-w-0 max-w-full overflow-x-hidden px-4 pb-8 text-gray-800 animate-fade-in sm:px-6 lg:px-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-red-900">
              Plantillas de Comunicacion
            </h1>

            <p className="flex items-center gap-1 text-sm text-gray-500">
              <img src={iconHome} alt="Inicio" className="h-4 w-4" />
              <button
                onClick={() => navigate("/dashboardUsuario")}
                className="cursor-pointer font-semibold text-gray-700 hover:underline"
              >
                Dashboard
              </button>
              &gt; Plantillas de Comunicacion
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                tabActiva === "logs" ? cargarLogs() : cargarPlantillas()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-900"
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>

            {tabActiva === "plantillas" && (
              <button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-900/15 transition hover:bg-green-800 hover:shadow-xl"
              >
                <Plus size={18} />
                Nueva plantilla
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 flex w-full flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:w-fit sm:flex-row">
          <button
            type="button"
            onClick={() => setTabActiva("plantillas")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition ${
              tabActiva === "plantillas"
                ? "bg-red-900 text-white shadow-lg shadow-red-900/20"
                : "text-gray-600 hover:bg-red-50 hover:text-red-900"
            }`}
          >
            <FileText size={17} />
            Plantillas
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("logs")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition ${
              tabActiva === "logs"
                ? "bg-red-900 text-white shadow-lg shadow-red-900/20"
                : "text-gray-600 hover:bg-red-50 hover:text-red-900"
            }`}
          >
            <Clock size={17} />
            Log visible
          </button>
        </div>

        {tabActiva === "plantillas" ? (
          <>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-red-900/10 p-2 text-red-900">
                <Mail size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Total
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {plantillas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-green-700/10 p-2 text-green-700">
                <Send size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Activas
                </p>
                <p className="text-2xl font-black text-gray-900">{totalActivas}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-gray-900/10 p-2 text-gray-700">
                <Ban size={20} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                  Inhabilitadas
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {plantillas.length - totalActivas}
                </p>
              </div>
            </div>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-900">
                  Editor de correo
                </p>
                <h2 className="text-xl font-black text-gray-700">
                  {modo === "crear" ? "Crear nueva plantilla" : "Editar plantilla"}
                </h2>
              </div>

              <button
                type="button"
                onClick={cancelarFormulario}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
              >
                <X size={16} />
                Cerrar
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div className="space-y-2">
                <label className={labelBase}>Nombre de plantilla *</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className={inputBase}
                  placeholder="Ej: Notificacion de entrega"
                />
              </div>

              <div className="space-y-2">
                <label className={labelBase}>Evento del sistema</label>
                <select
                  name="clave_evento"
                  value={form.clave_evento}
                  onChange={handleChange}
                  className={`${inputBase} cursor-pointer`}
                >
                  {eventosPlantilla.map((evento) => (
                    <option key={evento.value} value={evento.value}>
                      {evento.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className={labelBase}>Email remitente *</label>
                <input
                  type="email"
                  name="email_remitente"
                  value={form.email_remitente}
                  onChange={handleChange}
                  className={inputBase}
                  placeholder="notificaciones@jaescargo.com"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className={labelBase}>Asunto del correo *</label>
                <input
                  name="asunto"
                  value={form.asunto}
                  onChange={handleChange}
                  className={inputBase}
                  placeholder="Tu solicitud {{tracking}} fue actualizada"
                />
              </div>

              <div className="space-y-3 lg:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className={labelBase}>Cuerpo del correo *</label>
                  <div className="flex flex-wrap gap-2">
                    {variablesDisponibles.map((variable) => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertarVariable(variable)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-900/15 bg-red-900/5 px-3 py-1 text-xs font-bold text-red-900 transition hover:bg-red-900 hover:text-white"
                      >
                        <Sparkles size={12} />
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  ref={cuerpoRef}
                  name="cuerpo"
                  value={form.cuerpo}
                  onChange={handleChange}
                  rows={10}
                  className={`${inputBase} min-h-[240px] resize-y leading-6`}
                  placeholder={`Hola {{cliente_nombre}},\n\nTu envio con tracking {{tracking}} fue actualizado.\n\nGracias por confiar en JAES Cargo.`}
                />
              </div>

              <label className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 lg:col-span-2">
                <span>
                  <span className="block text-sm font-bold text-gray-800">
                    Plantilla activa
                  </span>
                  <span className="text-xs text-gray-500">
                    Disponible para ser usada en comunicaciones del sistema.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, activo: e.target.checked }))
                  }
                  className="h-5 w-5 rounded border-gray-300 text-red-900 focus:ring-red-900"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelarFormulario}
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarPlantilla}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {guardando
                  ? "Guardando..."
                  : modo === "crear"
                    ? "Guardar plantilla"
                    : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-5 shadow-xl">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />

          <div className="mb-5 flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black tracking-wide text-slate-700">
                Mensajes de plantillas
              </h2>
              <p className="text-xs text-gray-500">
                Administra asuntos, remitentes y cuerpos reutilizables para correos.
              </p>
            </div>
            <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600">
              {totalActivas} listas para usar
            </span>
          </div>

          {loading ? (
            <div className="space-y-3 py-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : plantillas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="font-bold text-gray-700">No hay plantillas registradas.</p>
              <p className="mt-1 text-sm text-gray-500">
                Crea la primera plantilla para reutilizarla en correos del sistema.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-gray-500">
                    <th className="px-4 py-2">Plantilla</th>
                    <th className="px-4 py-2">Remitente</th>
                    <th className="px-4 py-2">Mensaje</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {plantillas.map((item) => {
                    const activa = Number(item.activo) === 1;

                    return (
                      <tr
                        key={item.id}
                        className="group bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50/70 hover:shadow-lg"
                      >
                        <td className="rounded-l-xl border-y border-l border-gray-100 px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 rounded-xl bg-red-900/10 p-2 text-red-900 transition group-hover:bg-red-900 group-hover:text-white">
                              <FileText size={18} />
                            </span>
                            <div>
                              <p className="font-black text-gray-900">{item.nombre}</p>
                              <p className="text-xs font-semibold text-gray-500">
                                Creada: {fecha(item.fecha_creacion)}
                              </p>
                              {item.clave_evento && (
                                <p className="mt-1 inline-flex rounded-full bg-red-900/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-900">
                                  {item.clave_evento}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="border-y border-gray-100 px-4 py-4 align-top">
                          <p className="font-semibold text-slate-700">
                            {item.email_remitente}
                          </p>
                          <p className="text-xs text-slate-500">
                            Por: {item.creado_por || "Sistema"}
                          </p>
                        </td>

                        <td className="max-w-xl border-y border-gray-100 px-4 py-4 align-top">
                          <p className="font-bold text-slate-700">{item.asunto}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {recortar(item.cuerpo)}
                          </p>
                        </td>

                        <td className="border-y border-gray-100 px-4 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              activa
                                ? "bg-green-700/10 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {activa ? "Activa" : "Inhabilitada"}
                          </span>
                        </td>

                        <td className="rounded-r-xl border-y border-r border-gray-100 px-4 py-4 align-top">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => enviarPrueba(item)}
                              disabled={!activa}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-green-700/30 bg-green-700/10 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-700 hover:text-white disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              <Send size={14} />
                              Prueba
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirEditar(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-900"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => inhabilitarPlantilla(item)}
                              disabled={!activa}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-950 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                            >
                              <Ban size={14} />
                              Inhabilitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
          </>
        ) : (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-red-900/10 p-2 text-red-900">
                    <Inbox size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                      Registros
                    </p>
                    <p className="text-2xl font-black text-gray-900">
                      {logs.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-green-700/10 p-2 text-green-700">
                    <Send size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                      Enviados
                    </p>
                    <p className="text-2xl font-black text-gray-900">
                      {logsEnviados}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-red-900/10 p-2 text-red-900">
                    <Ban size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                      Fallidos
                    </p>
                    <p className="text-2xl font-black text-gray-900">
                      {logsFallidos}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-900">
                  Filtros del historial
                </p>
                <p className="text-sm text-gray-500">
                  Consulta envios reales, pruebas y errores registrados por Brevo.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-5">
                <select
                  value={filtrosLogs.estado}
                  onChange={(e) =>
                    setFiltrosLogs((prev) => ({
                      ...prev,
                      estado: e.target.value,
                    }))
                  }
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="">Todos los estados</option>
                  <option value="enviado">Enviado</option>
                  <option value="fallido">Fallido</option>
                </select>

                <select
                  value={filtrosLogs.evento}
                  onChange={(e) =>
                    setFiltrosLogs((prev) => ({
                      ...prev,
                      evento: e.target.value,
                    }))
                  }
                  className={`${inputBase} cursor-pointer`}
                >
                  <option value="">Todos los eventos</option>
                  <option value="prueba_plantilla">Prueba de plantilla</option>
                  {eventosPlantilla
                    .filter((evento) => evento.value)
                    .map((evento) => (
                      <option key={evento.value} value={evento.value}>
                        {evento.label}
                      </option>
                    ))}
                </select>

                <input
                  value={filtrosLogs.destinatario}
                  onChange={(e) =>
                    setFiltrosLogs((prev) => ({
                      ...prev,
                      destinatario: e.target.value,
                    }))
                  }
                  className={inputBase}
                  placeholder="Buscar destinatario"
                />

                <input
                  type="date"
                  value={filtrosLogs.fecha_desde}
                  onChange={(e) =>
                    setFiltrosLogs((prev) => ({
                      ...prev,
                      fecha_desde: e.target.value,
                    }))
                  }
                  className={inputBase}
                />

                <input
                  type="date"
                  value={filtrosLogs.fecha_hasta}
                  onChange={(e) =>
                    setFiltrosLogs((prev) => ({
                      ...prev,
                      fecha_hasta: e.target.value,
                    }))
                  }
                  className={inputBase}
                />
              </div>

              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setFiltrosLogs(filtrosLogsIniciales)}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={cargarLogs}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/20 transition hover:bg-red-950"
                >
                  <Search size={17} />
                  Buscar
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-5 shadow-xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-950 via-gray-300 to-red-950" />

              <div className="mb-5 flex flex-col gap-2 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-wide text-gray-800">
                    Historial de correos
                  </h2>
                  <p className="text-xs text-gray-500">
                    Revisa destinatario, plantilla, estado y respuesta del proveedor.
                  </p>
                </div>
                <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600">
                  Ultimos 150 registros
                </span>
              </div>

              {loadingLogs ? (
                <div className="space-y-3 py-8">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-gray-100"
                    />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
                  <p className="font-bold text-gray-700">
                    No hay logs para mostrar.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando el sistema envie correos, apareceran en este historial.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-y-2 text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.16em] text-gray-500">
                        <th className="px-4 py-2">Fecha</th>
                        <th className="px-4 py-2">Evento</th>
                        <th className="px-4 py-2">Destinatario</th>
                        <th className="px-4 py-2">Asunto</th>
                        <th className="px-4 py-2">Estado</th>
                        <th className="px-4 py-2">Detalle</th>
                      </tr>
                    </thead>

                    <tbody>
                      {logs.map((item) => (
                        <tr
                          key={item.id}
                          className="group bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50/70 hover:shadow-lg"
                        >
                          <td className="rounded-l-xl border-y border-l border-gray-100 px-4 py-4 align-top font-semibold text-gray-700">
                            {fechaHora(item.fecha_envio)}
                          </td>
                          <td className="border-y border-gray-100 px-4 py-4 align-top">
                            <p className="font-black text-gray-900">
                              {item.evento || "Sin evento"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.plantilla_nombre || "Sin plantilla"}
                            </p>
                          </td>
                          <td className="border-y border-gray-100 px-4 py-4 align-top font-semibold text-gray-800">
                            {item.destinatario || "-"}
                          </td>
                          <td className="max-w-sm border-y border-gray-100 px-4 py-4 align-top">
                            <p className="font-bold text-gray-900">
                              {item.asunto || "-"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.proveedor || "brevo"}
                            </p>
                          </td>
                          <td className="border-y border-gray-100 px-4 py-4 align-top">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${estadoLogClass(
                                item.estado
                              )}`}
                            >
                              {item.estado || "sin estado"}
                            </span>
                          </td>
                          <td className="rounded-r-xl border-y border-r border-gray-100 px-4 py-4 align-top">
                            {item.error ? (
                              <p className="max-w-xs text-xs font-semibold leading-5 text-red-900">
                                {recortar(item.error, 140)}
                              </p>
                            ) : (
                              <p className="max-w-xs text-xs font-semibold leading-5 text-gray-500">
                                {item.message_id
                                  ? `ID proveedor: ${item.message_id}`
                                  : "Sin novedad registrada"}
                              </p>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </UserDashboardLayout>
  );
}
