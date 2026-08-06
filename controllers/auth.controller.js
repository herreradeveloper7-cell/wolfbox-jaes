import { poolPromise, sql } from '../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { firmarToken } from '../middleware/auth.middleware.js';
import {
  buildClienteLoginResponse,
  buildClienteTokenPayload,
  buildUsuarioLoginResponse,
  buildUsuarioTokenPayload,
} from '../utils/auth.helpers.js';
import { enviarEmailDesdePlantilla } from '../utils/email.service.js';
import {
  clienteEstaActivo,
  MENSAJE_CLIENTE_INHABILITADO,
} from "../utils/cliente-estado.helpers.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  crearSesion,
  eliminarRefreshCookie,
  establecerRefreshCookie,
  leerRefreshCookie,
  rotarSesion,
  revocarSesionPorRefresh,
  revocarSesionesCuenta,
} from "../utils/session.service.js";
import { responderPasswordInvalida, validarPasswordNueva } from "../utils/password-policy.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const obtenerNombreCliente = (cliente) => {
  const nombre = [
    cliente.primer_nombre,
    cliente.segundo_nombre,
    cliente.primer_apellido,
    cliente.segundo_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombre || cliente.nombre_empresa || "Cliente";
};

const obtenerBaseFrontend = () =>
  (
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

const obtenerPermisosUsuario = async (pool, usuarioId) => {
  const result = await pool.request()
    .input("usuario_id", sql.Int, usuarioId)
    .query(`
      SELECT permiso
      FROM permisos_usuario
      WHERE usuario_id = @usuario_id
      ORDER BY permiso
    `);

  return result.recordset.map((item) => item.permiso);
};

const obtenerPlantillaPorEvento = async (pool, claveEvento) => {
  try {
    const result = await pool
      .request()
      .input("clave_evento", sql.NVarChar(120), claveEvento)
      .query(`
        SELECT TOP 1 id, email_remitente, asunto, cuerpo
        FROM plantillas_comunicacion
        WHERE clave_evento = @clave_evento
          AND activo = 1
        ORDER BY fecha_actualizacion DESC, fecha_creacion DESC, id DESC;
      `);

    return result.recordset[0] || null;
  } catch (error) {
    console.error("Error obteniendo plantilla por evento:", error);
    return null;
  }
};

const crearPlantillaFallbackRecuperacion = () => ({
  id: null,
  email_remitente: process.env.BREVO_DEFAULT_SENDER_EMAIL,
  asunto: "Restablece tu contraseña de JAES Cargo",
  cuerpo: `Hola {{cliente_nombre}},

Recibimos una solicitud para restablecer tu contraseña.

Ingresa al siguiente enlace para crear una nueva contraseña:
{{reset_url}}

Este enlace vence en {{expira_minutos}} minutos. Si no solicitaste este cambio, puedes ignorar este correo.`,
});

function generarCodigoReferencia(nombre) {
  const letras = nombre.trim().toUpperCase().slice(0, 3);
  const numeros = Math.floor(10000 + Math.random() * 90000);
  return `CO${letras}${numeros}`;
}

export const registrarUsuario = async (req, res) => {
  const { nombre, correo, contraseña, tipo_usuario, genero } = req.body;

  try {
    const pool = await poolPromise;

    const passwordValida = await validarPasswordNueva(contraseña, { email: correo, nombre });
    if (!passwordValida.ok) return responderPasswordInvalida(res, passwordValida);

    const correoExistente = await pool.request()
      .input('correo', sql.NVarChar, correo)
      .query('SELECT id FROM usuarios WHERE correo = @correo');

    if (correoExistente.recordset.length > 0) {
      return res.status(400).json({ mensaje: 'Correo ya registrado.' });
    }

    const hashContraseña = await bcrypt.hash(contraseña, 10);

    await pool.request()
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, correo)
      .input("contrasena", sql.VarChar, hashContraseña)
      .input("tipo_usuario", sql.VarChar, tipo_usuario)
      .input("genero", sql.VarChar, genero)
      .query(`
        INSERT INTO usuarios (nombre, correo, contrasena, tipo_usuario, genero, estado)
        VALUES (@nombre, @correo, @contrasena, @tipo_usuario, @genero, 'activo')
      `);

    return res.json({ mensaje: "✅ Usuario registrado correctamente" });

  } catch (error) {
    console.error("❌ Error al registrar usuario:", error);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
};

export const loginGeneral = async (req, res) => {
  const { email, contrasena, mantenerSesion } = req.body;
  const startedAt = Date.now();
  const marca = (label) => {
    if (process.env.LOG_AUTH_TIMING === "1") {
      console.log(`[auth/login] ${label}: ${Date.now() - startedAt}ms`);
    }
  };

  try {
    const pool = await poolPromise;
    marca("pool listo");

    const resultUsuario = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT * FROM usuarios 
        WHERE correo = @email
      `);
    marca("consulta usuario");

    const usuario = resultUsuario.recordset[0];

    if (usuario) {
      const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
      marca("bcrypt usuario");
      
      if (!passwordMatch) {
        return res.status(401).json({ ok: false, message: "Correo o contraseña incorrectos" });
      }

      if (usuario.estado !== "activo") {
        return res.status(403).json({
          ok: false,
          message: "El usuario se encuentra inhabilitado ❌"
        });
      }

      usuario.permisos = await obtenerPermisosUsuario(pool, usuario.id);
      if (usuario.tipo_usuario === "admin" && process.env.MFA_ADMIN_REQUIRED === "1") {
        const configurado = Boolean(usuario.mfa_habilitado);
        const desafio_mfa = firmarToken({
          id: usuario.id,
          email: usuario.correo,
          tipo: "admin",
          mfa_scope: configurado ? "login" : "setup",
          mantenerSesion: Boolean(mantenerSesion),
        }, "5m");
        return res.status(200).json({
          ok: true,
          mfa_required: configurado,
          mfa_setup_required: !configurado,
          desafio_mfa,
        });
      }
      const usuarioResponse = buildUsuarioLoginResponse(usuario);
      const sesion = await crearSesion(pool, req, {
        tipoCuenta: "usuario",
        cuentaId: usuario.id,
        mantenerSesion: Boolean(mantenerSesion),
      });
      const token = firmarToken(
        { ...buildUsuarioTokenPayload(usuario), sid: sesion.id },
        ACCESS_TOKEN_EXPIRES_IN
      );
      establecerRefreshCookie(res, sesion.refreshToken, Boolean(mantenerSesion));

      return res.status(200).json({
        ok: true,
        message: "Login exitoso",
        token,
        usuario: usuarioResponse
      });
    }

    const resultCliente = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT * FROM clientes 
        WHERE correo = @email
      `);
    marca("consulta cliente");

    const cliente = resultCliente.recordset[0];

    if (cliente) {
      const passwordMatch = await bcrypt.compare(contrasena, cliente.contrasena);
      marca("bcrypt cliente");

      if (!passwordMatch) {
        return res.status(401).json({ ok: false, message: "Correo o contraseña incorrectos" });
      }

      if (!clienteEstaActivo(cliente)) {
        return res.status(403).json({
          ok: false,
          message: MENSAJE_CLIENTE_INHABILITADO,
        });
      }

      const usuarioResponse = buildClienteLoginResponse(cliente);
      const sesion = await crearSesion(pool, req, {
        tipoCuenta: "cliente",
        cuentaId: cliente.id,
        mantenerSesion: Boolean(mantenerSesion),
      });
      const token = firmarToken(
        { ...buildClienteTokenPayload(cliente), sid: sesion.id },
        ACCESS_TOKEN_EXPIRES_IN
      );
      establecerRefreshCookie(res, sesion.refreshToken, Boolean(mantenerSesion));

      return res.status(200).json({
        ok: true,
        message: "Login exitoso",
        token,
        usuario: usuarioResponse
      });
    }

    return res.status(401).json({
      ok: false,
      message: "Correo o contraseña incorrectos"
    });

  } catch (error) {
    console.error("❌ Error en loginGeneral:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
};

export const renovarSesion = async (req, res) => {
  try {
    const pool = await poolPromise;
    const sesion = await rotarSesion(pool, leerRefreshCookie(req));

    if (!sesion) {
      eliminarRefreshCookie(res);
      return res.status(401).json({ ok: false, message: "Sesion invalida o expirada" });
    }

    let cuenta;
    let usuarioResponse;
    let payload;

    if (sesion.tipo_cuenta === "usuario") {
      const result = await pool.request()
        .input("id", sql.Int, sesion.cuenta_id)
        .query("SELECT TOP 1 * FROM usuarios WHERE id = @id AND estado = 'activo'");
      cuenta = result.recordset[0];
      if (cuenta) cuenta.permisos = await obtenerPermisosUsuario(pool, cuenta.id);
      usuarioResponse = cuenta ? buildUsuarioLoginResponse(cuenta) : null;
      payload = cuenta ? buildUsuarioTokenPayload(cuenta) : null;
    } else {
      const result = await pool.request()
        .input("id", sql.Int, sesion.cuenta_id)
        .query("SELECT TOP 1 * FROM clientes WHERE id = @id AND estado = 'activo'");
      cuenta = result.recordset[0];
      usuarioResponse = cuenta ? buildClienteLoginResponse(cuenta) : null;
      payload = cuenta ? buildClienteTokenPayload(cuenta) : null;
    }

    if (!cuenta) {
      eliminarRefreshCookie(res);
      return res.status(401).json({ ok: false, message: "Sesion invalida o expirada" });
    }

    const mantenerSesion = new Date(sesion.expira_en).getTime() - Date.now() > 24 * 60 * 60 * 1000;
    establecerRefreshCookie(res, sesion.refreshToken, mantenerSesion);
    const token = firmarToken({ ...payload, sid: sesion.id }, ACCESS_TOKEN_EXPIRES_IN);
    return res.json({ ok: true, token, usuario: usuarioResponse });
  } catch (error) {
    console.error("Error renovando sesion:", error);
    return res.status(500).json({ ok: false, message: "No fue posible renovar la sesion" });
  }
};

export const cerrarSesion = async (req, res) => {
  try {
    const pool = await poolPromise;
    await revocarSesionPorRefresh(pool, leerRefreshCookie(req));
  } catch (error) {
    console.error("Error cerrando sesion:", error);
  } finally {
    eliminarRefreshCookie(res);
  }

  return res.status(204).send();
};

export const solicitarRecuperacionPassword = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const respuestaGenerica = {
    ok: true,
    mensaje: "Si el correo esta registrado, recibiras las instrucciones para restablecer tu contrasena.",
  };

  if (!email) {
    return res.status(400).json({ ok: false, mensaje: "Correo requerido." });
  }

  try {
    const pool = await poolPromise;

    const usuarioResult = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT TOP 1 id, nombre, correo
        FROM usuarios
        WHERE LOWER(correo) = @email
          AND ISNULL(estado, 'activo') = 'activo'
      `);

    let cuenta = usuarioResult.recordset[0];
    let tipoCuenta = "usuario";
    let nombre = cuenta?.nombre;

    if (!cuenta) {
      const clienteResult = await pool
        .request()
        .input("email", sql.VarChar, email)
        .query(`
          SELECT TOP 1
            id,
            correo,
            primer_nombre,
            segundo_nombre,
            primer_apellido,
            segundo_apellido,
            nombre_empresa
          FROM clientes
          WHERE LOWER(correo) = @email
            AND estado = 'activo'
        `);

      cuenta = clienteResult.recordset[0];
      tipoCuenta = "cliente";
      nombre = cuenta ? obtenerNombreCliente(cuenta) : "";
    }

    if (!cuenta) {
      return res.json(respuestaGenerica);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiraMinutos = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 60);
    const expiraEn = new Date(Date.now() + expiraMinutos * 60 * 1000);

    await pool
      .request()
      .input("tipo_cuenta", sql.NVarChar(30), tipoCuenta)
      .input("cuenta_id", sql.Int, cuenta.id)
      .query(`
        UPDATE password_reset_tokens
        SET usado = 1,
            fecha_uso = SYSUTCDATETIME()
        WHERE tipo_cuenta = @tipo_cuenta
          AND cuenta_id = @cuenta_id
          AND usado = 0
      `);

    await pool
      .request()
      .input("tipo_cuenta", sql.NVarChar(30), tipoCuenta)
      .input("cuenta_id", sql.Int, cuenta.id)
      .input("email", sql.NVarChar(180), cuenta.correo)
      .input("token_hash", sql.NVarChar(128), tokenHash)
      .input("expira_en", sql.DateTime2, expiraEn)
      .query(`
        INSERT INTO password_reset_tokens (
          tipo_cuenta, cuenta_id, email, token_hash, expira_en
        )
        VALUES (
          @tipo_cuenta, @cuenta_id, @email, @token_hash, @expira_en
        )
      `);

    const plantilla =
      (await obtenerPlantillaPorEvento(pool, "recuperacion_password")) ||
      crearPlantillaFallbackRecuperacion();
    const resetUrl = `${obtenerBaseFrontend()}/password-reset?token=${token}`;

    await enviarEmailDesdePlantilla({
      plantilla,
      destinatarios: [{ email: cuenta.correo, name: nombre }],
      variables: {
        cliente_nombre: nombre || "Usuario",
        email: cuenta.correo,
        reset_url: resetUrl,
        expira_minutos: expiraMinutos,
      },
      evento: "recuperacion_password",
    });

    return res.json(respuestaGenerica);
  } catch (error) {
    console.error("Error solicitando recuperacion de password:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "No fue posible procesar la solicitud de recuperacion.",
    });
  }
};

export const confirmarRecuperacionPassword = async (req, res) => {
  const token = String(req.body.token || "").trim();
  const contrasena = String(req.body.contrasena || "");

  if (!token) {
    return res.status(400).json({
      ok: false,
      mensaje: "Token y contraseña válida son requeridos.",
    });
  }

  try {
    const pool = await poolPromise;

    const passwordValida = await validarPasswordNueva(contrasena);
    if (!passwordValida.ok) return responderPasswordInvalida(res, passwordValida);

    const tokenHash = hashToken(token);
    const tokenResult = await pool
      .request()
      .input("token_hash", sql.NVarChar(128), tokenHash)
      .query(`
        SELECT TOP 1 id, tipo_cuenta, cuenta_id
        FROM password_reset_tokens
        WHERE token_hash = @token_hash
          AND usado = 0
          AND expira_en > SYSUTCDATETIME()
        ORDER BY fecha_creacion DESC
      `);

    const reset = tokenResult.recordset[0];

    if (!reset) {
      return res.status(400).json({
        ok: false,
        mensaje: "El enlace es invalido o ya expiro.",
      });
    }

    if (reset.tipo_cuenta === "cliente") {
      const clienteResult = await pool
        .request()
        .input("id", sql.Int, reset.cuenta_id)
        .query("SELECT TOP 1 estado FROM clientes WHERE id = @id");

      if (!clienteEstaActivo(clienteResult.recordset[0])) {
        return res.status(400).json({
          ok: false,
          mensaje: "El enlace es invalido o ya expiro.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    if (reset.tipo_cuenta === "usuario") {
      await pool
        .request()
        .input("id", sql.Int, reset.cuenta_id)
        .input("contrasena", sql.VarChar, hashedPassword)
        .query(`
          UPDATE usuarios
          SET contrasena = @contrasena
          WHERE id = @id
        `);
    } else {
      await pool
        .request()
        .input("id", sql.Int, reset.cuenta_id)
        .input("contrasena", sql.VarChar, hashedPassword)
        .query(`
          UPDATE clientes
          SET contrasena = @contrasena
          WHERE id = @id
        `);
    }


    await revocarSesionesCuenta(
      pool,
      reset.tipo_cuenta,
      reset.cuenta_id,
      "contrasena_actualizada"
    );

    await pool
      .request()
      .input("id", sql.Int, reset.id)
      .query(`
        UPDATE password_reset_tokens
        SET usado = 1,
            fecha_uso = SYSUTCDATETIME()
        WHERE id = @id
      `);

    return res.json({
      ok: true,
      mensaje: "Contrasena actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error confirmando recuperacion de password:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "No fue posible actualizar la contrasena.",
    });
  }
};

