import { z } from "zod";

const emptyToUndefined = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return typeof value === "string" ? value.trim() : value;
};

export const requiredString = (label = "Campo") =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string({ required_error: `${label} es requerido` }).min(1, `${label} es requerido`)
  );

export const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().optional()
);

export const requiredNumber = (label = "Campo") =>
  z.coerce
    .number({ required_error: `${label} es requerido`, invalid_type_error: `${label} debe ser numerico` })
    .finite(`${label} debe ser numerico`);

export const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().finite().optional()
);

export const idParam = (name = "id") =>
  z.object({
    [name]: z.coerce.number().int().positive(`${name} invalido`),
  });

export const textParam = (name) =>
  z.object({
    [name]: requiredString(name),
  });

const email = z.string().trim().email("Correo invalido");
const permisos = z.array(z.string().trim().min(1)).optional().default([]);
const rolUsuario = z.enum(["admin", "usuario"]);
const genero = optionalString;

export const usuarioSchemas = {
  crear: z.object({
    nombre: requiredString("Nombre"),
    email,
    password: requiredString("Contrasena"),
    tipo: rolUsuario,
    permisos,
    genero,
  }).passthrough(),
  editar: z.object({
    nombre: requiredString("Nombre"),
    email,
    password: optionalString,
    tipo_usuario: rolUsuario,
    permisos,
    genero,
  }).passthrough(),
  estado: z.object({
    estado: z.enum(["activo", "inactivo", "inhabilitado"]),
  }).passthrough(),
};

export const clienteSchemas = {
  reporteCasilleros: z.object({
    fechaDesde: optionalString,
    fechaHasta: optionalString,
    tipo_cliente: z.enum(["todos", "personal", "empresarial"]).optional().default("todos"),
  }).passthrough(),
  validar: z.object({
    email,
    numeroIdentificacion: requiredString("Numero de identificacion"),
  }).passthrough(),
  login: z.object({
    email,
    contrasena: requiredString("Contrasena"),
  }).passthrough(),
  registrar: z.object({
    email,
    contrasena: requiredString("Contrasena"),
    tipo_cliente: z.enum(["personal", "empresarial"]),
    tipoIdentificacion: requiredString("Tipo de identificacion"),
    numeroIdentificacion: requiredString("Numero de identificacion"),
    primerNombre: optionalString,
    segundoNombre: optionalString,
    primerApellido: optionalString,
    segundoApellido: optionalString,
    razonSocial: optionalString,
    fechaNacimiento: optionalString,
    pais: requiredString("Pais"),
    region: requiredString("Region"),
    ciudad: requiredString("Ciudad"),
    direccion: requiredString("Direccion"),
    indicativo: optionalString,
    celular: optionalString,
    telefonoFijo: optionalString,
    genero,
  }).passthrough().superRefine((data, ctx) => {
    if (data.tipo_cliente === "personal" && (!data.primerNombre || !data.primerApellido)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primerNombre"],
        message: "Nombre y apellido son requeridos para cliente personal",
      });
    }

    if (data.tipo_cliente === "empresarial" && !data.razonSocial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["razonSocial"],
        message: "Razon social es requerida para cliente empresarial",
      });
    }
  }),
  actualizarPerfil: z.object({
    id: requiredNumber("Cliente"),
    nombre: requiredString("Nombre"),
    email,
    genero,
    direccion: optionalString,
    ciudad: optionalString,
    region: optionalString,
    celular: optionalString,
  }).passthrough(),
  actualizarAdmin: z.object({
    primer_nombre: optionalString,
    segundo_nombre: optionalString,
    primer_apellido: optionalString,
    segundo_apellido: optionalString,
    correo: email,
    tipo_cliente: z.enum(["personal", "empresarial"]).optional(),
    pais: optionalString,
    region: optionalString,
    ciudad: optionalString,
    direccion: optionalString,
    indicativo: optionalString,
    celular: optionalString,
    telefono_fijo: optionalString,
    genero,
    nombre_empresa: optionalString,
    tipo_identificacion: optionalString,
    numero_identificacion: optionalString,
  }).passthrough(),
};

export const destinatarioSchemas = {
  crear: z.object({
    cliente_id: requiredNumber("Cliente"),
    nombre: requiredString("Nombre"),
    direccion: requiredString("Direccion"),
    pais: requiredString("Pais"),
    departamento: requiredString("Departamento"),
    ciudad: requiredString("Ciudad"),
    telefono: requiredString("Telefono"),
    pais_id: optionalNumber,
    region_id: optionalNumber,
    ciudad_id: optionalNumber,
  }).passthrough(),
  editar: z.object({
    nombre: requiredString("Nombre"),
    direccion: requiredString("Direccion"),
    pais: requiredString("Pais"),
    departamento: requiredString("Departamento"),
    ciudad: requiredString("Ciudad"),
    telefono: optionalString,
    pais_id: optionalNumber,
    region_id: optionalNumber,
    ciudad_id: optionalNumber,
  }).passthrough(),
};

export const trmSchemas = {
  guardar: z.object({
    fecha: optionalString,
    valor: requiredNumber("Valor TRM").positive("Valor TRM debe ser mayor a cero"),
  }).passthrough(),
};

export const paqueteSchemas = {
  registrar: z.object({
    tracking: requiredString("Tracking"),
    codigo_referencia: requiredString("Codigo de referencia"),
    contenido: requiredString("Contenido"),
    peso: requiredNumber("Peso").positive("Peso debe ser mayor a cero"),
    servicio_id: requiredNumber("Servicio").int().positive("Servicio invalido"),
    destinatario_id: requiredNumber("Destinatario").int().positive("Destinatario invalido"),
    referencia: optionalString,
    tienda: optionalString,
    digitado_por: optionalString,
    ancho: optionalNumber,
    alto: optionalNumber,
    largo: optionalNumber,
    asegurado: optionalNumber,
    declaracion_valor: optionalNumber,
    ubicacion: optionalString,
    posicion_arancelaria: optionalString,
    agrupado: optionalString,
    notas: optionalString,
  }).passthrough(),
  editar: z.object({
    tracking: requiredString("Tracking"),
    codigo_referencia: requiredString("Codigo de referencia"),
    contenido: requiredString("Contenido"),
    peso: requiredNumber("Peso").positive("Peso debe ser mayor a cero"),
    servicio_id: requiredNumber("Servicio").int().positive("Servicio invalido"),
    destinatario_id: requiredNumber("Destinatario").int().positive("Destinatario invalido"),
    referencia: optionalString,
    tienda: optionalString,
    digitado_por: optionalString,
    ancho: optionalNumber,
    alto: optionalNumber,
    largo: optionalNumber,
    declaracion_valor: optionalNumber,
    ubicacion: optionalString,
    posicion_arancelaria: optionalString,
    agrupado: optionalString,
    notas: optionalString,
  }).passthrough(),
  editarBasico: z.object({
    tracking: requiredString("Tracking"),
    contenido: requiredString("Contenido"),
    notas: optionalString,
  }).passthrough(),
  buscar: z.object({
    guia: optionalString,
    referencia: optionalString,
    contenido: optionalString,
    notas: optionalString,
    cliente: optionalString,
    usuario: optionalString,
    fechaDesde: optionalString,
    fechaHasta: optionalString,
  }).passthrough(),
  reporteEstadoGuia: z.object({
    fechaDesde: optionalString,
    fechaHasta: optionalString,
    oficina_id: optionalNumber,
    punto_control_id: optionalNumber,
    estado_id: optionalNumber,
  }).passthrough(),
  anular: z.object({
    responsable: optionalString,
  }).passthrough(),
  estadoTracking: z.object({
    hawb: requiredString("HAWB"),
    estado: requiredString("Estado"),
    punto_control: requiredString("Punto de control"),
    observaciones: optionalString,
    responsable: optionalString,
  }).passthrough(),
  editarEstado: z.object({
    estado: requiredString("Estado"),
    punto_control: requiredString("Punto de control"),
    observaciones: optionalString,
    responsable: optionalString,
  }).passthrough(),
};

const paqueteSolicitud = z.object({
  id: requiredNumber("Paquete").int().positive("Paquete invalido"),
  asegurado: optionalNumber,
}).passthrough();

export const solicitudSchemas = {
  reporte: z.object({
    fechaDesde: optionalString,
    fechaHasta: optionalString,
    desbloqueo: z.enum(["todas", "desbloqueadas", "sin_desbloquear"]).optional().default("todas"),
  }).passthrough(),
  crear: z.object({
    cliente_id: requiredNumber("Cliente").int().positive("Cliente invalido"),
    usuario_id: requiredNumber("Usuario").int().positive("Usuario invalido"),
    paquetes: z.array(paqueteSolicitud).min(1, "Debe seleccionar al menos un paquete"),
    destinatario: requiredNumber("Destinatario").int().positive("Destinatario invalido"),
    medio_pago: optionalString,
    observaciones: optionalString,
  }).passthrough(),
  estado: z.object({
    estado: requiredString("Estado"),
  }).passthrough(),
  cargo: z.object({
    tipo_cargo: requiredString("Tipo de cargo"),
    valor_usd: requiredNumber("Valor USD"),
    valor_cop: requiredNumber("Valor COP"),
  }).passthrough(),
  actualizarPaquete: z.object({
    peso: requiredNumber("Peso").positive("Peso debe ser mayor a cero"),
    asegurado: optionalNumber,
    contenido: requiredString("Contenido"),
  }).passthrough(),
  agregarPaquete: z.object({
    paquete_id: requiredNumber("Paquete").int().positive("Paquete invalido"),
  }).passthrough(),
  editarCompleta: z.object({
    paquetes: z.array(z.object({
      paquete_id: requiredNumber("Paquete").int().positive("Paquete invalido"),
      peso: optionalNumber,
      asegurado: optionalNumber,
      contenido: optionalString,
    }).passthrough()).optional(),
    cargos: z.array(z.object({
      id: optionalNumber,
      tipo_cargo: optionalString,
      valor_usd: optionalNumber,
      valor_cop: optionalNumber,
    }).passthrough()).optional(),
    destinatario: optionalNumber,
  }).passthrough().refine(
    (data) => data.paquetes !== undefined || data.cargos !== undefined || data.destinatario !== undefined,
    "No se enviaron datos para actualizar"
  ),
  agrupar: z.object({
    hawbs: z.array(requiredString("HAWB")).min(2, "Debe seleccionar al menos 2 paquetes"),
  }).passthrough(),
};

export const despachoSchemas = {
  buscar: z.object({
    q: optionalString,
    id: optionalNumber,
    codigo: optionalString,
    nombre: optionalString,
    oficina_id: optionalNumber,
    transportadora_id: optionalNumber,
    estado: z.enum(["abierto", "cerrado"]).optional(),
    fechaDesde: optionalString,
    fechaHasta: optionalString,
  }).passthrough(),
  crear: z.object({
    nombre: optionalString,
    observaciones: optionalString,
    oficina_id: optionalNumber,
    oficina: optionalString,
    transportadora_id: optionalNumber,
    fecha: optionalString,
    responsable: optionalString,
  }).passthrough(),
  editar: z.object({
    nombre: optionalString,
    observaciones: optionalString,
    oficina_id: optionalNumber,
    oficina: optionalString,
    transportadora_id: optionalNumber,
    fecha: optionalString,
  }).passthrough(),
  estado: z.object({
    estado: z.enum(["abierto", "cerrado"]),
  }).passthrough(),
  hawb: z.object({
    hawb: requiredString("HAWB"),
    responsable: optionalString,
  }).passthrough(),
};
