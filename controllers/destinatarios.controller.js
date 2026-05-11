import { poolPromise, sql } from '../config/db.js';

export const buscarClienteDestinatarios = async (req, res) => {
  try {
    const { texto } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("texto", `%${texto}%`)
      .query(`
        SELECT TOP 10 
          id, 
          CONCAT(primer_nombre, ' ', primer_apellido) AS nombre, 
          codigo_referencia 
        FROM clientes
        WHERE primer_nombre LIKE @texto
           OR primer_apellido LIKE @texto
           OR codigo_referencia LIKE @texto
        ORDER BY primer_nombre ASC
      `);

    res.json(result.recordset);

  } catch (error) {
    res.status(500).json({ ok: false, msg: "Error buscando cliente" });
  }
};



export const crearDestinatario = async (req, res) => {
  try {
    const { cliente_id, nombre, direccion, pais, departamento, ciudad, telefono } = req.body;

    const pool = await poolPromise;

    await pool.request()
      .input("cliente_id", cliente_id)
      .input("nombre", nombre)
      .input("direccion", direccion)
      .input("pais", pais)
      .input("departamento", departamento)
      .input("ciudad", ciudad)
      .input("telefono", telefono)
      .query(`
        INSERT INTO destinatarios (cliente_id, nombre, direccion, pais, departamento, ciudad, telefono, activo)
        VALUES (@cliente_id, @nombre, @direccion, @pais, @departamento, @ciudad, @telefono, 1)
      `);

    return res.status(200).json({ ok: true, msg: "Destinatario creado correctamente" });

  } catch (error) {
    res.status(500).json({ ok: false, msg: "Error al crear destinatario" });
  }
};

export const listarDestinatarios = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("cliente_id", sql.Int, cliente_id)
      .query(`
        SELECT 
          d.id,
          d.cliente_id,
          d.nombre,
          d.telefono,
          d.direccion,
          d.pais_id,
          d.region_id,
          d.ciudad_id,

          ISNULL(p.nombre, d.pais) AS pais,
          ISNULL(r.nombre, d.departamento) AS departamento,
          ISNULL(c.nombre, d.ciudad) AS ciudad,

          d.activo,
          d.es_default
        FROM destinatarios d
        LEFT JOIN paises p ON p.id = d.pais_id
        LEFT JOIN regiones r ON r.id = d.region_id
        LEFT JOIN ciudades c ON c.id = d.ciudad_id
        WHERE d.cliente_id = @cliente_id
          AND d.activo = 1
        ORDER BY d.es_default DESC, d.nombre ASC
      `);

    res.json(result.recordset);

  } catch (error) {
    console.error("Error al obtener destinatarios:", error);
    res.status(500).json({ message: "Error al obtener destinatarios" });
  }
};

export const eliminarDestinatario = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const verificacion = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT es_default
        FROM destinatarios
        WHERE id = @id
      `);

    if (verificacion.recordset.length === 0) {
      return res.status(404).json({
        ok: false,
        msg: "Destinatario no encontrado",
      });
    }

    if (verificacion.recordset[0].es_default) {
      return res.status(403).json({
        ok: false,
        msg: "No se puede eliminar el destinatario principal del cliente",
      });
    }

    // 2️⃣ Eliminar si NO es default
    await pool.request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM destinatarios
        WHERE id = @id
      `);

    return res.json({
      ok: true,
      msg: "Destinatario eliminado correctamente",
    });

  } catch (err) {
    console.error("❌ Error eliminando destinatario:", err);
    return res.status(500).json({
      ok: false,
      msg: "Error eliminando destinatario",
    });
  }
};


export const editarDestinatario = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, 
      direccion, 
      ciudad, 
      departamento, 
      pais, 
      telefono,
      pais_id,
      region_id,
      ciudad_id
    } = req.body;

    const pool = await poolPromise;

    await pool.request()
    .input("id", sql.Int, id)
    .input("nombre", sql.NVarChar(150), nombre)
    .input("direccion", sql.NVarChar(200), direccion)
    .input("ciudad", sql.NVarChar(80), ciudad)
    .input("departamento", sql.NVarChar(80), departamento)
    .input("pais", sql.NVarChar(80), pais)
    .input("telefono", sql.NVarChar(50), telefono)
    .input("pais_id", sql.Int, pais_id || null)
    .input("region_id", sql.Int, region_id || null)
    .input("ciudad_id", sql.Int, ciudad_id || null)
    .query(`
      UPDATE destinatarios
      SET nombre = @nombre,
          direccion = @direccion,
          ciudad = @ciudad,
          departamento = @departamento,
          pais = @pais,
          telefono = @telefono,
          pais_id = @pais_id,
          region_id = @region_id,
          ciudad_id = @ciudad_id
      WHERE id = @id
    `);

    res.json({ ok: true, mensaje: "Destinatario actualizado correctamente" });

  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error editando destinatario" });
  }
};

export const obtenerDestinatariosPorCliente = async (req, res) => {
  const { codigoCasillero } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("codigo", sql.NVarChar, codigoCasillero)
      .query(`
        SELECT 
          d.id,
          d.nombre,
          d.ciudad,
          d.direccion,
          d.telefono,
          d.es_default
        FROM destinatarios d
        INNER JOIN clientes c ON d.cliente_id = c.id
        WHERE c.codigo_referencia = @codigo
          AND d.activo = 1
        ORDER BY d.es_default DESC, d.nombre ASC
      `);

    return res.json({
      ok: true,
      destinatarios: result.recordset
    });

  } catch (error) {
    console.error("❌ Error en obtenerDestinatariosPorCliente:", error);
    return res.status(500).json({ ok: false, mensaje: "Error obteniendo destinatarios" });
  }
};







