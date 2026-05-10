import { poolPromise, sql } from "../config/db.js";
import bcrypt from "bcrypt";

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

    if (Array.isArray(permisos) && permisos.length > 0) {
      for (const permiso of permisos) {
        await pool.request()
          .input("usuario_id", sql.Int, usuarioId)
          .input("permiso", sql.VarChar, permiso)
          .query(`
            INSERT INTO permisos_usuario (usuario_id, permiso)
            VALUES (@usuario_id, @permiso)
          `);
      }
    }

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

    let queryUpdatePassword = "";
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      queryUpdatePassword = `, contrasena='${hashed}'`;
    }

    await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, email)
      .input("tipo_usuario", sql.VarChar, tipo_usuario)
      .input("genero", sql.VarChar, genero)
      .query(`
        UPDATE usuarios SET 
          nombre = @nombre,
          correo = @correo,
          tipo_usuario = @tipo_usuario,
          genero = @genero
          ${queryUpdatePassword}
        WHERE id = @id
      `);

    await pool.request()
      .input("usuario_id", sql.Int, id)
      .query(`DELETE FROM permisos_usuario WHERE usuario_id = @usuario_id`);

    if (Array.isArray(permisos) && permisos.length > 0) {
      for (const permiso of permisos) {
        await pool.request()
          .input("usuario_id", sql.Int, id)
          .input("permiso", sql.VarChar, permiso)
          .query(`
            INSERT INTO permisos_usuario (usuario_id, permiso)
            VALUES (@usuario_id, @permiso)
          `);
      }
    }

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

    if (Array.isArray(permisos) && permisos.length > 0) {
      for (const permiso of permisos) {
        await pool.request()
          .input("usuario_id", sql.Int, id)
          .input("permiso", sql.VarChar, permiso)
          .query(`
            INSERT INTO permisos_usuario(usuario_id, permiso)
            VALUES (@usuario_id, @permiso)
          `);
      }
    }

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








