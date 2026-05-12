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

  try {
    const pool = await poolPromise;

    const resultUsuario = await pool.request()
      .input("email", sql.VarChar, email)
      .query(`
        SELECT * FROM usuarios 
        WHERE correo = @email
      `);

    const usuario = resultUsuario.recordset[0];

    if (usuario) {
      const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
      
      if (!passwordMatch) {
        return res.status(401).json({ ok: false, message: "Contraseña incorrecta" });
      }

      if (usuario.estado !== "activo") {
        return res.status(403).json({
          ok: false,
          message: "El usuario se encuentra inhabilitado ❌"
        });
      }

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

    const cliente = resultCliente.recordset[0];

    if (cliente) {
      const passwordMatch = await bcrypt.compare(contrasena, cliente.contrasena);

      if (!passwordMatch) {
        return res.status(401).json({ ok: false, message: "Contraseña incorrecta" });
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

    return res.status(404).json({
      ok: false,
      message: "Correo no encontrado"
    });

  } catch (error) {
    console.error("❌ Error en loginGeneral:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor"
    });
  }
};

