import { poolPromise, sql } from '../config/db.js';
import crypto from 'crypto';
import { Parser } from 'json2csv';
import fs from 'fs';
import path from 'path';

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


export const registrarPaquete = async (req, res) => {
  const {
    tracking,
    numero_guia,
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
    servicio_id
  } = req.body;

  try {
    const pool = await poolPromise;

    const cliente = await pool.request()
      .input('codigo', sql.NVarChar, codigo_referencia)
      .query('SELECT id FROM clientes WHERE codigo_referencia = @codigo');

    if (cliente.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (!servicio_id) {
      return res.status(400).json({
        mensaje: "Debe seleccionar un servicio para el paquete."
      });
    }


    const cliente_id = cliente.recordset[0].id;
    const hawb = await generarHAWBUnico(pool);

    if (!hawb || hawb.trim() === "") {
      throw new Error("❌ Error: HAWB vacío antes de insertar en la base de datos");
    }

    const request = pool.request();

    request.input('tracking', sql.NVarChar, tracking)
      .input('hawb', sql.NVarChar, hawb)
      .input('tienda', sql.NVarChar, tienda)
      .input('contenido', sql.NVarChar, contenido)
      .input('peso', sql.Decimal(10, 2), peso)
      .input('digitado_por', sql.NVarChar, digitado_por)
      .input('cliente_id', sql.Int, cliente_id)
      .input('codigo_referencia', sql.NVarChar, codigo_referencia)
      .input('estado_actual', sql.NVarChar, 'Digitado')
      .input('oficina', sql.NVarChar, 'Bogota')
      .input('ancho', sql.Int, ancho)
      .input('alto', sql.Int, alto)
      .input('largo', sql.Int, largo)
      .input('asegurado', sql.Decimal(10, 2), asegurado || 0.00)
      .input('declaracion_valor', sql.NVarChar, declaracion_valor)
      .input('ubicacion', sql.NVarChar, ubicacion)
      .input('punto_control', sql.NVarChar, 'Casilleros bodega')
      .input('posicion_arancelaria', sql.NVarChar, posicion_arancelaria)
      .input('agrupado', sql.NVarChar, agrupado ?? 'No agrupado')
      .input('notas', sql.NVarChar, notas)
      .input('servicio_id', sql.Int, servicio_id);

    if (numero_guia && numero_guia.trim() !== '') {
      request.input('numero_guia', sql.NVarChar, numero_guia);
    } else {
      request.input('numero_guia', sql.NVarChar, null);
    }

    await request.query(`
      INSERT INTO paquetes (
        tracking, hawb, tienda, contenido, peso, digitado_por, cliente_id,
        codigo_referencia, numero_guia, estado_actual, punto_control,
        ancho, alto, largo, asegurado, declaracion_valor,
        posicion_arancelaria, agrupado, notas, servicio_id, oficina
      ) VALUES (
        @tracking, @hawb, @tienda, @contenido, @peso, @digitado_por,
        @cliente_id, @codigo_referencia, @numero_guia, @estado_actual,
        @punto_control, @ancho, @alto, @largo, @asegurado,
        @declaracion_valor, @posicion_arancelaria, @agrupado, @notas, @servicio_id, @oficina
      )
    `);


    await pool.request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado", sql.NVarChar, "Digitado")
      .input("punto_control", sql.NVarChar, "Casilleros bodega")
      .input("responsable", sql.NVarChar, digitado_por)
      .input("observaciones", sql.NVarChar, "Guía creada automáticamente")
    .query(`
      INSERT INTO historial_estados (hawb, estado, punto_control, observaciones, responsable)
      VALUES (@hawb, @estado, @punto_control, @observaciones, @responsable)
    `);
  

    res.status(201).json({ mensaje: 'Paquete registrado correctamente', hawb });

  } catch (error) {
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
        .input('codigo', sql.NVarChar, codigo_referencia)
        .query(`
        SELECT 
          p.id,
          p.numero_guia,
          p.tracking,
          p.hawb,
          p.tienda,
          p.contenido,
          FORMAT(p.peso, 'N2') + ' LB' AS peso,
          p.digitado_por AS usuario,  
          p.notas,    
          FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,
          CASE 
            WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
              RTRIM(c.primer_nombre + ' ' + ISNULL(c.segundo_nombre + ' ', '') + c.primer_apellido + ' ' + ISNULL(c.segundo_apellido, ''))
            ELSE 
              ISNULL(c.nombre_empresa, 'Sin nombre')
          END AS cliente,
          c.codigo_referencia,
          p.estado_actual AS estado,
          p.oficina
        FROM paquetes p
        JOIN clientes c ON p.cliente_id = c.id
        ORDER BY p.fecha_registro DESC
        `);
    } else {
      result = await pool.request().query(`
      SELECT 
        p.id,
        p.numero_guia,
        p.tracking,
        p.hawb,
        p.tienda,
        p.contenido,
        FORMAT(p.peso, 'N2') + ' LB' AS peso,
        p.digitado_por AS usuario,   
        p.notas,                     
        FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,
        CASE 
          WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
            RTRIM(c.primer_nombre + ' ' + ISNULL(c.segundo_nombre + ' ', '') + c.primer_apellido + ' ' + ISNULL(c.segundo_apellido, ''))
          ELSE 
            ISNULL(c.nombre_empresa, 'Sin nombre')
        END AS cliente,
        c.codigo_referencia,
        p.estado_actual AS estado,
        p.oficina
      FROM paquetes p
      JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.fecha_registro DESC
      `);
    }

    res.status(200).json(result.recordset);

  } catch (error) {
    console.error('❌ Error al obtener paquetes:', error);
    res.status(500).json({ mensaje: 'Error al obtener paquetes' });
  }
};



export const generarReporteCSV = async (req, res) => {
  const { fecha, estado } = req.query;
  const pool = await poolPromise;

  try {
    let query = `
      SELECT 
        p.id,
        p.numero_guia,
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
      'id', 'numero_guia', 'tracking', 'hawb', 'tienda',
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
    .query('SELECT 1 FROM paquetes WHERE numero_guia = @valor');
  res.json({ existe: result.recordset.length > 0 });
};


export const buscarPaquetesFiltrados = async (req, res) => {
  const { guia, referencia, cliente, fechaDesde, fechaHasta } = req.body;

  let query = `
    SELECT 
      p.id,
      p.numero_guia AS guia,
      p.tracking,
      p.hawb,
      p.tienda,
      p.contenido,
      p.notas,
      FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha,
      p.ubicacion,
      p.estado_actual AS estado,
      CAST(p.peso AS FLOAT) AS pesoLb,
      CAST(p.peso * 0.453592 AS FLOAT) AS pesoKg,
      p.declaracion_valor,
      CASE 
        WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
          RTRIM(c.primer_nombre + ' ' + ISNULL(c.segundo_nombre + ' ', '') + c.primer_apellido + ' ' + ISNULL(c.segundo_apellido, ''))
        ELSE 
          ISNULL(c.nombre_empresa, 'Sin nombre')
      END AS cliente,
      c.codigo_referencia
    FROM paquetes p
    INNER JOIN clientes c ON p.cliente_id = c.id
    WHERE 1=1
  `;

  const pool = await poolPromise;
  const request = pool.request();

  if (guia) {
    query += " AND (p.numero_guia LIKE @guia OR p.hawb LIKE @guia)";
    request.input("guia", sql.NVarChar, `%${guia}%`);
  }

  if (referencia) {
    query += " AND p.numero_guia LIKE @referencia";
    request.input("referencia", sql.NVarChar, `%${referencia}%`);
  }

  if (cliente) {
    query += " AND (c.nombre_empresa LIKE @cliente OR c.primer_nombre LIKE @cliente)";
    request.input("cliente", sql.NVarChar, `%${cliente}%`);
  }

  if (fechaDesde && fechaHasta) {
    const fechaInicioCompleta = `${fechaDesde} 00:00:00`;
    const fechaFinalCompleta = `${fechaHasta} 23:59:59`;
    query += " AND p.fecha_registro BETWEEN @fechaDesde AND @fechaHasta";
    request.input("fechaDesde", sql.DateTime, fechaInicioCompleta);
    request.input("fechaHasta", sql.DateTime, fechaFinalCompleta);
  }

  query += " ORDER BY p.fecha_registro DESC";

  try {
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al buscar guías:", error);
    res.status(500).json({ mensaje: "Error al buscar guías" });
  }
};

export const editarPaquete = async (req, res) => {
  const { id } = req.params;
  const {
    tracking,
    numero_guia,
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
    servicio_id
  } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('tracking', sql.NVarChar, tracking)
      .input('numero_guia', sql.NVarChar, numero_guia)
      .input('tienda', sql.NVarChar, tienda)
      .input('contenido', sql.NVarChar, contenido)
      .input('peso', sql.Decimal(10,2), peso)
      .input('digitado_por', sql.NVarChar, digitado_por)
      .input('codigo_referencia', sql.NVarChar, codigo_referencia)
      .input('ancho', sql.Int, ancho)
      .input('alto', sql.Int, alto)
      .input('largo', sql.Int, largo)
      .input('declaracion_valor', sql.NVarChar, declaracion_valor)
      .input('ubicacion', sql.NVarChar, ubicacion)
      .input('posicion_arancelaria', sql.NVarChar, posicion_arancelaria)
      .input('agrupado', sql.NVarChar, agrupado ?? 'No agrupado')
      .input('notas', sql.NVarChar, notas)
      .input('servicio_id', sql.Int, servicio_id)
      .query(`
        UPDATE paquetes SET
          tracking = @tracking,
          numero_guia = @numero_guia,
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
          servicio_id = @servicio_id
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
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        UPDATE paquetes
        SET estado_actual = 'Anulado'
        WHERE hawb = @hawb
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: 'No se encontró la guía especificada.' });
    }

    await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .input('estado', sql.NVarChar, 'Anulado')
      .input('observaciones', sql.NVarChar, 'Guía anulada por el usuario.')
      .input('responsable', sql.NVarChar, 'Usuario del sistema')
      .query(`
        INSERT INTO historial_estados (hawb, estado, observaciones, responsable)
        VALUES (@hawb, @estado, @observaciones, @responsable)
      `);
      
    res.json({ mensaje: 'Guía anulada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al anular guía', error });
  }
};

export const actualizarEstadoTracking = async (req, res) => {
  try {
    const { hawb } = req.params;
    const { estado_actual, punto_control, observaciones, responsable } = req.body;

    const pool = await poolPromise;

    const update = await pool.request()
      .input("hawb", sql.NVarChar, hawb)
      .input("estado_actual", sql.NVarChar, estado_actual)
      .input("punto_control", sql.NVarChar, punto_control)
      .query(`
        UPDATE paquetes
        SET estado_actual=@estado_actual, punto_control=@punto_control
        WHERE hawb=@hawb
      `);

    if (update.rowsAffected[0] === 0) {
      return res.status(404).json({ mensaje: "No se encontró el paquete" });
    }

    res.json({ mensaje: "✅ Estado principal actualizado correctamente" });

  } catch (err) {
    console.error("❌", err);
    res.status(500).json({ mensaje: "Error al actualizar estado_actual" });
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
          p.numero_guia,
          p.hawb,
          p.tracking,
          p.tienda,
          p.contenido,
          p.notas,
          CAST(p.peso AS FLOAT) AS peso,
          FORMAT(p.fecha_registro, 'yyyy-MM-dd HH:mm:ss') AS fecha_registro,
          p.estado_actual,
          p.punto_control,
          p.digitado_por AS responsable,
          c.codigo_referencia,
          CASE 
            WHEN LOWER(c.tipo_cliente) = 'personal' THEN 
              RTRIM(c.primer_nombre + ' ' + ISNULL(c.segundo_nombre + ' ', '') + c.primer_apellido + ' ' + ISNULL(c.segundo_apellido, ''))
            ELSE 
              ISNULL(c.nombre_empresa, 'Sin nombre')
          END AS cliente
        FROM paquetes p
        INNER JOIN clientes c ON p.cliente_id = c.id
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
          id,
          hawb,
          FORMAT(fecha, 'yyyy-MM-dd HH:mm:ss') AS fecha,
          estado,
          punto_control,
          observaciones,
          responsable
        FROM historial_estados
        WHERE hawb = @hawb
        ORDER BY fecha DESC
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
    res.status(500).json({ mensaje: 'Error al obtener paquete por HAWB' });
  }
};


export const eliminarEstadoTracking = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const estadoData = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT hawb, estado FROM historial_estados WHERE id = @id');

    if (estadoData.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'Estado no encontrado' });
    }

    const { hawb, estado } = estadoData.recordset[0];

    const estadosHawb = await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        SELECT id, estado
        FROM historial_estados
        WHERE hawb = @hawb
        ORDER BY fecha DESC
      `);

    if (estadosHawb.recordset.length === 1) {
      return res.status(400).json({ mensaje: 'No se puede eliminar el único estado del historial.' });
    }

    const esUltimo = estadosHawb.recordset[0].id === parseInt(id);

    if (esUltimo && estado.toLowerCase() === 'digitado') {
      return res.status(400).json({ mensaje: 'No se puede eliminar el estado "Digitado" si es el último del historial.' });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM historial_estados WHERE id = @id`);

    const nuevoEstado = estadosHawb.recordset.find(e => e.id !== parseInt(id))?.estado || 'Sin estado';

    await pool.request()
      .input('estado_actual', sql.NVarChar, nuevoEstado)
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        UPDATE paquetes
        SET estado_actual = @estado_actual
        WHERE hawb = @hawb
      `);

    res.status(200).json({ mensaje: 'Estado eliminado y estado_actual actualizado' });

  } catch (error) {
    console.error('❌ Error al eliminar estado:', error);
    res.status(500).json({ mensaje: 'Error al eliminar estado' });
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
  try {
    const { hawb, estado, punto_control, observaciones, responsable } = req.body;
    const pool = await poolPromise;

    const existe = await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .query('SELECT 1 FROM paquetes WHERE hawb = @hawb');

    if (existe.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontró el paquete con ese HAWB' });
    }

    await pool.request()
      .input('hawb', sql.NVarChar, hawb)
      .input('estado', sql.NVarChar, estado)
      .input('punto_control', sql.NVarChar, punto_control)
      .input('observaciones', sql.NVarChar, observaciones || '')
      .input('responsable', sql.NVarChar, responsable || '')
      .query(`
        INSERT INTO historial_estados (hawb, estado, punto_control, observaciones, responsable)
        VALUES (@hawb, @estado, @punto_control, @observaciones, @responsable)
      `);

    await pool.request()
      .input('estado_actual', sql.NVarChar, estado)
      .input('punto_control', sql.NVarChar, punto_control)
      .input('hawb', sql.NVarChar, hawb)
      .query(`
        UPDATE paquetes
        SET estado_actual = @estado_actual, punto_control = @punto_control
        WHERE hawb = @hawb
      `);

    return res.status(201).json({ mensaje: 'Estado creado y paquete actualizado' });
  } catch (error) {
    console.error('❌ Error crearEstadoTracking:', error);
    return res.status(500).json({ mensaje: 'Error al crear estado' });
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
          id,
          tracking,
          hawb,        
          tienda, 
          contenido,
          peso,
          estado_actual,
          servicio_id
        FROM paquetes
        WHERE codigo_referencia = @referencia
          AND LOWER(LTRIM(RTRIM(estado_actual))) <> 'Anulado'
        ORDER BY fecha_registro DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener paquetes del cliente:", error);
    res.status(500).json({ message: "Error al obtener paquetes" });
  }
};



  

