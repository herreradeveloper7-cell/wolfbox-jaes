import { sql, poolPromise } from '../config/db.js';
import bcrypt from 'bcrypt';

function generarCodigoReferencia(texto) {
  const letras = texto.trim().toUpperCase().slice(0, 3);
  const numeros = Math.floor(10000 + Math.random() * 90000);
  return `JACO${letras}${numeros}`;
}


export const validarClienteExistente = async (req, res) => {
  const { email, numeroIdentificacion } = req.body;
  try {
    const pool = await poolPromise;
    const resultado = await pool.request()
      .input("email", sql.NVarChar, email)
      .input("id", sql.NVarChar, numeroIdentificacion)
      .query("SELECT * FROM clientes WHERE email = @email OR numero_identificacion = @id");

    if (resultado.recordset.length > 0) {
      return res.status(200).json({ ok: false });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    res.status(500).json({ ok: false, error: "Error de validación" });
  }
};

export const registrarCliente = async (req, res) => {
  try {
    const {
      razonSocial,
      tipoIdentificacion,
      numeroIdentificacion,
      primerNombre,
      segundoNombre,
      primerApellido,
      segundoApellido,
      email,
      contrasena,
      fechaNacimiento,
      pais,
      region,
      ciudad,
      direccion,
      indicativo,
      celular,
      telefonoFijo,
      genero,
      tipo_cliente
    } = req.body;

    console.log("Tipo de cliente recibido:", tipo_cliente); 

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    let codigoReferencia = "";

    if (tipo_cliente === "personal") {
      codigoReferencia = generarCodigoReferencia(primerNombre);
    }

    if (tipo_cliente === "empresarial") {
      codigoReferencia = generarCodigoReferencia(razonSocial);
    }
    const pool = await poolPromise;

    await pool.request()
      .input('tipoIdentificacion', sql.VarChar, tipoIdentificacion)
      .input('numeroIdentificacion', sql.VarChar, numeroIdentificacion)
      .input('primerNombre', sql.VarChar, primerNombre)
      .input('segundoNombre', sql.VarChar, segundoNombre)
      .input('primerApellido', sql.VarChar, primerApellido)
      .input('segundoApellido', sql.VarChar, segundoApellido)
      .input('email', sql.VarChar, email)
      .input('contrasena', sql.VarChar, hashedPassword)
      .input('fechaNacimiento', sql.Date, fechaNacimiento)
      .input('pais', sql.VarChar, pais)
      .input('region', sql.VarChar, region)
      .input('ciudad', sql.VarChar, ciudad)
      .input('direccion', sql.VarChar, direccion)
      .input('indicativo', sql.VarChar, indicativo)
      .input('celular', sql.VarChar, celular)
      .input('telefonoFijo', sql.VarChar, telefonoFijo)
      .input('genero', sql.VarChar, genero)
      .input('nombre_empresa', sql.NVarChar, razonSocial)
      .input('codigoReferencia', sql.VarChar, codigoReferencia)
      .input('tipo_cliente', sql.VarChar, tipo_cliente) 
      .query(`
        INSERT INTO clientes (
          tipo_identificacion, numero_identificacion, primer_nombre, segundo_nombre,
          primer_apellido, segundo_apellido, email, contrasena,
          fecha_nacimiento, pais, region, ciudad, direccion,
          indicativo, celular, telefono_fijo, genero, nombre_empresa,
          codigo_referencia, tipo_cliente
        )
        VALUES (
          @tipoIdentificacion, @numeroIdentificacion, @primerNombre, @segundoNombre,
          @primerApellido, @segundoApellido, @email, @contrasena,
          @fechaNacimiento, @pais, @region, @ciudad, @direccion,
          @indicativo, @celular, @telefonoFijo, @genero, @nombre_empresa,
          @codigoReferencia, @tipo_cliente
        )
      `);

    res.status(201).json({ 
      message: 'Cliente registrado correctamente',
      codigoReferencia: codigoReferencia
    });

  } catch (error) {
    console.error('❌ Error al registrar cliente:', error);
    res.status(500).json({ message: 'Error al registrar cliente' });
  }
};


export const loginCliente = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM clientes WHERE email = @email');

    const cliente = result.recordset[0];

    if (!cliente) {
      return res.status(401).json({ ok: false, message: 'Correo no registrado' });
    }

    const passwordMatch = await bcrypt.compare(contrasena, cliente.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({ ok: false, message: 'Contraseña incorrecta' });
    }

    return res.status(200).json({
      ok: true,
      message: 'Inicio de sesión exitoso',
      cliente: {
        id: cliente.id,
        nombre: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
        email: cliente.email,
        codigoReferencia: cliente.codigo_referencia,
        genero: cliente.genero,
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        region: cliente.region,
        celular: cliente.celular,
        tipo: cliente.tipo_usuario
      }
    });

  } catch (error) {
    console.error('❌ Error en loginCliente:', error);
    return res.status(500).json({ ok: false, message: 'Error al iniciar sesión' });
  }
};

export const actualizarPerfilCliente = async (req, res) => {
  try {
    const { id, nombre, email, genero, direccion, ciudad, region, celular } = req.body;

    const pool = await poolPromise;
    await pool.request()
    .input("id", sql.Int, id)
    .input("nombre", sql.NVarChar, nombre)
    .input("email", sql.NVarChar, email)
    .input("genero", sql.VarChar, genero)
    .input("direccion", sql.NVarChar, direccion)
    .input("ciudad", sql.NVarChar, ciudad)
    .input("region", sql.NVarChar, region)
    .input("celular", sql.NVarChar, celular)
      .query(`
        UPDATE clientes
        SET 
        primer_nombre = @nombre,
        email = @email,
        genero = @genero,
        direccion = @direccion,
        ciudad = @ciudad,
        region = @region,
        celular = @celular
        WHERE id = @id
      `);

    res.status(200).json({ ok: true, message: "Perfil actualizado correctamente" });

  } catch (err) {
    console.error("Error al actualizar perfil:", err);
    res.status(500).json({ ok: false, message: "Error al actualizar perfil" });
  }
};

export const buscarCliente = async (req, res) => {
  try {
    const { valor } = req.params;

    const pool = await poolPromise;
    const busqueda = `%${valor}%`;

    const result = await pool.request()
      .input("valor", sql.VarChar, busqueda)
      .query(`
        SELECT 
          id, 
          ISNULL(CONCAT(primer_nombre, ' ', primer_apellido), nombre_empresa) AS nombre,
          codigo_referencia, 
          email AS correo, 
          celular AS telefono
        FROM clientes
        WHERE 
          codigo_referencia LIKE @valor
          OR primer_nombre LIKE @valor
          OR primer_apellido LIKE @valor
          OR nombre_empresa LIKE @valor
      `);

    return res.json({
      ok: true,
      clientes: result.recordset
    });

  } catch (error) {
    console.error("❌ Error al buscar cliente:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno del servidor"
    });
  }
};


export const buscarClienteDestinatarios = async (req, res) => {
  try {
    const { texto } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("texto", `%${texto}%`)
      .query(`
        SELECT TOP 10 
          id, 
          ISNULL(CONCAT(primer_nombre, ' ', primer_apellido), nombre_empresa) AS nombre,
          codigo_referencia
        FROM clientes
        WHERE 
          primer_nombre LIKE @texto
          OR primer_apellido LIKE @texto
          OR nombre_empresa LIKE @texto
          OR codigo_referencia LIKE @texto
        ORDER BY nombre ASC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.log("❌ Error buscando cliente (destinatarios):", error);
    res.status(500).json({ ok: false, msg: "Error buscando cliente" });
  }
};


