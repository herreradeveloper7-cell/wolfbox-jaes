import { poolPromise, sql } from "../config/db.js";
import bcrypt from "bcrypt";
import {
  enviarEmailDesdePlantilla,
  obtenerPlantillaEmailPorEvento,
} from "../utils/email.service.js";

const WHATSAPP_SERVICIO = "+57 302 8600369";
const WHATSAPP_SERVICIO_URL = "https://wa.me/573028600369";

const obtenerBaseFrontend = () =>
  (
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

const crearPlantillaFallbackAperturaUsuario = () => ({
  id: null,
  email_remitente: process.env.BREVO_DEFAULT_SENDER_EMAIL,
  asunto: "Tu usuario Wolfbox fue creado",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 24px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox - JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Tu usuario fue creado
        </h1>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, ya tienes acceso al sistema.
        </p>
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:14px;margin:14px 0;">
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            <strong>Correo:</strong> {{email}}<br />
            <strong>Tipo de cuenta:</strong> {{tipo_cuenta}}
          </p>
        </div>
        <a href="{{login_url}}" style="display:inline-block;background:#7f1d1d;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;border-radius:12px;padding:12px 18px;">
          Ingresar a Wolfbox
        </a>
      </div>
    </div>
    <p style="text-align:center;margin:14px 0 0;color:#9ca3af;font-size:11px;">
      JAES Cargo Internacional - Notificacion automatica
    </p>
  </div>
</div>`,
});

const enviarCorreoAperturaUsuario = async ({ email, nombre, tipo }) => {
  const plantilla =
    (await obtenerPlantillaEmailPorEvento("apertura_cuenta")) ||
    crearPlantillaFallbackAperturaUsuario();

  await enviarEmailDesdePlantilla({
    plantilla,
    destinatarios: [{ email, name: nombre }],
    variables: {
      cliente_nombre: nombre,
      email,
      codigo_casillero: "",
      tipo_cuenta: tipo || "usuario",
      login_url: `${obtenerBaseFrontend()}/login`,
      whatsapp_servicio: WHATSAPP_SERVICIO,
      whatsapp_url: WHATSAPP_SERVICIO_URL,
    },
    evento: "apertura_cuenta",
  });
};

const permisosPorRol = {
  admin: [
    "Casilleros",
    "Operaciones",
    "Tracking",
    "Reportes",
    "Seguridad",
    "Configuracion",
    "Perfil",
  ],
  usuario: ["Casilleros", "Operaciones", "Tracking", "Perfil"],
};

const todosLosPermisos = [
  "Casilleros",
  "Operaciones",
  "Tracking",
  "Reportes",
  "Seguridad",
  "Configuracion",
  "Perfil",
];

const obtenerPermisosPorRol = (rol) => permisosPorRol[rol] || [];

const normalizarPermisosUsuario = (rol, permisos) => {
  const permisosRecibidos = Array.isArray(permisos) ? permisos : [];
  const permisosValidos = permisosRecibidos.filter((permiso) =>
    todosLosPermisos.includes(permiso)
  );

  return permisosValidos.length > 0 ? permisosValidos : obtenerPermisosPorRol(rol);
};

const guardarPermisosUsuario = async (pool, usuarioId, rol, permisosSeleccionados) => {
  const permisos = normalizarPermisosUsuario(rol, permisosSeleccionados);

  for (const permiso of permisos) {
    await pool.request()
      .input("usuario_id", sql.Int, usuarioId)
      .input("permiso", sql.VarChar, permiso)
      .query(`
        INSERT INTO permisos_usuario (usuario_id, permiso)
        VALUES (@usuario_id, @permiso)
      `);
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, tipo, permisos, genero } = req.body;

    const pool = await poolPromise; 

    const existe = await pool.request()
      .input("correo", sql.VarChar, email)
      .query("SELECT * FROM usuarios WHERE correo = @correo");

    if (existe.recordset.length > 0) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUser = await pool.request()
        .input("nombre", sql.VarChar, nombre)
        .input("correo", sql.VarChar, email)
        .input("contrasena", sql.VarChar, hashedPassword)
        .input("tipo_usuario", sql.VarChar, tipo)
        .input("genero", sql.VarChar, genero)
        .query(`
        INSERT INTO usuarios (nombre, correo, contrasena, tipo_usuario, genero, estado)
        OUTPUT INSERTED.id VALUES (@nombre, @correo, @contrasena, @tipo_usuario, @genero, 'activo')
      `);

    const usuarioId = insertUser.recordset[0].id;

    await guardarPermisosUsuario(pool, usuarioId, tipo, permisos);

    enviarCorreoAperturaUsuario({
      email,
      nombre,
      tipo,
    }).catch((mailError) => {
      console.error("Error enviando correo de apertura de usuario:", mailError);
    });

    return res.json({
      mensaje: "✅ Usuario creado correctamente",
      usuarioId
    });

  } catch (error) {
    console.error("❌ Error en crearUsuario:", error);
    res.status(500).json({ mensaje: "Error al crear usuario" });
  }
};

export const validarEmail = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.json({ existe: false });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("correo", sql.VarChar, email)
      .query("SELECT id FROM usuarios WHERE correo = @correo");

    return res.json({ existe: result.recordset.length > 0 });

  } catch (error) {
    return res.status(500).json({
      mensaje: "Error al validar email"
    });
  }
};

export const obtenerUsuariosSistema = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT id, nombre, correo, tipo_usuario, genero, estado, fecha_creacion
        FROM usuarios
        WHERE tipo_usuario IN ('admin', 'usuario')
      `);

    return res.json(result.recordset);

  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
};

export const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const resultUsuario = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id, nombre, correo, tipo_usuario, genero, estado, fecha_creacion
        FROM usuarios
        WHERE id = @id
      `);

    if (resultUsuario.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const usuario = resultUsuario.recordset[0];

    const resultPermisos = await pool.request()
      .input("usuario_id", sql.Int, id)
      .query(`
        SELECT permiso
        FROM permisos_usuario
        WHERE usuario_id = @usuario_id
      `);

    usuario.permisos = resultPermisos.recordset.map(p => p.permiso);

    return res.json(usuario);

  } catch (error) {
    console.error("❌ Error al obtener usuario por id:", error);
    res.status(500).json({ mensaje: "Error de servidor" });
  }
};


export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, tipo_usuario, genero, permisos, password } = req.body;

    const pool = await poolPromise;

    const checkEmail = await pool.request()
      .input("correo", sql.VarChar, email)
      .input("id", sql.Int, id)
      .query(`
        SELECT id FROM usuarios 
        WHERE correo = @correo AND id != @id
      `);

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ mensaje: "Este correo ya pertenece a otro usuario" });
    }

    let hashedPassword = null;
    if (password && password.trim() !== "") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, email)
      .input("tipo_usuario", sql.VarChar, tipo_usuario)
      .input("genero", sql.VarChar, genero)
      .input("contrasena", sql.VarChar, hashedPassword)
      .query(`
        UPDATE usuarios SET 
          nombre = @nombre,
          correo = @correo,
          tipo_usuario = @tipo_usuario,
          genero = @genero,
          contrasena = COALESCE(@contrasena, contrasena)
        WHERE id = @id
      `);

    await pool.request()
      .input("usuario_id", sql.Int, id)
      .query(`DELETE FROM permisos_usuario WHERE usuario_id = @usuario_id`);

    await guardarPermisosUsuario(pool, id, tipo_usuario, permisos);

    return res.json({ mensaje: "✅ Usuario actualizado correctamente" });

  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ mensaje: "Error al actualizar" });
  }
};

export const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, tipo_usuario, genero, permisos } = req.body;

    const pool = await poolPromise;

    const validarCorreo = await pool.request()
      .input("correo", sql.VarChar, email)
      .input("id", sql.Int, id)
      .query(`
        SELECT id FROM usuarios 
        WHERE correo = @correo AND id != @id
      `);

    if (validarCorreo.recordset.length > 0) {
      return res.status(400).json({ mensaje: "⚠ El correo ya está registrado por otro usuario" });
    }

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.request()
        .input("id", sql.Int, id)
        .input("nombre", sql.VarChar, nombre)
        .input("correo", sql.VarChar, email)
        .input("contrasena", sql.VarChar, hashedPassword)
        .input("tipo_usuario", sql.VarChar, tipo_usuario)
        .input("genero", sql.VarChar, genero)
        .query(`
          UPDATE usuarios
          SET nombre=@nombre, correo=@correo, contrasena=@contrasena,
              tipo_usuario=@tipo_usuario, genero=@genero
          WHERE id=@id
        `);
    } 
    else {
      await pool.request()
        .input("id", sql.Int, id)
        .input("nombre", sql.VarChar, nombre)
        .input("correo", sql.VarChar, email)
        .input("tipo_usuario", sql.VarChar, tipo_usuario)
        .input("genero", sql.VarChar, genero)
        .query(`
          UPDATE usuarios
          SET nombre=@nombre, correo=@correo,
              tipo_usuario=@tipo_usuario, genero=@genero
          WHERE id=@id
        `);
    }

    await pool.request()
      .input("usuario_id", sql.Int, id)
      .query(`DELETE FROM permisos_usuario WHERE usuario_id=@usuario_id`);

    await guardarPermisosUsuario(pool, id, tipo_usuario, permisos);

    return res.json({ mensaje: "✅ Usuario actualizado correctamente" });

  } catch (error) {
    console.error("❌ Error en editarUsuario:", error);
    res.status(500).json({ mensaje: "Error al actualizar usuario" });
  }
};

export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;

    await pool.request()
      .input("usuario_id", sql.Int, id)
      .query(`DELETE FROM permisos_usuario WHERE usuario_id=@usuario_id`);

    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM usuarios WHERE id=@id");

    return res.json({ mensaje: "✅ Usuario eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ mensaje: "Error al eliminar usuario" });
  }
};


export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input("id", sql.Int, id)
      .input("estado", sql.VarChar, estado)
      .query(`
        UPDATE usuarios SET estado=@estado WHERE id=@id
      `);

    return res.json({
      mensaje: estado === "activo" 
        ? "✅ Usuario habilitado correctamente"
        : "🚫 Usuario inhabilitado correctamente"
    });

  } catch (error) {
    console.error("❌ Error al cambiar estado:", error);
    res.status(500).json({ mensaje: "Error al cambiar estado" });
  }
};

export const obtenerUsuariosSelect = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, nombre
      FROM usuarios
      WHERE tipo_usuario IN ('admin', 'usuario')
        AND estado = 'activo'
      ORDER BY nombre
    `);

    return res.json({ ok: true, usuarios: result.recordset });
  } catch (error) {
    console.error("❌ Error obteniendo usuarios select:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al obtener usuarios" });
  }
};

export const buscarUsuarios = async (req, res) => {
  try {
    const { texto } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("texto", sql.VarChar, `%${texto}%`)
      .query(`
        SELECT TOP 10 
          id,
          nombre,
          correo,
          tipo_usuario
        FROM usuarios
        WHERE estado = 'activo'
          AND tipo_usuario IN ('admin', 'usuario')
          AND (
            nombre LIKE @texto
            OR correo LIKE @texto
          )
        ORDER BY nombre
      `);

    return res.json({
      ok: true,
      usuarios: result.recordset
    });

  } catch (error) {
    console.error("❌ Error buscando usuarios:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al buscar usuarios"
    });
  }
};








