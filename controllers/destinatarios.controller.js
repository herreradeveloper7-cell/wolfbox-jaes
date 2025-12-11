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
    console.log("❌ Error buscando cliente:", error);
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
    console.log("❌ Error al crear destinatario:", error);
    res.status(500).json({ ok: false, msg: "Error al crear destinatario" });
  }
};

export const listarDestinatarios = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    const pool = await poolPromise;
    const result = await pool.request()
      .input("cliente_id", cliente_id)
      .query(`
        SELECT id, cliente_id, nombre, telefono, direccion, ciudad, departamento, pais, activo
        FROM destinatarios
        WHERE cliente_id = @cliente_id
        ORDER BY nombre ASC
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
    await pool.request()
      .input("id", id)
      .query(`
        DELETE FROM destinatarios WHERE id = @id
      `);

    return res.json({ ok: true, msg: "Destinatario eliminado" });

  } catch (err) {
    return res.status(500).json({ ok: false, msg: "Error eliminando destinatario" });
  }
};


export const editarDestinatario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, ciudad, departamento, pais, telefono } = req.body; 

    const pool = await poolPromise;

    await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.NVarChar(150), nombre)
      .input("direccion", sql.NVarChar(200), direccion)
      .input("ciudad", sql.NVarChar(80), ciudad)
      .input("departamento", sql.NVarChar(80), departamento) 
      .input("pais", sql.NVarChar(80), pais)
      .input("telefono", sql.NVarChar(50), telefono)
      .query(`
        UPDATE destinatarios
        SET nombre=@nombre,
            direccion=@direccion,
            ciudad=@ciudad,
            departamento=@departamento,   
            pais=@pais,
            telefono=@telefono
        WHERE id=@id
      `);

    res.json({ ok: true, mensaje: "Destinatario actualizado correctamente" });

  } catch (error) {
    console.log("❌ Error en editarDestinatario:", error);
    res.status(500).json({ ok: false, mensaje: "Error editando destinatario" });
  }
};






