import { poolPromise, sql } from '../config/db.js';
import crypto from 'crypto';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";

const generarHAWBUnico = async (pool) => {
  let hawb;
  let existe = true;

  while (existe) {
    const numero = Math.floor(Math.random() * 1_000_000_000_000);
    hawb = `COJA${numero.toString().padStart(12, '0')}`;

    const result = await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .query('SELECT 1 FROM paquetes WHERE hawb = @hawb');

    existe = result.recordset.length > 0;
  }

  return hawb;
};

const validarRestriccionesServicio = async (pool, servicio_id, peso) => {
  const servicio = await pool.request()
    .input("servicio_id", sql.Int, Number(servicio_id))
    .query(`
      SELECT 
        id,
        nombre,
        aplica_peso_maximo,
        peso_maximo
      FROM servicios
      WHERE id = @servicio_id
    `);

  if (!servicio.recordset.length) {
    return {
      ok: false,
      status: 404,
      mensaje: "Servicio no encontrado.",
    };
  }

  const data = servicio.recordset[0];


  if (
    data.aplica_peso_maximo &&
    Number(data.peso_maximo) > 0 &&
    Number(peso) > Number(data.peso_maximo)
  ) {
    return {
      ok: false,
      status: 400,
      mensaje: `El servicio "${data.nombre}" solo permite paquetes de hasta ${data.peso_maximo} lb. Peso digitado: ${peso} lb.`,
    };
  }

  return {
    ok: true,
    servicio: data,
  };
};


export const registrarPaquete = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  const {
    tracking,
    referencia,
    tienda,
    contenido,
    peso,
    digitado_por,
    codigo_referencia,
    ancho,
    alto,
    largo,
    asegurado,
    declaracion_valor,
    ubicacion,
    posicion_arancelaria,
    agrupado,
    notas,
    servicio_id,
    destinatario_id
  } = req.body;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const requestTx = () => new sql.Request(transaction);

    const cliente = await requestTx()
      .input('codigo', sql.NVarChar, codigo_referencia)
      .query('SELECT id FROM clientes WHERE codigo_referencia = @codigo');

    if (cliente.recordset.length === 0) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (!servicio_id) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "Debe seleccionar un servicio para el paquete."
      });
    }

    const validacionServicio = await validarRestriccionesServicio(
      pool,
      servicio_id,
      peso
    );

    if (!validacionServicio.ok) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(validacionServicio.status).json({
        mensaje: validacionServicio.mensaje,
      });
    }

    const destinatarioIdInt = Number(destinatario_id);

    if (!destinatario_id || Number.isNaN(destinatarioIdInt) || destinatarioIdInt <= 0) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "Debe seleccionar un destinatario válido para el paquete."
      });
    }


    const cliente_id = cliente.recordset[0].id;
    const hawb = await generarHAWBUnico(pool);

    if (!hawb || hawb.trim() === "") {
      throw new Error("❌ Error: HAWB vacío antes de insertar en la base de datos");
    }

    const request = requestTx();

    request.input('tracking', sql.NVarChar, tracking)
      .input('hawb', sql.NVarChar, hawb)
      .input('tienda', sql.NVarChar, tienda ?? null)
      .input('contenido', sql.NVarChar, contenido)
      .input('peso', sql.Decimal(10, 2), peso)
      .input('digitado_por', sql.NVarChar, digitado_por ?? null)
      .input('cliente_id', sql.Int, cliente_id)
      .input('codigo_referencia', sql.NVarChar, codigo_referencia)
      .input('oficina', sql.NVarChar, 'Bogota')
      .input("destinatario_id", sql.Int, destinatarioIdInt)
      .input('ancho', sql.Int, ancho ?? 0)
      .input('alto', sql.Int, alto ?? 0)
      .input('largo', sql.Int, largo ?? 0)
      .input('asegurado', sql.Decimal(10, 2), asegurado || 0.00)
      .input('declaracion_valor', sql.NVarChar, declaracion_valor == null ? null : String(declaracion_valor))
      .input('ubicacion', sql.NVarChar, ubicacion ?? null)
      .input('punto_control', sql.NVarChar, 'Casilleros bodega')
      .input('posicion_arancelaria', sql.NVarChar, posicion_arancelaria ?? null)
      .input('agrupado', sql.NVarChar, agrupado ?? 'No agrupado')
      .input('notas', sql.NVarChar, notas ?? null)
      .input('servicio_id', sql.Int, servicio_id);

    if (referencia && referencia.trim() !== '') {
      request.input('referencia', sql.NVarChar, referencia);
    } else {
      request.input('referencia', sql.NVarChar, null);
    }
    const estadoCatalogo = await requestTx()
      .input('estado', sql.NVarChar, 'Digitado')
      .query(`
        SELECT TOP 1 id
        FROM estados_catalogo
        WHERE nombre = @estado
      `);

    if (!estadoCatalogo.recordset.length) {
      throw new Error("Estado 'Digitado' no existe en catálogo");
    }

    const estado_id = estadoCatalogo.recordset[0].id;

    request.input('estado_id', sql.Int, estado_id);

    await request.query(`
      INSERT INTO paquetes (
        tracking, hawb, tienda, contenido, peso, digitado_por, cliente_id,
        codigo_referencia, referencia, estado_id, punto_control,
        ancho, alto, largo, asegurado, declaracion_valor,destinatario_id,
        posicion_arancelaria, agrupado, notas, servicio_id, oficina
      ) VALUES (
        @tracking, @hawb, @tienda, @contenido, @peso, @digitado_por,
        @cliente_id, @codigo_referencia, @referencia, @estado_id,
        @punto_control, @ancho, @alto, @largo, @asegurado,
        @declaracion_valor, @destinatario_id, @posicion_arancelaria, @agrupado, @notas, @servicio_id, @oficina
      )
    `);


    await requestTx()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, "Casilleros bodega")
      .input("responsable", sql.NVarChar, digitado_por ?? "Usuario del sistema")
      .input("observaciones", sql.NVarChar, "Guía creada automáticamente")
    .query(`
      INSERT INTO historial_estados (hawb, estado_id, punto_control, observaciones, responsable)
      VALUES (@hawb, @estado_id, @punto_control, @observaciones, @responsable)
    `);
  

    await transaction.commit();
    transactionStarted = false;

    res.status(201).json({ mensaje: 'Paquete registrado correctamente', hawb });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo registrarPaquete:", rollbackError);
      }
    }
    console.error('❌ Error al registrar paquete:', error);
    res.status(500).json({ mensaje: 'Error al registrar paquete' });
  }
};


export const obtenerPaquetes = async (req, res) => {
  const { codigo_referencia } = req.query;

  try {
    const pool = await poolPromise;
    let result;

    if (codigo_referencia) {
      result = await pool.request()
        .input("codigo", sql.NVarChar, codigo_referencia)
        .query(`
          SELECT 
            p.id,
            p.referencia,
            p.tracking,
            p.hawb,
            p.estado_id,
            e.nombre AS estado,
            p.destinatario_id,
            p.tienda,
            p.contenido,
            FORMAT(p.peso, 'N2') + ' LB' AS peso,
            p.digitado_por AS usuario,

            -- DESTINATARIO
            d.nombre AS destinatario_nombre,
            d.direccion AS destinatario_direccion,
            d.ciudad AS destinatario_ciudad,
            d.telefono AS destinatario_telefono,

            p.notas,
            FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,

            CASE 
              WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
                RTRIM(
                  c.primer_nombre + ' ' + 
                  ISNULL(c.segundo_nombre + ' ', '') + 
                  c.primer_apellido + ' ' + 
                  ISNULL(c.segundo_apellido, '')
                )
              ELSE 
                ISNULL(c.nombre_empresa, 'Sin nombre')
            END AS cliente,

            c.codigo_referencia,

            -- ESTADO DESDE CATALOGO
            e.nombre AS estado,

            p.oficina,
            p.servicio_id,

            -- SERVICIO
            s.nombre AS servicio,
            s.tipo AS tipo_servicio

          FROM paquetes p
          JOIN clientes c ON p.cliente_id = c.id
          LEFT JOIN servicios s ON p.servicio_id = s.id
          LEFT JOIN destinatarios d ON p.destinatario_id = d.id
          LEFT JOIN estados_catalogo e ON e.id = p.estado_id
          WHERE p.codigo_referencia = @codigo
          ORDER BY p.fecha_registro DESC
        `);

    } else {

      result = await pool.request().query(`
        SELECT 
          p.id,
          p.referencia,
          p.tracking,
          p.hawb,
          p.estado_id,
          p.destinatario_id,
          p.tienda,
          p.contenido,
          FORMAT(p.peso, 'N2') + ' LB' AS peso,
          p.digitado_por AS usuario,

          -- DESTINATARIO
          d.nombre AS destinatario_nombre,
          d.direccion AS destinatario_direccion,
          d.ciudad AS destinatario_ciudad,
          d.telefono AS destinatario_telefono,

          p.notas,
          FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,

          CASE 
            WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
              RTRIM(
                c.primer_nombre + ' ' + 
                ISNULL(c.segundo_nombre + ' ', '') + 
                c.primer_apellido + ' ' + 
                ISNULL(c.segundo_apellido, '')
              )
            ELSE 
              ISNULL(c.nombre_empresa, 'Sin nombre')
          END AS cliente,

          c.codigo_referencia,

          -- ESTADO DESDE CATALOGO
          e.nombre AS estado,

          p.oficina,
          p.servicio_id,

          -- SERVICIO
          s.nombre AS servicio,
          s.tipo AS tipo_servicio

        FROM paquetes p
        JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN servicios s ON p.servicio_id = s.id
        LEFT JOIN destinatarios d ON p.destinatario_id = d.id
        LEFT JOIN estados_catalogo e ON e.id = p.estado_id
        ORDER BY p.fecha_registro DESC
      `);
    }

    return res.status(200).json(result.recordset);

  } catch (error) {
    console.error("❌ Error al obtener paquetes:", error);
    return res.status(500).json({
      mensaje: "Error al obtener paquetes"
    });
  }
};


export const generarReporteCSV = async (req, res) => {
  const { fecha, estado } = req.query;
  const pool = await poolPromise;

  try {
    let query = `
      SELECT 
        p.id,
        p.referencia,
        p.tracking,
        p.hawb,
        p.tienda,
        p.contenido,
        FORMAT(p.peso, 'N2') + ' LB' AS peso,
        p.digitado_por,
        FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,
        p.estado_actual,
        u.nombre AS cliente,
        u.codigo_referencia
      FROM paquetes p
      JOIN usuarios u ON p.cliente_id = u.id
      WHERE 1=1
    `;

    if (fecha) {
      query += ` AND CONVERT(date, p.fecha_registro) = '${fecha}'`;
    }

    if (estado) {
      query += ` AND p.estado_actual = '${estado}'`;
    }

    query += ` ORDER BY p.fecha_registro DESC`;

    const result = await pool.request().query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'No hay paquetes registrados con esos filtros.' });
    }

    const fields = [
      'id', 'referencia', 'tracking', 'hawb', 'tienda',
      'contenido', 'peso', 'digitado_por', 'fecha_registro',
      'estado', 'cliente', 'codigo_referencia'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result.recordset);

    res.header('Content-Type', 'text/csv');
    res.attachment(`reporte_paquetes_${Date.now()}.csv`);
    return res.send(csv);

  } catch (error) {
    console.error('❌ Error generando reporte CSV:', error);
    res.status(500).json({ mensaje: 'Error generando el reporte.' });
  }
};

export const validarTracking = async (req, res) => {
  const { valor } = req.params;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('valor', sql.NVarChar, valor)
    .query('SELECT 1 FROM paquetes WHERE tracking = @valor');
  res.json({ existe: result.recordset.length > 0 });
};

export const validarReferencia = async (req, res) => {
  const { valor } = req.params;
  const pool = await poolPromise;
  const result = await pool.request()
    .input('valor', sql.NVarChar, valor)
    .query('SELECT 1 FROM paquetes WHERE referencia = @valor');
  res.json({ existe: result.recordset.length > 0 });
};

export const buscarPaquetesFiltrados = async (req, res) => {
  try {
    let {
      guia,
      referencia,
      contenido,
      notas,
      cliente,
      usuario,
      fechaDesde,
      fechaHasta,
    } = req.body;

    const pool = await poolPromise;
    const request = pool.request();

    const where = [];

    guia = guia?.trim();
    referencia = referencia?.trim();
    contenido = contenido?.trim();
    notas = notas?.trim();
    cliente = cliente?.trim();
    usuario = usuario?.trim();

    if (contenido) {
      where.push("p.contenido LIKE @contenido");
      request.input("contenido", sql.NVarChar, `%${contenido}%`);
    }

    if (notas) {
      where.push("p.notas LIKE @notas");
      request.input("notas", sql.NVarChar, `%${notas}%`);
    }

    if (cliente) {
      where.push(`
        (
          c.codigo_referencia LIKE @cliente OR
          c.primer_nombre LIKE @cliente OR
          c.segundo_nombre LIKE @cliente OR
          c.primer_apellido LIKE @cliente OR
          c.segundo_apellido LIKE @cliente OR
          c.nombre_empresa LIKE @cliente
        )
      `);
      request.input("cliente", sql.NVarChar, `%${cliente}%`);
    }

    if (usuario) {
      where.push("p.digitado_por LIKE @usuario");
      request.input("usuario", sql.NVarChar, `%${usuario}%`);
    }

    if (guia) {
      where.push("(p.tracking LIKE @guia OR p.hawb LIKE @guia)");
      request.input("guia", sql.NVarChar, `%${guia}%`);
    }

    if (referencia) {
      where.push("p.referencia LIKE @referencia");
      request.input("referencia", sql.NVarChar, `%${referencia}%`);
    }

    if (fechaDesde) {
      where.push("CONVERT(date, p.fecha_registro) >= @fechaDesde");
      request.input("fechaDesde", sql.Date, fechaDesde);
    }

    if (fechaHasta) {
      where.push("CONVERT(date, p.fecha_registro) <= @fechaHasta");
      request.input("fechaHasta", sql.Date, fechaHasta);
    }

    if (!where.length) {
      return res.json({ ok: true, paquetes: [] });
    }

    const query = `
      SELECT
        p.id,
        p.tracking,
        p.hawb,
        p.referencia,
        p.tienda,
        p.destinatario_id,
        p.estado_id,
        e.nombre AS estado,
        p.servicio_id,
        s.nombre AS servicio,
        s.tipo AS tipo_servicio,
        d.nombre AS destinatario_nombre,
        FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,
        FORMAT(p.peso, 'N2') + ' LB' AS peso,
        p.contenido,
        p.notas,
        p.codigo_referencia,
        p.digitado_por AS usuario,
        CASE 
          WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
            RTRIM(
              c.primer_nombre + ' ' +
              ISNULL(c.segundo_nombre + ' ', '') +
              c.primer_apellido + ' ' +
              ISNULL(c.segundo_apellido, '')
            )
          ELSE 
            ISNULL(c.nombre_empresa, 'Sin nombre')
        END AS cliente
      FROM paquetes p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN servicios s ON p.servicio_id = s.id
      LEFT JOIN estados_catalogo e ON e.id = p.estado_id
      LEFT JOIN destinatarios d ON p.destinatario_id = d.id
      WHERE ${where.join(" AND ")}
      ORDER BY p.fecha_registro DESC
    `;


    const result = await request.query(query);


    res.json({
      ok: true,
      paquetes: result.recordset
    });

  } catch (error) {
    console.error("❌ Error buscar paquetes:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al buscar paquetes"
    });
  }
};



export const editarPaquete = async (req, res) => {
  const { id } = req.params;
  const {
    tracking,
    referencia,
    tienda,
    contenido,
    peso,
    digitado_por,
    codigo_referencia,
    ancho,
    alto,
    largo,
    declaracion_valor,
    ubicacion,
    posicion_arancelaria,
    agrupado,
    notas,
    servicio_id,
    destinatario_id
  } = req.body;

  try {
    const pool = await poolPromise;

    const paqueteActual = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          p.id,
          p.estado_id,
          e.nombre AS estado
        FROM paquetes p
        LEFT JOIN estados_catalogo e ON e.id = p.estado_id
        WHERE p.id = @id
      `);

    if (!paqueteActual.recordset.length) {
      return res.status(404).json({
        mensaje: "Paquete no encontrado"
      });
    }

    const estadoIdActual = Number(paqueteActual.recordset[0].estado_id);

    if (![5, 22].includes(estadoIdActual)) {
      return res.status(400).json({
        mensaje: "Solo se pueden editar paquetes en estado Digitado o Editada."
      });
    }

    const estadoActual = paqueteActual.recordset[0].estado;

    if (
      estadoActual &&
      estadoActual.trim().toLowerCase() === "anulado"
    ) {
      return res.status(400).json({
        mensaje: "No se puede editar un paquete anulado."
      });
    }

    const servicioIdInt = Number(servicio_id);
    const destinatarioIdInt = Number(destinatario_id);

    if (!servicio_id || Number.isNaN(servicioIdInt) || servicioIdInt <= 0) {
      return res.status(400).json({
        mensaje: "Debe seleccionar un servicio válido para el paquete."
      });
    }

    const validacionServicio = await validarRestriccionesServicio(
      pool,
      servicioIdInt,
      peso
    );

    if (!validacionServicio.ok) {
      return res.status(validacionServicio.status).json({
        mensaje: validacionServicio.mensaje,
      });
    }

    if (!destinatario_id || Number.isNaN(destinatarioIdInt) || destinatarioIdInt <= 0) {
      return res.status(400).json({
        mensaje: "Debe seleccionar un destinatario válido para el paquete."
      });
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('tracking', sql.NVarChar, tracking)
      .input('referencia', sql.NVarChar, referencia ?? null)
      .input('tienda', sql.NVarChar, tienda ?? null)
      .input('contenido', sql.NVarChar, contenido)
      .input('peso', sql.Decimal(10,2), peso)
      .input("destinatario_id", sql.Int, destinatarioIdInt)
      .input('digitado_por', sql.NVarChar, digitado_por ?? null)
      .input('codigo_referencia', sql.NVarChar, codigo_referencia)
      .input('ancho', sql.Int, ancho ?? 0)
      .input('alto', sql.Int, alto ?? 0)
      .input('largo', sql.Int, largo ?? 0)
      .input('declaracion_valor', sql.NVarChar, declaracion_valor == null ? null : String(declaracion_valor))
      .input('ubicacion', sql.NVarChar, ubicacion ?? null)
      .input('posicion_arancelaria', sql.NVarChar, posicion_arancelaria ?? null)
      .input('agrupado', sql.NVarChar, agrupado ?? 'No agrupado')
      .input('notas', sql.NVarChar, notas ?? null)
      .input('servicio_id', sql.Int, servicioIdInt)
      .query(`
        UPDATE paquetes SET
          tracking = @tracking,
          referencia = @referencia,
          tienda = @tienda,
          contenido = @contenido,
          peso = @peso,
          digitado_por = @digitado_por,
          codigo_referencia = @codigo_referencia,
          ancho = @ancho,
          alto = @alto,
          largo = @largo,
          declaracion_valor = @declaracion_valor,
          ubicacion = @ubicacion,
          posicion_arancelaria = @posicion_arancelaria,
          agrupado = @agrupado,
          notas = @notas,
          servicio_id = @servicio_id,
          destinatario_id = @destinatario_id
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: 'Paquete no encontrado' });
    }

    res.status(200).json({ mensaje: 'Paquete actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar paquete:', error);
    res.status(500).json({ mensaje: 'Error al actualizar paquete' });
  }
};


export const anularGuia = async (req, res) => {
  const { hawb } = req.params;
  const { responsable } = req.body;
  let transaction;
  let transactionStarted = false;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    if (!hawb || !hawb.trim()) {
      return res.status(400).json({
        mensaje: "El HAWB es obligatorio."
      });
    }

    const paqueteResult = await request()
      .input("hawb", sql.NVarChar, hawb)
      .query(`
        SELECT 
          p.id,
          p.hawb,
          p.estado_id,
          e.nombre AS estado_actual
        FROM paquetes p
        LEFT JOIN estados_catalogo e ON e.id = p.estado_id
        WHERE p.hawb = @hawb
      `);

    if (!paqueteResult.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({
        mensaje: "No se encontró una guía con ese HAWB."
      });
    }

    const paquete = paqueteResult.recordset[0];

    if (
      paquete.estado_actual &&
      paquete.estado_actual.trim().toLowerCase() === "anulado"
    ) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "La guía ya se encuentra anulada."
      });
    }

    if (![5, 22].includes(Number(paquete.estado_id))) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: `La guía no puede anularse desde su estado actual (${paquete.estado_actual}). Solo se permite cuando el estado_id sea 5 o 22.`
      });
    }

    if (
      paquete.estado_actual &&
      paquete.estado_actual.trim().toLowerCase() === "anulado"
    ) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "La guía ya se encuentra anulada."
      });
    }

    const estadoCatalogo = await request()
      .input("estado", sql.NVarChar, "Anulado")
      .query(`
        SELECT TOP 1 id
        FROM estados_catalogo
        WHERE nombre = @estado
          AND activo = 1
      `);

    if (!estadoCatalogo.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "El estado 'Anulado' no existe en el catálogo o está inactivo."
      });
    }

    const estado_id = estadoCatalogo.recordset[0].id;
    const responsableFinal = responsable?.trim() || "Usuario del sistema";

    const updateResult = await request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, "Anulación")
      .query(`
        UPDATE paquetes
        SET 
          estado_id = @estado_id,
          punto_control = @punto_control
        WHERE hawb = @hawb
      `);

    if (!updateResult.rowsAffected[0]) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "No se pudo actualizar el estado de la guía."
      });
    }

    await request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, "Anulación")
      .input("observaciones", sql.NVarChar, "Guía anulada por el usuario.")
      .input("responsable", sql.NVarChar, responsableFinal)
      .query(`
        INSERT INTO historial_estados
        (hawb, estado_id, punto_control, observaciones, responsable)
        VALUES
        (@hawb, @estado_id, @punto_control, @observaciones, @responsable)
      `);

    await transaction.commit();
    transactionStarted = false;

    return res.status(200).json({
      mensaje: "Guía anulada correctamente",
      hawb,
      estado_id
    });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo anularGuia:", rollbackError);
      }
    }

    console.error("❌ Error al anular guía:", error);
    return res.status(500).json({
      mensaje: "Error al anular guía"
    });
  }
};

export const actualizarEstadoTracking = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const { hawb } = req.params;
    const { estado, punto_control, observaciones, responsable } = req.body;

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    // 1️⃣ Verificar que el paquete exista
    const existe = await request()
      .input("hawb", sql.NVarChar, hawb)
      .query(`
        SELECT 1
        FROM paquetes
        WHERE hawb = @hawb
      `);

    if (!existe.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({
        mensaje: "No se encontró el paquete"
      });
    }

    // 2️⃣ Obtener estado_id desde el catálogo
    const estadoCatalogo = await request()
      .input("estado", sql.NVarChar, estado)
      .query(`
        SELECT TOP 1 id
        FROM estados_catalogo
        WHERE nombre = @estado
        AND activo = 1
      `);

    if (!estadoCatalogo.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "El estado no existe en el catálogo"
      });
    }

    const estado_id = estadoCatalogo.recordset[0].id;

    // 3️⃣ Insertar historial
    await request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, punto_control)
      .input("observaciones", sql.NVarChar, observaciones || "")
      .input("responsable", sql.NVarChar, responsable || "")
      .query(`
        INSERT INTO historial_estados
        (hawb, estado_id, punto_control, observaciones, responsable)
        VALUES
        (@hawb, @estado_id, @punto_control, @observaciones, @responsable)
      `);

    // 4️⃣ Actualizar estado actual del paquete
    await request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, punto_control)
      .query(`
        UPDATE paquetes
        SET estado_id = @estado_id,
            punto_control = @punto_control
        WHERE hawb = @hawb
      `);

    await transaction.commit();
    transactionStarted = false;

    res.json({
      mensaje: "✅ Estado actualizado correctamente"
    });

  } catch (err) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo actualizarEstadoTracking:", rollbackError);
      }
    }

    console.error("❌ Error actualizarEstadoTracking:", err);
    res.status(500).json({
      mensaje: "Error al actualizar estado"
    });
  }
};

export const obtenerPaquetePorHAWB = async (req, res) => {
  const { hawb } = req.params;

  try {
    const pool = await poolPromise;

    const paquete = await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        SELECT 
          p.id,
          p.referencia,
          p.hawb,
          p.tracking,
          p.tienda,
          p.contenido,
          p.servicio_id,
          p.notas,
          CAST(p.peso AS FLOAT) AS peso,
          FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,

          e.nombre AS estado,
          pc.nombre AS punto_control,
          p.digitado_por AS responsable,
          c.codigo_referencia,

          CASE 
            WHEN LOWER(ISNULL(c.tipo_cliente,'')) = 'personal' THEN 
              RTRIM(
                ISNULL(c.primer_nombre,'') + ' ' +
                ISNULL(c.segundo_nombre + ' ', '') +
                ISNULL(c.primer_apellido,'') + ' ' +
                ISNULL(c.segundo_apellido,'')
              )
            ELSE 
              ISNULL(c.nombre_empresa, 'Sin nombre')
          END AS cliente

        FROM paquetes p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        LEFT JOIN estados_catalogo e ON e.id = p.estado_id
        LEFT JOIN puntos_control pc ON pc.id = e.punto_control_id
        WHERE p.hawb = @hawb
      `);

    if (!paquete.recordset.length) {
      return res.status(404).json([]);
    }

    const datosPaquete = paquete.recordset[0];

    const historial = await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        SELECT 
          h.id,
          h.hawb,
          FORMAT(h.fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha,
          e.nombre AS estado,
          pc.nombre AS punto_control,
          h.observaciones,
          h.responsable
        FROM historial_estados h
        LEFT JOIN estados_catalogo e ON e.id = h.estado_id
        LEFT JOIN puntos_control pc ON pc.id = e.punto_control_id
        WHERE h.hawb = @hawb
        ORDER BY h.fecha DESC
      `);

    const respuesta = {
      hawb: datosPaquete.hawb,
      tracking: datosPaquete.tracking,
      contenido: datosPaquete.contenido,
      peso: datosPaquete.peso,
      tienda: datosPaquete.tienda,
      notas: datosPaquete.notas,
      cliente: datosPaquete.cliente,
      codigo_referencia: datosPaquete.codigo_referencia,
      estado: datosPaquete.estado,
      punto_control: datosPaquete.punto_control,
      fecha_registro: datosPaquete.fecha_registro,

      estados: historial.recordset.map(row => ({
        id: row.id,
        fecha: row.fecha,
        estado: row.estado,
        punto_control: row.punto_control,
        observaciones: row.observaciones,
        responsable: row.responsable
      }))
    };

    res.status(200).json([respuesta]);

  } catch (error) {
    console.error('❌ Error al obtener paquete por HAWB:', error);
    res.status(500).json({
      mensaje: 'Error al obtener paquete por HAWB'
    });
  }
};

export const generarPDFEtiqueta = async (req, res) => {
  const { hawb } = req.params;

  try {
    const pool = await poolPromise;

  const result = await pool.request()
    .input("hawb", sql.NVarChar, hawb)
    .query(`
      SELECT
        @hawb AS hawb,

        STRING_AGG(p.contenido, ', ') AS contenido,
        SUM(CAST(p.peso AS DECIMAL(10,2))) AS peso,
        MIN(p.fecha_registro) AS fecha_registro,

        MAX(c.codigo_referencia) AS codigo_referencia,

        MAX(
          CASE 
            WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
              RTRIM(
                ISNULL(c.primer_nombre, '') + ' ' + 
                ISNULL(c.segundo_nombre + ' ', '') + 
                ISNULL(c.primer_apellido, '') + ' ' + 
                ISNULL(c.segundo_apellido, '')
              )
            ELSE 
              ISNULL(c.nombre_empresa, 'Sin nombre')
          END
        ) AS cliente,

        MAX(d.nombre) AS destinatario_nombre,
        MAX(d.direccion) AS direccion,
        MAX(d.ciudad) AS ciudad,
        MAX(d.telefono) AS celular,
        MAX(d.pais) AS pais

      FROM paquetes p
      JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN destinatarios d ON p.destinatario_id = d.id
      WHERE p.hawb = @hawb OR p.hawb_padre = @hawb
    `);

    if (!result.recordset.length || !result.recordset[0].hawb) {
      return res.status(404).send("Paquete no encontrado");
    }

    const paquete = result.recordset[0];

    const logoPath = "D:\\wolfBox_jaes\\frontend-wolfbox\\src\\assets\\logoJaesCargo.png";
    const fechaFormateada = new Date(paquete.fecha_registro).toLocaleDateString("es-CO");

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: paquete.hawb,
      scale: 2.5,
      height: 18,
      includetext: false,
      textxalign: "center",
      backgroundcolor: "FFFFFF"
    });

    const doc = new PDFDocument({
      size: [300, 600],
      margin: 18
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${paquete.hawb}.pdf"`
    );

    doc.pipe(res);

    doc.roundedRect(8, 8, 284, 584, 12).stroke("#222222");

    try {
      doc.image(logoPath, 18, 16, { width: 85 });
    } catch (err) {
      console.log("No se pudo cargar el logo:", err.message);
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#111111")
      .text("HAWB", 0, 108, {
        align: "center",
        width: 300
      });

    doc.moveTo(20, 116).lineTo(95, 116).stroke("#444444");
    doc.moveTo(205, 116).lineTo(280, 116).stroke("#444444");

    doc
      .font("Helvetica-Bold")
      .fontSize(25)
      .fillColor("#000000")
      .text(paquete.hawb, 20, 132, {
        align: "center",
        width: 260
      });

    doc.image(barcodeBuffer, 38, 185, { width: 224, height: 55 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(paquete.hawb, 20, 245, {
        align: "center",
        width: 260
      });

    let y = 280;

    const dibujarFila = (label, valor) => {
      doc.moveTo(18, y - 5).lineTo(282, y - 5).stroke("#D1D5DB");

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#111111")
        .text(`${label}:`, 24, y, { width: 90 });

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#222222")
        .text(valor ? String(valor) : "-", 112, y, {
          width: 150
        });

      y += 30;
    };

    dibujarFila("Cliente", paquete.cliente);
    dibujarFila("Contenido", paquete.contenido);
    dibujarFila("Peso", `${Number(paquete.peso).toFixed(2)} LB`);
    dibujarFila("Fecha", fechaFormateada);
    dibujarFila("Código ref.", paquete.codigo_referencia);
    dibujarFila("País", paquete.pais);
    dibujarFila("Ciudad", paquete.ciudad);
    dibujarFila("Dirección", paquete.direccion);
    dibujarFila("Celular", paquete.celular);

    doc.end();

  } catch (error) {
    console.error("❌ Error generando PDF:", error);
    res.status(500).send("Error generando PDF");
  }
};


export const eliminarEstadoTracking = async (req, res) => {
  const { id } = req.params;
  let transaction;
  let transactionStarted = false;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const estadoData = await request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          h.hawb,
          h.estado_id,
          e.nombre AS estado
        FROM historial_estados h
        LEFT JOIN estados_catalogo e ON e.id = h.estado_id
        WHERE h.id = @id
      `);

    if (!estadoData.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({
        mensaje: 'Estado no encontrado'
      });
    }

    const { hawb, estado } = estadoData.recordset[0];

    const estadosHawb = await request()
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        SELECT 
          h.id,
          h.estado_id,
          e.nombre AS estado
        FROM historial_estados h
        LEFT JOIN estados_catalogo e ON e.id = h.estado_id
        WHERE h.hawb = @hawb
        ORDER BY h.fecha DESC
      `);

    if (estadosHawb.recordset.length === 1) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: 'No se puede eliminar el único estado del historial.'
      });
    }

    const esUltimo = estadosHawb.recordset[0].id === parseInt(id);

    if (esUltimo && estado.toLowerCase() === 'digitado') {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: 'No se puede eliminar el estado "Digitado" si es el último del historial.'
      });
    }

    await request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM historial_estados
        WHERE id = @id
      `);

    const nuevoEstado = await request()
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        SELECT TOP 1 estado_id
        FROM historial_estados
        WHERE hawb = @hawb
        ORDER BY fecha DESC
      `);

    const estado_id = nuevoEstado.recordset[0].estado_id;

    // 7️⃣ Actualizar estado actual del paquete
    await request()
      .input('hawb', sql.NVarChar, hawb)
      .input('estado_id', sql.Int, estado_id)
      .query(`
        UPDATE paquetes
        SET estado_id = @estado_id
        WHERE hawb = @hawb
      `);

    await transaction.commit();
    transactionStarted = false;

    res.status(200).json({
      mensaje: 'Estado eliminado y estado del paquete actualizado'
    });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo eliminarEstadoTracking:", rollbackError);
      }
    }

    console.error('❌ Error al eliminar estado:', error);
    res.status(500).json({
      mensaje: 'Error al eliminar estado'
    });
  }
};

export const editarCamposBasicos = async (req, res) => {
  const { id } = req.params;
  const { tracking, contenido, notas } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('tracking', sql.NVarChar, tracking)
      .input('contenido', sql.NVarChar, contenido)
      .input('notas', sql.NVarChar, notas)
      .query(`
        UPDATE paquetes
        SET 
          tracking = @tracking,
          contenido = @contenido,
          notas = @notas
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: 'Paquete no encontrado' });
    }

    res.status(200).json({ mensaje: '✅ Paquete actualizado correctamente (campos básicos)' });
  } catch (error) {
    console.error('❌ Error al actualizar campos básicos:', error);
    res.status(500).json({ mensaje: 'Error al actualizar campos básicos' });
  }
};

export const editarEstadoHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, punto_control, observaciones, responsable } = req.body;

    const pool = await poolPromise;
    
    const update = await pool.request()
      .input("id", sql.Int, id)
      .input("estado", sql.NVarChar, estado)
      .input("punto_control", sql.NVarChar, punto_control)
      .input("observaciones", sql.NVarChar, observaciones)
      .input("responsable", sql.NVarChar, responsable)
      .query(`
        UPDATE historial_estados
        SET estado=@estado, punto_control=@punto_control,
            observaciones=@observaciones, responsable=@responsable
        WHERE id=@id
      `);

    if (update.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "Estado no encontrado" });
    }

    res.json({ mensaje: "✅ Historial editado correctamente" });

  } catch (err) {
    console.error("❌", err);
    res.status(500).json({ mensaje: "Error al editar historial" });
  }
};


export const crearEstadoTracking = async (req, res) => {
  let transaction;
  let transactionStarted = false;

  try {
    const { hawb, estado, punto_control, observaciones, responsable } = req.body;
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    // 1️⃣ Verificar que el paquete exista
    const existe = await request()
      .input("hawb", sql.NVarChar, hawb)
      .query(`
        SELECT 1 
        FROM paquetes 
        WHERE hawb = @hawb
      `);

    if (!existe.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(404).json({
        mensaje: "No se encontró el paquete con ese HAWB"
      });
    }

    // 2️⃣ Obtener estado_id desde el catálogo
    const estadoCatalogo = await request()
      .input("estado", sql.NVarChar, estado)
      .query(`
        SELECT TOP 1 id
        FROM estados_catalogo
        WHERE nombre = @estado
        AND activo = 1
      `);

    if (!estadoCatalogo.recordset.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        mensaje: "El estado no existe en el catálogo"
      });
    }

    const estado_id = estadoCatalogo.recordset[0].id;

    // 3️⃣ Insertar historial
    await request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, punto_control)
      .input("observaciones", sql.NVarChar, observaciones || "")
      .input("responsable", sql.NVarChar, responsable || "")
      .query(`
        INSERT INTO historial_estados 
        (hawb, estado_id, punto_control, observaciones, responsable)
        VALUES 
        (@hawb, @estado_id, @punto_control, @observaciones, @responsable)
      `);

    // 4️⃣ Actualizar estado actual del paquete
    await request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar, punto_control)
      .query(`
        UPDATE paquetes
        SET estado_id = @estado_id,
            punto_control = @punto_control
        WHERE hawb = @hawb
      `);

    await transaction.commit();
    transactionStarted = false;

    return res.status(201).json({
      mensaje: "Estado creado y paquete actualizado"
    });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo crearEstadoTracking:", rollbackError);
      }
    }

    console.error("❌ Error crearEstadoTracking:", error);
    return res.status(500).json({
      mensaje: "Error al crear estado"
    });
  }
};

export const obtenerPaquetesPorCliente = async (req, res) => {
  const { referencia } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("referencia", sql.VarChar, referencia)
      .query(`
      SELECT 
        p.id,
        p.tracking,
        p.hawb,
        p.estado_id,
        p.tienda, 
        p.contenido,
        p.peso,
        FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,
        e.nombre AS estado,
        p.servicio_id,
        s.nombre AS servicio

        FROM paquetes p

        LEFT JOIN estados_catalogo e 
          ON e.id = p.estado_id

        LEFT JOIN servicios s
          ON s.id = p.servicio_id

        WHERE p.codigo_referencia = @referencia
          AND p.solicitud_id IS NULL
          AND ISNULL(p.agrupado_bit, 0) = 0
          AND p.hawb_padre IS NULL
          AND ISNULL(LOWER(LTRIM(RTRIM(e.nombre))), '') <> 'anulado'

        ORDER BY p.fecha_registro DESC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error("❌ Error al obtener paquetes del cliente:", error);
    res.status(500).json({
      message: "Error al obtener paquetes"
    });
  }
};

export const obtenerCatalogoEstados = async (req, res) => {
  try {

    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        o.id AS oficina_id,
        o.nombre AS oficina,
        pc.id AS punto_control_id,
        pc.nombre AS punto_control,
        e.id AS estado_id,
        e.nombre AS estado
      FROM estados_catalogo e
      JOIN puntos_control pc ON pc.id = e.punto_control_id
      JOIN oficinas o ON o.id = pc.oficina_id
      WHERE e.activo = 1
      ORDER BY o.nombre, pc.orden, e.orden
    `);

    res.status(200).json(result.recordset);

  } catch (error) {
    console.error("❌ Error obteniendo catálogo de estados:", error);
    res.status(500).json({
      mensaje: "Error obteniendo catálogo de estados"
    });
  }
};




  

