import { poolPromise, sql } from '../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { firmarToken } from '../middleware/auth.middleware.js';
import {
  buildClienteLoginResponse,
  buildClienteTokenPayload,
  buildUsuarioLoginResponse,
  buildUsuarioTokenPayload,
  getLoginExpiresIn,
} from '../utils/auth.helpers.js';
import { enviarEmailDesdePlantilla } from '../utils/email.service.js';

let passwordResetTableReady = false;

const asegurarTablaPasswordReset = async (pool) => {
  if (passwordResetTableReady) return;

  await pool.request().query(`
    IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.password_reset_tokens (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tipo_cuenta NVARCHAR(30) NOT NULL,
        cuenta_id INT NOT NULL,
        email NVARCHAR(180) NOT NULL,
        token_hash NVARCHAR(128) NOT NULL,
        expira_en DATETIME2 NOT NULL,
        usado BIT NOT NULL DEFAULT 0,
        fecha_creacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        fecha_uso DATETIME2 NULL
      );
    END;
  `);

  passwordResetTableReady = true;
};

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
        IF OBJECT_ID('dbo.plantillas_comunicacion', 'U') IS NULL
        BEGIN
          SELECT TOP 0
            CAST(NULL AS INT) AS id,
            CAST(NULL AS NVARCHAR(180)) AS email_remitente,
            CAST(NULL AS NVARCHAR(250)) AS asunto,
            CAST(NULL AS NVARCHAR(MAX)) AS cuerpo;
        END
        ELSE
        BEGIN
          SELECT TOP 1
            id,
            email_remitente,
            asunto,
            cuerpo
          FROM plantillas_comunicacion
          WHERE clave_evento = @clave_evento
            AND activo = 1
          ORDER BY fecha_actualizacion DESC, fecha_creacion DESC, id DESC;
        END
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
  const expiresIn = getLoginExpiresIn(mantenerSesion);
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
      const usuarioResponse = buildUsuarioLoginResponse(usuario);
      const token = firmarToken(buildUsuarioTokenPayload(usuario), expiresIn);

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

      const usuarioResponse = buildClienteLoginResponse(cliente);
      const token = firmarToken(buildClienteTokenPayload(cliente), expiresIn);

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
    await asegurarTablaPasswordReset(pool);

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

  if (!token || contrasena.length < 6) {
    return res.status(400).json({
      ok: false,
      mensaje: "Token y contrasena valida son requeridos.",
    });
  }

  try {
    const pool = await poolPromise;
    await asegurarTablaPasswordReset(pool);

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

