import { poolPromise, sql } from "../config/db.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const crearSolicitud = async (req, res) => {
  try {
    const {
      cliente_id,
      usuario_id,
      paquetes,
      destinatario,
      medio_pago,
      observaciones
    } = req.body;

    if (
      !cliente_id ||
      !usuario_id ||
      !Array.isArray(paquetes) ||
      paquetes.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos incompletos o formato inválido."
      });
    }

    const pool = await poolPromise;

    // -----------------------------------------------------------
    // 1) VALIDAR QUE TODOS LOS PAQUETES SEAN DEL MISMO SERVICIO
    // -----------------------------------------------------------
    const paqueteIds = paquetes.map(p => p.id);

    const resultServicios = await pool.request().query(`
      SELECT servicio_id, peso, asegurado
      FROM paquetes
      WHERE id IN (${paqueteIds.join(",")})
    `);

    const serviciosEncontrados = [
      ...new Set(resultServicios.recordset.map(r => r.servicio_id))
    ];

    if (serviciosEncontrados.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "No se encontró servicio para los paquetes seleccionados (servicio_id = null)."
      });
    }

    if (serviciosEncontrados.length > 1) {
      return res.status(400).json({
        ok: false,
        mensaje: "Los paquetes seleccionados pertenecen a servicios diferentes."
      });
    }

    const servicio_id = serviciosEncontrados[0];
    console.log("📦 servicio_id final usado:", servicio_id);

    
    const datosServicio = await pool.request()
      .input("id", sql.Int, servicio_id)
      .query(`
        SELECT nombre, tipo, tarifa_fija_1lb, tarifa_fija_2a5,
               tarifa_fija_6a10, tarifa_por_libra_extra,
               tarifa_por_libra_cc, porcentaje_seguro
        FROM servicios
        WHERE id = @id
      `);

    if (datosServicio.recordset.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Servicio no encontrado para los paquetes."
      });
    }

    const servicio = datosServicio.recordset[0];

    // -----------------------------------------------------------
    // 3) CALCULAR PESO TOTAL Y ASEGURADO TOTAL
    // -----------------------------------------------------------
    const peso_total = resultServicios.recordset.reduce(
      (sum, p) => sum + parseFloat(p.peso || 0),
      0
    );

    const asegurado_total = resultServicios.recordset.reduce(
      (sum, p) => sum + parseFloat(p.asegurado || 0),
      0
    );

    // -----------------------------------------------------------
    // 4) CALCULAR FLETE SEGÚN EL SERVICIO
    // -----------------------------------------------------------
    let fleteUSD = 0;

    if (servicio.tipo === "US-CO") {
      // REGLAS DEFINIDAS
      if (peso_total === 1) {
        fleteUSD = servicio.tarifa_fija_1lb;
      } else if (peso_total >= 2 && peso_total <= 5) {
        fleteUSD = servicio.tarifa_fija_2a5;
      } else if (peso_total >= 6 && peso_total <= 10) {
        fleteUSD = servicio.tarifa_fija_6a10;
      } else {
        // >10 lbs → APLICAR $2 POR LIBRA
        fleteUSD = peso_total * servicio.tarifa_por_libra_extra;
      }
    }

    if (servicio.codigo === "CC") {
      const libraUSD = Number(servicio.tarifa_por_libra_cc || 0);

      const peso_facturable = peso_total < 10 ? 10 : peso_total;

      fleteUSD = peso_facturable * libraUSD;
    }

    // -----------------------------------------------------------
    // 5) CALCULAR SEGURO
    // -----------------------------------------------------------
    const porcentaje = parseFloat(servicio.porcentaje_seguro) / 100;
    const seguroUSD = asegurado_total * porcentaje;

    // -----------------------------------------------------------
    // 6) TOTAL USD
    // -----------------------------------------------------------
    const valor_estimado_usd = fleteUSD + seguroUSD;

    // -----------------------------------------------------------
    // 7) OBTENER TRM ACTUAL
    // -----------------------------------------------------------
    const trmQuery = await pool.request().query(`
      SELECT TOP 1 valor
      FROM trm
      ORDER BY fecha DESC
    `);

    const trmValor = trmQuery.recordset[0]?.valor || 0;
    const valor_moneda_local = valor_estimado_usd * trmValor;

    // -----------------------------------------------------------
    // 8) INSERTAR SOLICITUD
    // -----------------------------------------------------------
    const resultSolicitud = await pool
      .request()
      .input("cliente_id", sql.Int, cliente_id)
      .input("usuario_id", sql.Int, usuario_id)
      .input("destinatario", sql.NVarChar(200), destinatario)
      .input("medio_pago", sql.NVarChar(50), medio_pago)
      .input("observaciones", sql.NVarChar(255), observaciones || "")
      .input("valor_estimado_usd", sql.Decimal(10, 2), valor_estimado_usd)
      .input("valor_moneda_local", sql.Decimal(10, 2), valor_moneda_local)
      .input("servicio_id", sql.Int, servicio_id)
      .query(`
        INSERT INTO solicitudes (
          cliente_id, usuario_id, destinatario, medio_pago,
          observaciones, valor_estimado_usd, valor_moneda_local, servicio_id
        )
        OUTPUT INSERTED.id
        VALUES (
          @cliente_id, @usuario_id, @destinatario, @medio_pago,
          @observaciones, @valor_estimado_usd, @valor_moneda_local, @servicio_id
        )
      `);

    const solicitud_id = resultSolicitud.recordset[0].id;

    // -----------------------------------------------------------
    // 9) ASIGNAR SOLICITUD A LOS PAQUETES
    // -----------------------------------------------------------
    for (const p of paquetes) {
      await pool
        .request()
        .input("solicitud_id", sql.Int, solicitud_id)
        .input("paquete_id", sql.Int, p.id)
        .query(`
          UPDATE paquetes
          SET solicitud_id = @solicitud_id,
              estado_actual = 'Solicitado'
          WHERE id = @paquete_id
        `);
    }

    // -----------------------------------------------------------
    // 10) RESPUESTA FINAL
    // -----------------------------------------------------------
    res.status(201).json({
      ok: true,
      mensaje: "Solicitud creada correctamente",
      codigo: solicitud_id,
      total_usd: valor_estimado_usd,
      total_local: valor_moneda_local
    });

  } catch (error) {
    console.error("❌ Error en crearSolicitud:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error interno al crear la solicitud"
    });
  }
};




/* =======================================================
    2. LISTAR SOLICITUDES
======================================================= */
export const obtenerSolicitudes = async (req, res) => {
  try {
    const { usuario_id, codigo } = req.query;
    const pool = await poolPromise;

    let query = `
      SELECT  
        s.id,
        CONVERT(varchar, s.fecha, 23) AS fecha,
        s.estado,
        s.destinatario,
        d.nombre AS destinatario_nombre,
        s.medio_pago,
        s.observaciones,
        CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente,

        (SELECT STRING_AGG(p.hawb, CHAR(10)) 
        FROM paquetes p WHERE p.solicitud_id = s.id) AS hawbs,

        (SELECT COUNT(*) FROM paquetes p 
        WHERE p.solicitud_id = s.id) AS cantidadPaquetes,

        (SELECT ISNULL(SUM(CAST(p.peso AS DECIMAL(10,2))), 0) 
        FROM paquetes p WHERE p.solicitud_id = s.id) AS pesoTotal

      FROM solicitudes s
      INNER JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN destinatarios d ON d.id = s.destinatario
      WHERE 1 = 1
    `;

      if (codigo) {
        query += ` AND c.codigo_referencia = '${codigo}'`;
      } else if (usuario_id) {
        query += ` AND s.usuario_id = ${usuario_id}`;
      }

      query += `
        AND EXISTS (SELECT 1 FROM paquetes p WHERE p.solicitud_id = s.id)
        ORDER BY s.fecha DESC
      `;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    res.status(500).json({ mensaje: "Error al obtener solicitudes" });
  }
};

/* =======================================================
    3. ACTUALIZAR ESTADO
======================================================= */
export const actualizarEstadoSolicitud = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("estado", sql.VarChar, estado)
      .input("id", sql.Int, id)
      .query(`UPDATE solicitudes SET estado=@estado WHERE id=@id`);

    res.json({ mensaje: "✅ Estado actualizado" });
  } catch (error) {
    console.error("❌ Error al actualizar el estado:", error);
    res.status(500).json({ mensaje: "Error al actualizar" });
  }
};

/* =======================================================
    4. ELIMINAR SOLICITUD
======================================================= */
export const eliminarSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const check = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT id FROM solicitudes WHERE id = @id");

    if (check.recordset.length === 0) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Solicitud no encontrada." });
    }

    await pool
      .request()
      .input("solicitud_id", sql.Int, id)
      .query(`
        UPDATE paquetes
        SET solicitud_id = NULL,
            estado_actual = 'Digitado'
        WHERE solicitud_id = @solicitud_id
      `);

    await pool
      .request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM solicitudes WHERE id = @id`);

    return res.json({
      ok: true,
      mensaje: `Solicitud #${id} eliminada correctamente y paquetes liberados.`,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno al eliminar solicitud." });
  }
};

/* =======================================================
    5. DETALLE SOLICITUD COMPLETA
======================================================= */
export const obtenerDetalleSolicitud = async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;

    const solicitud = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          s.id,
          s.destinatario,
          d.nombre AS destinatario_nombre,
          s.medio_pago,
          s.observaciones,
          s.valor_estimado_usd,
          s.valor_moneda_local,
          s.servicio_id
        FROM solicitudes s
        LEFT JOIN destinatarios d ON s.destinatario = d.id
        WHERE s.id = @id
      `);

    if (solicitud.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const paquetes = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          p.id AS paquete_id,
          p.hawb,
          p.tracking,
          p.peso,
          p.contenido,
          p.asegurado
        FROM paquetes p
        WHERE p.solicitud_id = @id
      `);

    const cargos = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id, tipo_cargo, valor_usd, valor_cop, creado_en
        FROM cargos_adicionales
        WHERE solicitud_id = @id
      `);

    res.json({
      solicitud: solicitud.recordset[0],
      paquetes: paquetes.recordset,
      cargos: cargos.recordset,
    });
  } catch (error) {
    console.error("❌ Error al obtener detalle:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
};


export const obtenerDatosPDFSolicitud = async (req, res) => {
  try {
    const pool = await poolPromise;
    const solicitudId = req.params.id;

    // 1) TRAER DATOS PRINCIPALES
    const solicitudQuery = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT 
          s.id, s.fecha, s.estado,
          s.valor_estimado_usd,
          s.valor_moneda_local,
          s.servicio_id,
          CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente_nombre,
          c.codigo_referencia AS codigoCasillero,
          d.nombre AS destinatario_nombre,
          d.ciudad AS destinatario_ciudad,
          d.direccion AS destinatario_direccion,
          d.telefono AS destinatario_telefono
        FROM solicitudes s
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN destinatarios d ON s.destinatario = d.id
        WHERE s.id = @id
      `);

    if (solicitudQuery.recordset.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    const solicitud = solicitudQuery.recordset[0];

    const paquetes = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT tracking, hawb, peso, contenido, asegurado
        FROM paquetes
        WHERE solicitud_id = @id
      `);

    // 3) TRAER CARGOS
    const cargos = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT tipo_cargo, valor_usd, valor_cop
        FROM cargos_adicionales
        WHERE solicitud_id = @id
      `);

    // 4) TRAER DATOS DEL SERVICIO
    const servicioQuery = await pool
      .request()
      .input("id", sql.Int, solicitud.servicio_id)
      .query(`
        SELECT 
          codigo,
          tipo,
          tarifa_fija_1lb,
          tarifa_fija_2a5,
          tarifa_fija_6a10,
          tarifa_por_libra_extra,
          tarifa_por_libra_cc,
          porcentaje_seguro
        FROM servicios
        WHERE id = @id
      `);

    const servicio = servicioQuery.recordset[0];

    // 5) CALCULAR PESO Y ASEGURADO TOTAL
    const totalPeso = paquetes.recordset.reduce((sum, p) => sum + Number(p.peso || 0), 0);
    const totalAsegurado = paquetes.recordset.reduce((sum, p) => sum + Number(p.asegurado || 0), 0);

    // 6) CALCULAR FLETE SEGÚN EL SERVICIO (MISMA LÓGICA DE crearSolicitud)
    let fleteUSD = 0;

    // US-CO
    if (servicio.tipo === "US-CO") {
      if (totalPeso === 1) {
        fleteUSD = servicio.tarifa_fija_1lb;
      } else if (totalPeso >= 2 && totalPeso <= 5) {
        fleteUSD = servicio.tarifa_fija_2a5;
      } else if (totalPeso >= 6 && totalPeso <= 10) {
        fleteUSD = servicio.tarifa_fija_6a10;
      } else {
        fleteUSD = totalPeso * servicio.tarifa_por_libra_extra;
      }
    }

    // CC-Casilleros
    if (servicio.codigo === "CC") {
      const precioLibra = Number(servicio.tarifa_por_libra_cc);
      const pesoFacturable = totalPeso < 10 ? 10 : totalPeso;
      fleteUSD = pesoFacturable * precioLibra;
    }

    // 7) CALCULAR SEGURO
    const porcentaje = servicio.porcentaje_seguro / 100;
    const seguroUSD = totalAsegurado * porcentaje;

    // 8) TOTAL USD SIN CARGOS
    const totalUSD = fleteUSD + seguroUSD;

    // 9) OBTENER TRM
    const trmQuery = await pool.request().query(`
      SELECT TOP 1 valor 
      FROM trm 
      ORDER BY fecha DESC
    `);

    const trm = trmQuery.recordset[0]?.valor || 0;

    const totalCOP = totalUSD * trm;

    // 10) CARGOS
    const totalCargosUSD = cargos.recordset.reduce(
      (sum, c) => sum + Number(c.valor_usd || 0),
      0
    );

    const totalCargosCOP = cargos.recordset.reduce(
      (sum, c) => sum + Number(c.valor_cop || 0),
      0
    );

    // 11) TOTAL FINAL
    const totalUSDConCargos = totalUSD + totalCargosUSD;
    const totalCOPConCargos = totalCOP + totalCargosCOP;

    // 12) RESPUESTA LISTA PARA EL PDF
    res.json({
      ...solicitud,
      paquetes: paquetes.recordset,
      cargos: cargos.recordset,
      totalAseguradoUSD: totalAsegurado,
      seguroUSD,
      fleteUSD,
      totalUSD,
      totalUSDConCargos,
      totalCOP,
      totalCargosUSD,
      totalCargosCOP,
      totalCOPConCargos,
      trm
    });

  } catch (err) {
    console.error("❌ Error en obtenerDatosPDFSolicitud", err);
    res.status(500).json({ error: "Error generando datos para PDF" });
  }
};



export const obtenerCargosAdicionales = async (req, res) => {
  try {
    const solicitudId = req.params.id;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("solicitud_id", sql.Int, solicitudId)
      .query(`
        SELECT id, tipo_cargo, valor_usd, valor_cop, creado_en
        FROM cargos_adicionales
        WHERE solicitud_id = @solicitud_id
        ORDER BY creado_en ASC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error obteniendo cargos adicionales:", error);
    res.status(500).json({ mensaje: "Error interno consultando cargos" });
  }
};

export const agregarCargoAdicional = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_cargo, valor_usd, valor_cop } = req.body;

    if (!tipo_cargo || valor_usd === undefined || valor_cop === undefined) {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos incompletos para el cargo adicional",
      });
    }

    const pool = await poolPromise;

    await pool
      .request()
      .input("solicitud_id", sql.Int, id)
      .input("tipo_cargo", sql.VarChar(100), tipo_cargo)
      .input("valor_usd", sql.Decimal(10, 2), valor_usd)
      .input("valor_cop", sql.Decimal(18, 2), valor_cop)
      .query(`
        INSERT INTO cargos_adicionales
        (solicitud_id, tipo_cargo, valor_usd, valor_cop)
        VALUES (@solicitud_id, @tipo_cargo, @valor_usd, @valor_cop)
      `);

    const result = await pool
      .request()
      .input("solicitud_id", sql.Int, id)
      .query(`
        SELECT id, tipo_cargo, valor_usd, valor_cop, creado_en
        FROM cargos_adicionales
        WHERE solicitud_id = @solicitud_id
        ORDER BY creado_en ASC
      `);

    res.json({
      ok: true,
      mensaje: "Cargo agregado correctamente",
      cargos: result.recordset,
    });
  } catch (error) {
    console.error("❌ Error agregando cargo adicional:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
};

/* =======================================================
    8. PAQUETES (CRUD)
======================================================= */
export const actualizarPaqueteSolicitud = async (req, res) => {
  try {
    const { paquete_id } = req.params;
    const { peso, asegurado, contenido } = req.body;

    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, paquete_id)
      .input("peso", sql.Decimal(10, 2), peso)
      .input("asegurado", sql.Decimal(10, 2), asegurado)
      .input("contenido", sql.NVarChar(255), contenido)
      .query(`
        UPDATE paquetes
        SET peso = @peso,
            asegurado = @asegurado,
            contenido = @contenido
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Paquete actualizado" });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "Error actualizando paquete" });
  }
};

export const removerPaqueteDeSolicitud = async (req, res) => {
  try {
    const { paquete_id } = req.params;

    const pool = await poolPromise;

    await pool
      .request()
      .input("id", sql.Int, paquete_id)
      .query(`
        UPDATE paquetes
        SET solicitud_id = NULL,
            estado_actual = 'Digitado'
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Paquete removido de la solicitud" });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "Error removiendo paquete" });
  }
};

export const agregarPaqueteASolicitud = async (req, res) => {
  try {
    const { solicitud_id } = req.params;
    const { paquete_id } = req.body;

    const pool = await poolPromise;

    await pool
      .request()
      .input("solicitud_id", sql.Int, solicitud_id)
      .input("paquete_id", sql.Int, paquete_id)
      .query(`
        UPDATE paquetes
        SET solicitud_id = @solicitud_id,
            estado_actual = 'Solicitado'
        WHERE id = @paquete_id
      `);

    res.json({ ok: true, mensaje: "Paquete agregado a la solicitud" });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "Error agregando paquete" });
  }
};


export const editarSolicitudCompleta = async (req, res) => {
  const { id } = req.params;
  const { paquetes, cargos } = req.body;

  if (!Array.isArray(paquetes) || !Array.isArray(cargos)) {
    return res.status(400).json({
      ok: false,
      mensaje: "Formato inválido para paquetes o cargos.",
    });
  }

  try {
    const pool = await poolPromise;

    for (const p of paquetes) {
      await pool
        .request()
        .input("paquete_id", sql.Int, p.paquete_id)
        .input("peso", sql.Decimal(10, 2), p.peso)
        .input("asegurado", sql.Decimal(10, 2), p.asegurado)
        .input("contenido", sql.NVarChar(255), p.contenido)
        .query(`
          UPDATE paquetes
          SET peso = @peso,
              asegurado = @asegurado,
              contenido = @contenido
          WHERE id = @paquete_id
        `);
    }

    const cargosDB = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`SELECT id FROM cargos_adicionales WHERE solicitud_id = @id`);

    const idsExistentes = cargosDB.recordset.map((c) => c.id);
    const idsRecibidos = cargos.map((c) => c.id).filter(Boolean);

    const idsEliminar = idsExistentes.filter(
      (idCargo) => !idsRecibidos.includes(idCargo)
    );

    for (const cargoID of idsEliminar) {
      await pool
        .request()
        .input("id", sql.Int, cargoID)
        .query(`DELETE FROM cargos_adicionales WHERE id = @id`);
    }

    for (const c of cargos) {
      if (!c.id) {
        await pool
          .request()
          .input("solicitud_id", sql.Int, id)
          .input("tipo_cargo", sql.VarChar(100), c.tipo_cargo)
          .input("valor_usd", sql.Decimal(10, 2), c.valor_usd)
          .input("valor_cop", sql.Decimal(18, 2), c.valor_cop)
          .query(`
            INSERT INTO cargos_adicionales (solicitud_id, tipo_cargo, valor_usd, valor_cop)
            VALUES (@solicitud_id, @tipo_cargo, @valor_usd, @valor_cop)
          `);
      } else {
        await pool
          .request()
          .input("id", sql.Int, c.id)
          .input("tipo_cargo", sql.VarChar(100), c.tipo_cargo)
          .input("valor_usd", sql.Decimal(10, 2), c.valor_usd)
          .input("valor_cop", sql.Decimal(18, 2), c.valor_cop)
          .query(`
            UPDATE cargos_adicionales
            SET tipo_cargo = @tipo_cargo,
                valor_usd = @valor_usd,
                valor_cop = @valor_cop
            WHERE id = @id
          `);
      }
    }

    res.json({
      ok: true,
      mensaje: "Solicitud actualizada correctamente.",
    });
  } catch (error) {
    console.error("❌ Error en editarSolicitudCompleta:", error);
    res.status(500).json({
      ok: false,
      mensaje: "Error actualizando solicitud.",
    });
  }
};


export const obtenerCatalogoCargos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, nombre_cargo 
      FROM cargos_adicionales_catalogo
      ORDER BY nombre_cargo ASC
    `);

    res.json(result.recordset);

  } catch (error) {
    console.error("❌ Error obteniendo catálogo de cargos:", error);
    res.status(500).json({ mensaje: "Error interno consultando catálogo" });
  }
};

/* =======================================================
     SUBIR O ACTUALIZAR COMPROBANTE DE PAGO
========================================================= */
export const subirComprobantePago = async (req, res) => {
  try {
    const solicitudId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: "No se envió ningún archivo." });
    }

    const nuevoPath = `/uploads/comprobantes/${req.file.filename}`;
    const pool = await poolPromise;

    // Obtener comprobante actual
    const solicitud = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`SELECT comprobante_pago_url FROM solicitudes WHERE id = @id`);

    if (solicitud.recordset.length === 0) {
      return res.status(404).json({ ok: false, mensaje: "Solicitud no encontrada." });
    }

    const comprobanteActual = solicitud.recordset[0].comprobante_pago_url;

    // Si existe un archivo anterior, borrarlo
    if (comprobanteActual) {
      const rutaFisica = path.join(__dirname, "..", comprobanteActual);
      if (fs.existsSync(rutaFisica)) fs.unlinkSync(rutaFisica);
    }

    // Actualizar nuevo comprobante
    await pool.request()
      .input("id", sql.Int, solicitudId)
      .input("url", sql.NVarChar, nuevoPath)
      .query(`
        UPDATE solicitudes 
        SET comprobante_pago_url = @url 
        WHERE id = @id
      `);

    res.json({
      ok: true,
      mensaje: "Comprobante actualizado correctamente",
      url: nuevoPath
    });

  } catch (error) {
    console.error("❌ Error en subirComprobantePago:", error);
    res.status(500).json({ ok: false, mensaje: "Error al subir comprobante" });
  }
};


export const obtenerComprobantePago = async (req, res) => {
  try {
    const solicitudId = req.params.id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT comprobante_pago_url 
        FROM solicitudes 
        WHERE id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const url = result.recordset[0].comprobante_pago_url;

    if (!url) {
      return res.status(404).json({ mensaje: "La solicitud no tiene comprobante cargado." });
    }

    const filePath = path.join(__dirname, "..", url);
    res.sendFile(filePath);

  } catch (error) {
    console.error("❌ Error obteniendo comprobante:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
};

export const eliminarComprobantePago = async (req, res) => {
  try {
    const solicitudId = req.params.id;
    const pool = await poolPromise;

    const solicitud = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT comprobante_pago_url 
        FROM solicitudes 
        WHERE id = @id
      `);

    if (!solicitud.recordset.length) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const comprobante = solicitud.recordset[0].comprobante_pago_url;

    if (comprobante) {
      const filePath = path.join(__dirname, "..", comprobante);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        UPDATE solicitudes 
        SET comprobante_pago_url = NULL
        WHERE id = @id
      `);

    res.json({ ok: true, mensaje: "Comprobante eliminado correctamente." });

  } catch (error) {
    console.error("❌ Error eliminando comprobante:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
};



