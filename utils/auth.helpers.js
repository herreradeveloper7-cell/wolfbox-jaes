export const getLoginExpiresIn = (mantenerSesion) => (mantenerSesion ? "30d" : "8h");

export const buildUsuarioLoginResponse = (usuario) => ({
  id: usuario.id,
  nombre: usuario.nombre,
  email: usuario.correo,
  tipo: usuario.tipo_usuario,
  genero: usuario.genero,
  fecha_creacion: usuario.fecha_creacion,
  permisos: Array.isArray(usuario.permisos) ? usuario.permisos : [],
});

export const buildUsuarioTokenPayload = (usuario) => ({
  id: usuario.id,
  email: usuario.correo,
  tipo: usuario.tipo_usuario,
  permisos: Array.isArray(usuario.permisos) ? usuario.permisos : [],
});

export const buildClienteLoginResponse = (cliente) => ({
  id: cliente.id,
  nombre: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
  email: cliente.correo,
  codigoReferencia: cliente.codigo_referencia,
  genero: cliente.genero,
  tipo: "cliente",
});

export const buildClienteTokenPayload = (cliente) => ({
  id: cliente.id,
  email: cliente.correo,
  tipo: "cliente",
  codigoReferencia: cliente.codigo_referencia,
});
