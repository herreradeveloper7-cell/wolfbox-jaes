import { sql, poolPromise } from "../config/db.js";
import bcrypt from "bcrypt";
import { firmarToken } from "../middleware/auth.middleware.js";
import fs from "fs";
import path from "path";
import {
  enviarEmailDesdePlantilla,
  obtenerPlantillaEmailPorEvento,
} from "../utils/email.service.js";

const WHATSAPP_SERVICIO = "+57 302 8600369";
const WHATSAPP_SERVICIO_URL = "https://wa.me/573028600369";

function generarCodigoReferencia(texto) {
  const letras = (texto || "").trim().toUpperCase().slice(0, 3);
  const numeros = Math.floor(10000 + Math.random() * 90000);
  return `JACO${letras}${numeros}`;
}

const obtenerBaseFrontend = () =>
  (
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_FRONTEND_URL ||
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

const obtenerAdjuntoAperturaCuenta = () => {
  const rutaConfigurada =
    process.env.CUENTA_CREADA_PDF_PATH ||
    process.env.APERTURA_CUENTA_PDF_PATH ||
    "assets/correos/politicas-jaes-cargo-internacional.pdf";

  const rutaPdf = path.isAbsolute(rutaConfigurada)
    ? rutaConfigurada
    : path.resolve(rutaConfigurada);

  if (!fs.existsSync(rutaPdf)) {
    console.warn(`PDF de apertura de cuenta no encontrado: ${rutaPdf}`);
    return [];
  }

  return [
    {
      name: process.env.CUENTA_CREADA_PDF_NAME || path.basename(rutaPdf),
      content: fs.readFileSync(rutaPdf).toString("base64"),
    },
  ];
};

const crearPlantillaFallbackAperturaCuenta = () => ({
  id: null,
  email_remitente: process.env.BREVO_DEFAULT_SENDER_EMAIL,
  asunto: "Bienvenido a JAES Cargo",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 24px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox - JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Tu cuenta fue creada
        </h1>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, tu cuenta ya esta activa en nuestra plataforma.
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
      JAES Cargo Internacional - Notificacion automatica
    </p>
  </div>
</div>`,
});

const enviarCorreoAperturaCliente = async ({
  email,
  nombre,
  codigoReferencia,
  tipoCliente,
}) => {
  const plantilla =
    (await obtenerPlantillaEmailPorEvento("apertura_cuenta")) ||
    crearPlantillaFallbackAperturaCuenta();

  await enviarEmailDesdePlantilla({
    plantilla,
    destinatarios: [{ email, name: nombre }],
    variables: {
      cliente_nombre: nombre,
      email,
      codigo_casillero: codigoReferencia,
      tipo_cuenta: tipoCliente || "cliente",
      login_url: `${obtenerBaseFrontend()}/login`,
      whatsapp_servicio: WHATSAPP_SERVICIO,
      whatsapp_url: WHATSAPP_SERVICIO_URL,
    },
    evento: "apertura_cuenta",
    adjuntos: obtenerAdjuntoAperturaCuenta(),
  });
};

/* =======================================================
    1) VALIDAR CLIENTE EXISTENTE
======================================================= */
export const validarClienteExistente = async (req, res) => {
  const { email, numeroIdentificacion } = req.body;

  try {
    const pool = await poolPromise;

    const resultado = await pool
      .request()
      .input("correo", sql.VarChar, email)
      .input("numero_identificacion", sql.VarChar, numeroIdentificacion)
      .query(`
        SELECT TOP 1 id
        FROM clientes
        WHERE correo = @correo OR numero_identificacion = @numero_identificacion
      `);

    if (resultado.recordset.length > 0) {
      return res.status(200).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ validarClienteExistente ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

/* =======================================================
    2) REGISTRAR CLIENTE
======================================================= */
export const registrarCliente = async (req, res) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

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
      tipo_cliente,
    } = req.body;

    const hashedPassword = await bcrypt.hash(contrasena, 10);

    let codigoReferencia = "";
    if (tipo_cliente === "personal") {
      codigoReferencia = generarCodigoReferencia(primerNombre);
    } else {
      codigoReferencia = generarCodigoReferencia(razonSocial);
    }

    await transaction.begin();

    /* =====================================================
       1️⃣ Insertar cliente y obtener ID
    ===================================================== */
    const requestCliente = new sql.Request(transaction);

    const clienteResult = await requestCliente
      .input("tipo_identificacion", sql.VarChar, tipoIdentificacion)
      .input("numero_identificacion", sql.VarChar, numeroIdentificacion)
      .input("primer_nombre", sql.VarChar, primerNombre)
      .input("segundo_nombre", sql.VarChar, segundoNombre)
      .input("primer_apellido", sql.VarChar, primerApellido)
      .input("segundo_apellido", sql.VarChar, segundoApellido)
      .input("correo", sql.VarChar, email)
      .input("contrasena", sql.VarChar, hashedPassword)
      .input("fecha_nacimiento", sql.Date, fechaNacimiento)
      .input("pais", sql.VarChar, pais)
      .input("region", sql.VarChar, region)
      .input("ciudad", sql.VarChar, ciudad)
      .input("direccion", sql.VarChar, direccion)
      .input("indicativo", sql.VarChar, indicativo)
      .input("celular", sql.VarChar, celular)
      .input("telefono_fijo", sql.VarChar, telefonoFijo)
      .input("genero", sql.VarChar, genero)
      .input("nombre_empresa", sql.VarChar, razonSocial)
      .input("codigo_referencia", sql.VarChar, codigoReferencia)
      .input("tipo_cliente", sql.VarChar, tipo_cliente)
      .query(`
        INSERT INTO clientes (
          tipo_identificacion, numero_identificacion,
          primer_nombre, segundo_nombre,
          primer_apellido, segundo_apellido,
          correo, contrasena,
          fecha_nacimiento, pais, region, ciudad, direccion,
          indicativo, celular, telefono_fijo,
          genero, nombre_empresa, codigo_referencia, tipo_cliente
        )
        OUTPUT INSERTED.id
        VALUES (
          @tipo_identificacion, @numero_identificacion,
          @primer_nombre, @segundo_nombre,
          @primer_apellido, @segundo_apellido,
          @correo, @contrasena,
          @fecha_nacimiento, @pais, @region, @ciudad, @direccion,
          @indicativo, @celular, @telefono_fijo,
          @genero, @nombre_empresa, @codigo_referencia, @tipo_cliente
        )
      `);

    const cliente_id = clienteResult.recordset[0].id;

    /* =====================================================
       2️⃣ Crear destinatario por defecto
    ===================================================== */
    const requestDest = new sql.Request(transaction);

    const nombreDestinatario =
      tipo_cliente === "empresarial"
        ? razonSocial
        : `${primerNombre} ${primerApellido}`;

    const telefono = celular || telefonoFijo || "";

    await requestDest
      .input("nombre", sql.VarChar(150), nombreDestinatario)
      .input("ciudad", sql.VarChar(100), ciudad)
      .input("direccion", sql.VarChar(255), direccion)
      .input("telefono", sql.VarChar(50), telefono)
      .input("cliente_id", sql.Int, cliente_id)
      .input("pais", sql.NVarChar(80), pais)
      .input("departamento", sql.NVarChar(80), region)
      .input("activo", sql.Bit, 1)
      .input("es_default", sql.Bit, 1) 
      .query(`
        INSERT INTO destinatarios (
          nombre, ciudad, direccion, telefono,
          cliente_id, pais, departamento, activo, es_default
        )
        VALUES (
          @nombre, @ciudad, @direccion, @telefono,
          @cliente_id, @pais, @departamento, @activo, @es_default
        )
      `);

    await transaction.commit();

    const nombreCliente =
      tipo_cliente === "empresarial"
        ? razonSocial
        : [primerNombre, segundoNombre, primerApellido, segundoApellido]
            .filter(Boolean)
            .join(" ")
            .trim();

    enviarCorreoAperturaCliente({
      email,
      nombre: nombreCliente || "Cliente",
      codigoReferencia,
      tipoCliente: tipo_cliente,
    }).catch((mailError) => {
      console.error("Error enviando correo de apertura de cliente:", mailError);
    });

    return res.status(201).json({
      ok: true,
      message: "Cliente registrado y destinatario por defecto creado",
      codigoReferencia,
    });
  } catch (error) {
    try { await transaction.rollback(); } catch {}
    console.error("❌ Error al registrar cliente:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};




/* =======================================================
    3) LOGIN CLIENTE
======================================================= */
export const loginCliente = async (req, res) => {
  const { email, contrasena } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("correo", sql.VarChar, email)
      .query("SELECT TOP 1 * FROM clientes WHERE correo = @correo");

    const cliente = result.recordset[0];

    if (!cliente) {
      return res.status(401).json({ ok: false, message: "Correo o contraseña incorrectos" });
    }

    const passwordMatch = await bcrypt.compare(contrasena, cliente.contrasena);

    if (!passwordMatch) {
      return res.status(401).json({ ok: false, message: "Correo o contraseña incorrectos" });
    }

    const token = firmarToken({
      id: cliente.id,
      email: cliente.correo,
      tipo: "cliente",
      codigoReferencia: cliente.codigo_referencia,
    });

    return res.status(200).json({
      ok: true,
      message: "Inicio de sesión exitoso",
      token,
      cliente: {
        id: cliente.id,
        nombre: `${cliente.primer_nombre} ${cliente.primer_apellido}`,
        correo: cliente.correo,
        codigoReferencia: cliente.codigo_referencia,
        genero: cliente.genero,
        direccion: cliente.direccion,
        ciudad: cliente.ciudad,
        region: cliente.region,
        celular: cliente.celular,
        tipo_cliente: cliente.tipo_cliente,
      },
    });
  } catch (error) {
    console.error("❌ Error en loginCliente:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

/* =======================================================
    4) ACTUALIZAR PERFIL
======================================================= */
export const obtenerPerfilCliente = async (req, res) => {
  try {
    const clienteId = Number(req.usuario?.id);
    const pool = await poolPromise;

    const result = await pool.request()
      .input("cliente_id", sql.Int, clienteId)
      .query(`
        SELECT
          c.id,
          c.primer_nombre,
          c.segundo_nombre,
          c.primer_apellido,
          c.segundo_apellido,
          c.nombre_empresa,
          c.tipo_cliente,
          c.correo AS email,
          c.genero,
          c.direccion,
          c.ciudad,
          c.region,
          c.pais,
          c.indicativo,
          c.celular,
          c.telefono_fijo,
          c.codigo_referencia AS codigoReferencia,
          CASE
            WHEN LOWER(ISNULL(c.tipo_cliente, '')) = 'empresarial'
              THEN COALESCE(NULLIF(c.nombre_empresa, ''), CONCAT(c.primer_nombre, ' ', c.primer_apellido))
            ELSE LTRIM(RTRIM(CONCAT(
              ISNULL(c.primer_nombre, ''), ' ',
              ISNULL(c.segundo_nombre, ''), ' ',
              ISNULL(c.primer_apellido, ''), ' ',
              ISNULL(c.segundo_apellido, '')
            )))
          END AS nombre,
          (
            SELECT COUNT(*)
            FROM solicitudes s
            WHERE s.cliente_id = c.id
              AND LOWER(LTRIM(RTRIM(ISNULL(s.estado, '')))) <> 'anulado'
          ) AS solicitudes_creadas,
          (
            SELECT COUNT(*)
            FROM paquetes p
            LEFT JOIN estados_catalogo e ON e.id = p.estado_id
            WHERE (p.cliente_id = c.id OR p.codigo_referencia = c.codigo_referencia)
              AND LOWER(LTRIM(RTRIM(ISNULL(e.nombre, '')))) <> 'anulado'
          ) AS paquetes_digitados,
          (
            SELECT COUNT(*)
            FROM destinatarios d
            WHERE d.cliente_id = c.id
              AND d.activo = 1
          ) AS destinatarios_creados
        FROM clientes c
        WHERE c.id = @cliente_id
      `);

    const cliente = result.recordset[0];

    if (!cliente) {
      return res.status(404).json({ ok: false, message: "Cliente no encontrado" });
    }

    return res.json({
      ok: true,
      cliente: {
        ...cliente,
        solicitudes_creadas: Number(cliente.solicitudes_creadas || 0),
        paquetes_digitados: Number(cliente.paquetes_digitados || 0),
        destinatarios_creados: Number(cliente.destinatarios_creados || 0),
      },
    });
  } catch (error) {
    console.error("Error obteniendo perfil del cliente:", error);
    return res.status(500).json({ ok: false, message: "Error obteniendo perfil" });
  }
};

export const actualizarPerfilCliente = async (req, res) => {
  try {
    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      nombre_empresa,
      email,
      genero,
      direccion,
      ciudad,
      region,
      celular,
    } = req.body;

    const id = req.usuario.id;

    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("primer_nombre", sql.VarChar(100), primer_nombre || null)
      .input("segundo_nombre", sql.VarChar(100), segundo_nombre || null)
      .input("primer_apellido", sql.VarChar(100), primer_apellido || null)
      .input("segundo_apellido", sql.VarChar(100), segundo_apellido || null)
      .input("nombre_empresa", sql.VarChar(150), nombre_empresa || null)
      .input("correo", sql.VarChar(150), email)
      .input("genero", sql.VarChar, genero || null)
      .input("direccion", sql.VarChar, direccion || null)
      .input("ciudad", sql.VarChar, ciudad || null)
      .input("region", sql.VarChar, region || null)
      .input("celular", sql.VarChar, celular || null)
      .query(`
        UPDATE clientes
        SET 
          primer_nombre = @primer_nombre,
          segundo_nombre = @segundo_nombre,
          primer_apellido = @primer_apellido,
          segundo_apellido = @segundo_apellido,
          nombre_empresa = @nombre_empresa,
          correo = @correo,
          genero = @genero,
          direccion = @direccion,
          ciudad = @ciudad,
          region = @region,
          celular = @celular
        WHERE id = @id
      `);

    return res.status(200).json({ ok: true, message: "Perfil actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar perfil:", err);
    return res.status(500).json({ ok: false, message: err.message });
  }
};


export const buscarCliente = async (req, res) => {
  try {
    const { valor } = req.params;

    const pool = await poolPromise;
    const busqueda = `%${valor}%`;

    const result = await pool
      .request()
      .input("valor", sql.VarChar, busqueda)
      .query(`
        SELECT 
          id,
          tipo_identificacion,
          numero_identificacion,
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          ISNULL(
            NULLIF(
              LTRIM(RTRIM(CONCAT(
                ISNULL(primer_nombre, ''), ' ',
                ISNULL(segundo_nombre, ''), ' ',
                ISNULL(primer_apellido, ''), ' ',
                ISNULL(segundo_apellido, '')
              ))), 
              ''
            ),
            nombre_empresa
          ) AS nombre,
          correo,
          fecha_nacimiento,
          pais,
          region,
          ciudad,
          direccion,
          indicativo,
          celular,
          telefono_fijo,
          genero,
          nombre_empresa,
          codigo_referencia,
          tipo_cliente,
          fecha_creacion
        FROM clientes
        WHERE 
          codigo_referencia LIKE @valor
          OR primer_nombre LIKE @valor
          OR segundo_nombre LIKE @valor
          OR primer_apellido LIKE @valor
          OR segundo_apellido LIKE @valor
          OR nombre_empresa LIKE @valor
          OR correo LIKE @valor
        ORDER BY fecha_creacion DESC
      `);

    return res.json({ ok: true, clientes: result.recordset });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: error.message });
  }
};

export const reporteClientesCasilleros = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, tipo_cliente = "todos" } = req.query;
    const pool = await poolPromise;
    const request = pool.request();
    const where = [];

    if (fechaDesde) {
      where.push("CONVERT(date, fecha_creacion) >= @fechaDesde");
      request.input("fechaDesde", sql.Date, fechaDesde);
    }

    if (fechaHasta) {
      where.push("CONVERT(date, fecha_creacion) <= @fechaHasta");
      request.input("fechaHasta", sql.Date, fechaHasta);
    }

    if (tipo_cliente && tipo_cliente !== "todos") {
      where.push("LOWER(tipo_cliente) = LOWER(@tipo_cliente)");
      request.input("tipo_cliente", sql.VarChar(50), tipo_cliente);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await request.query(`
      SELECT
        id,
        codigo_referencia,
        tipo_cliente,
        ISNULL(
          NULLIF(
            LTRIM(RTRIM(CONCAT(
              ISNULL(primer_nombre, ''), ' ',
              ISNULL(segundo_nombre, ''), ' ',
              ISNULL(primer_apellido, ''), ' ',
              ISNULL(segundo_apellido, '')
            ))),
            ''
          ),
          ISNULL(NULLIF(LTRIM(RTRIM(nombre_empresa)), ''), 'Sin nombre')
        ) AS nombre,
        nombre_empresa,
        tipo_identificacion,
        numero_identificacion,
        correo,
        pais,
        region,
        ciudad,
        direccion,
        indicativo,
        celular,
        telefono_fijo,
        genero,
        CONVERT(varchar, fecha_creacion, 120) AS fecha_creacion
      FROM clientes
      ${whereClause}
      ORDER BY fecha_creacion DESC
    `);

    return res.json({ ok: true, clientes: result.recordset });
  } catch (error) {
    console.error("Error generando reporte de clientes casilleros:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error generando reporte de clientes casilleros.",
    });
  }
};

export const buscarClienteDestinatarios = async (req, res) => {
  try {
    const { texto } = req.params;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("texto", sql.VarChar, `%${texto}%`)
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

    return res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error buscando cliente (destinatarios):", error);
    return res.status(500).json({ ok: false, msg: error.message });
  }
};

export const actualizarClienteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      correo,
      tipo_cliente,
      pais,
      region,
      ciudad,
      direccion,
      indicativo,
      celular,
      telefono_fijo,
      genero,
      nombre_empresa,
      tipo_identificacion,
      numero_identificacion,
    } = req.body;

    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("primer_nombre", sql.VarChar(100), primer_nombre || null)
      .input("segundo_nombre", sql.VarChar(100), segundo_nombre || null)
      .input("primer_apellido", sql.VarChar(100), primer_apellido || null)
      .input("segundo_apellido", sql.VarChar(100), segundo_apellido || null)
      .input("correo", sql.VarChar(150), correo)
      .input("tipo_cliente", sql.VarChar(50), tipo_cliente)
      .input("pais", sql.VarChar(100), pais)
      .input("region", sql.VarChar(100), region)
      .input("ciudad", sql.VarChar(100), ciudad)
      .input("direccion", sql.VarChar(255), direccion)
      .input("indicativo", sql.VarChar(20), indicativo)
      .input("celular", sql.VarChar(50), celular)
      .input("telefono_fijo", sql.VarChar(50), telefono_fijo)
      .input("genero", sql.VarChar(50), genero)
      .input("nombre_empresa", sql.VarChar(150), nombre_empresa)
      .input("tipo_identificacion", sql.VarChar(50), tipo_identificacion)
      .input("numero_identificacion", sql.VarChar(50), numero_identificacion)
      .query(`
        UPDATE clientes
        SET
          primer_nombre = @primer_nombre,
          segundo_nombre = @segundo_nombre,
          primer_apellido = @primer_apellido,
          segundo_apellido = @segundo_apellido,
          correo = @correo,
          tipo_cliente = @tipo_cliente,
          pais = @pais,
          region = @region,
          ciudad = @ciudad,
          direccion = @direccion,
          indicativo = @indicativo,
          celular = @celular,
          telefono_fijo = @telefono_fijo,
          nombre_empresa = @nombre_empresa,
          tipo_identificacion = @tipo_identificacion,
          numero_identificacion = @numero_identificacion,
          genero = @genero
        WHERE id = @id
      `);

    return res.status(200).json({
      ok: true,
      mensaje: "Cliente actualizado correctamente",
    });

  } catch (error) {
    console.error("❌ Error actualizando cliente:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error actualizando cliente",
    });
  }
};
