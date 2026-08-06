import { poolPromise, sql } from "../../config/db.js";
import {
  calcularCotizacionServicio,
  normalizarRangosTarifa,
  validarRangosTarifa,
} from "../../utils/tarifas.helpers.js";

export const obtenerRangosPorServicios = async (pool, ids) => {
  if (!ids.length) return new Map();
  const request = pool.request();
  const parametros = ids.map((id, index) => {
    request.input(`id_${index}`, sql.Int, id);
    return `@id_${index}`;
  });
  const result = await request.query(`
    SELECT id, servicio_id, peso_desde, peso_hasta, valor_usd, orden
    FROM servicio_tarifas_rangos
    WHERE servicio_id IN (${parametros.join(",")})
    ORDER BY servicio_id, orden, peso_desde
  `);
  const mapa = new Map();
  result.recordset.forEach((rango) => {
    if (!mapa.has(rango.servicio_id)) mapa.set(rango.servicio_id, []);
    mapa.get(rango.servicio_id).push(rango);
  });
  return mapa;
};

const guardarRangos = async (transaction, servicioId, rangos) => {
  await new sql.Request(transaction)
    .input("servicio_id", sql.Int, servicioId)
    .query("DELETE FROM servicio_tarifas_rangos WHERE servicio_id = @servicio_id");

  for (const [index, rango] of rangos.entries()) {
    await new sql.Request(transaction)
      .input("servicio_id", sql.Int, servicioId)
      .input("peso_desde", sql.Decimal(10, 2), rango.peso_desde)
      .input("peso_hasta", sql.Decimal(10, 2), rango.peso_hasta)
      .input("valor_usd", sql.Decimal(10, 2), rango.valor_usd)
      .input("orden", sql.Int, index)
      .query(`
        INSERT INTO servicio_tarifas_rangos
          (servicio_id, peso_desde, peso_hasta, valor_usd, orden)
        VALUES
          (@servicio_id, @peso_desde, @peso_hasta, @valor_usd, @orden)
      `);
  }
};

const seguroMinimoValido = (valor) =>
  Number.isFinite(Number(valor)) && Number(valor) > 0;


export const obtenerServicios = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        id,
        codigo,
        nombre,
        tipo,
        descripcion,
        tarifa_fija_1lb,
        tarifa_fija_2a5,
        tarifa_fija_6a10,
        tarifa_por_libra_extra,
        tarifa_por_libra_cc,
        porcentaje_seguro,
        seguro_minimo_usd,
        aplica_minimo,
        peso_minimo,
        tarifa_minima_usd,
        aplica_peso_maximo,
        peso_maximo
      FROM servicios
      ORDER BY nombre
    `);

    const rangos = await obtenerRangosPorServicios(pool, result.recordset.map((servicio) => servicio.id));
    res.json({
      ok: true,
      servicios: result.recordset.map((servicio) => ({
        ...servicio,
        tarifas_rangos: rangos.get(servicio.id) || [],
      })),
    });
  } catch (err) {
    console.error("❌ Error obteniendo servicios:", err);
    res.status(500).json({ ok: false, mensaje: "Error al obtener servicios" });
  }
};



export const crearServicio = async (req, res) => {
  let transaction;
  try {
    const {
      codigo,
      nombre,
      tipo,
      descripcion,
      tarifa_fija_1lb,
      tarifa_fija_2a5,
      tarifa_fija_6a10,
      tarifa_por_libra_extra,
      tarifa_por_libra_cc,
      porcentaje_seguro,
      seguro_minimo_usd,
      aplica_minimo,
      peso_minimo,
      tarifa_minima_usd,
      aplica_peso_maximo,
      peso_maximo
      , tarifas_rangos, tipo_tarifa
    } = req.body;

    if (!codigo || !nombre || !tipo) {
      const campo = !codigo ? "codigo" : !nombre ? "nombre" : "tipo";
      return res.status(400).json({
        ok: false,
        campo,
        mensaje: "Código, nombre y tipo son obligatorios."
      });
    }

    const pool = await poolPromise;
    const rangos = normalizarRangosTarifa(tarifas_rangos);
    if (tipo_tarifa === "rango") {
      const validacion = validarRangosTarifa(rangos);
      if (!validacion.ok) return res.status(400).json({ ok: false, campo: "tarifas_rangos", mensaje: validacion.mensaje });
    }

    if (!seguroMinimoValido(seguro_minimo_usd)) {
      return res.status(400).json({
        ok: false,
        campo: "seguro_minimo_usd",
        mensaje: "El seguro mínimo es obligatorio y debe ser mayor a 0.",
      });
    }

    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const creado = await new sql.Request(transaction)
      .input("codigo", sql.VarChar, codigo)
      .input("nombre", sql.VarChar, nombre)
      .input("tipo", sql.VarChar, tipo)
      .input("descripcion", sql.VarChar, descripcion || "")
      .input("tarifa_fija_1lb", sql.Decimal(10,2), tarifa_fija_1lb || 0)
      .input("tarifa_fija_2a5", sql.Decimal(10,2), tarifa_fija_2a5 || 0)
      .input("tarifa_fija_6a10", sql.Decimal(10,2), tarifa_fija_6a10 || 0)
      .input("tarifa_por_libra_extra", sql.Decimal(10,2), tarifa_por_libra_extra || 0)
      .input("tarifa_por_libra_cc", sql.Decimal(10,2), tarifa_por_libra_cc || 0)
      .input("porcentaje_seguro", sql.Decimal(5,2), porcentaje_seguro || 0)
      .input("seguro_minimo_usd", sql.Decimal(10,2), seguro_minimo_usd || 0)
      .input("aplica_minimo", sql.Bit, aplica_minimo || 0)
      .input("peso_minimo", sql.Decimal(10,2), peso_minimo || 0)
      .input("tarifa_minima_usd", sql.Decimal(10,2), tarifa_minima_usd || 0)
      .input("aplica_peso_maximo", sql.Bit, aplica_peso_maximo || 0)
      .input("peso_maximo", sql.Decimal(10,2), peso_maximo || 0)

      .query(`
        INSERT INTO servicios (
          codigo, nombre, tipo, descripcion,
          tarifa_fija_1lb, tarifa_fija_2a5, tarifa_fija_6a10,
          tarifa_por_libra_extra, tarifa_por_libra_cc,
          porcentaje_seguro, seguro_minimo_usd, aplica_minimo, peso_minimo, tarifa_minima_usd,
          aplica_peso_maximo, peso_maximo
        )
        OUTPUT INSERTED.id
        VALUES (
          @codigo, @nombre, @tipo, @descripcion,
          @tarifa_fija_1lb, @tarifa_fija_2a5, @tarifa_fija_6a10,
          @tarifa_por_libra_extra, @tarifa_por_libra_cc,
          @porcentaje_seguro, @seguro_minimo_usd, @aplica_minimo, @peso_minimo, @tarifa_minima_usd,
          @aplica_peso_maximo, @peso_maximo
        )
      `);

    await guardarRangos(transaction, creado.recordset[0].id, rangos);
    await transaction.commit();

    res.json({
      ok: true,
      mensaje: "Servicio creado correctamente."
    });

  } catch (err) {
    if (transaction) {
      try { await transaction.rollback(); } catch {}
    }
    console.error("❌ Error creando servicio:", err);
    res.status(500).json({ ok: false, mensaje: "Error al crear servicio" });
  }
};



export const actualizarServicio = async (req, res) => {
  let transaction;
  try {
    const { id } = req.params;

    const {
      codigo,
      nombre,
      tipo,
      descripcion,
      tarifa_fija_1lb,
      tarifa_fija_2a5,
      tarifa_fija_6a10,
      tarifa_por_libra_extra,
      tarifa_por_libra_cc,
      porcentaje_seguro,
      seguro_minimo_usd,
      aplica_minimo,
      peso_minimo,
      tarifa_minima_usd,
      aplica_peso_maximo,
      peso_maximo
      , tarifas_rangos, tipo_tarifa
    } = req.body;

    if (!seguroMinimoValido(seguro_minimo_usd)) {
      return res.status(400).json({
        ok: false,
        campo: "seguro_minimo_usd",
        mensaje: "El seguro mínimo es obligatorio y debe ser mayor a 0.",
      });
    }

    const pool = await poolPromise;
    const rangos = normalizarRangosTarifa(tarifas_rangos);
    if (tipo_tarifa === "rango") {
      const validacion = validarRangosTarifa(rangos);
      if (!validacion.ok) return res.status(400).json({ ok: false, campo: "tarifas_rangos", mensaje: validacion.mensaje });
    }
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    await new sql.Request(transaction)
      .input("id", sql.Int, id)
      .input("codigo", sql.VarChar, codigo)
      .input("nombre", sql.VarChar, nombre)
      .input("tipo", sql.VarChar, tipo)
      .input("descripcion", sql.VarChar, descripcion || "")
      .input("tarifa_fija_1lb", sql.Decimal(10,2), tarifa_fija_1lb || 0)
      .input("tarifa_fija_2a5", sql.Decimal(10,2), tarifa_fija_2a5 || 0)
      .input("tarifa_fija_6a10", sql.Decimal(10,2), tarifa_fija_6a10 || 0)
      .input("tarifa_por_libra_extra", sql.Decimal(10,2), tarifa_por_libra_extra || 0)
      .input("tarifa_por_libra_cc", sql.Decimal(10,2), tarifa_por_libra_cc || 0)
      .input("porcentaje_seguro", sql.Decimal(5,2), porcentaje_seguro || 0)
      .input("seguro_minimo_usd", sql.Decimal(10,2), seguro_minimo_usd || 0)
      .input("aplica_minimo", sql.Bit, aplica_minimo || 0)
      .input("peso_minimo", sql.Decimal(10,2), peso_minimo || 0)
      .input("tarifa_minima_usd", sql.Decimal(10,2), tarifa_minima_usd || 0)
      .input("aplica_peso_maximo", sql.Bit, aplica_peso_maximo || 0)
      .input("peso_maximo", sql.Decimal(10,2), peso_maximo || 0)
      .query(`
        UPDATE servicios
        SET
          codigo = @codigo,
          nombre = @nombre,
          tipo = @tipo,
          descripcion = @descripcion,
          tarifa_fija_1lb = @tarifa_fija_1lb,
          tarifa_fija_2a5 = @tarifa_fija_2a5,
          tarifa_fija_6a10 = @tarifa_fija_6a10,
          tarifa_por_libra_extra = @tarifa_por_libra_extra,
          tarifa_por_libra_cc = @tarifa_por_libra_cc,
          porcentaje_seguro = @porcentaje_seguro,
          seguro_minimo_usd = @seguro_minimo_usd,
          aplica_minimo = @aplica_minimo,
          peso_minimo = @peso_minimo,
          tarifa_minima_usd = @tarifa_minima_usd,
          aplica_peso_maximo = @aplica_peso_maximo,
          peso_maximo = @peso_maximo
        WHERE id = @id
      `);

    await guardarRangos(transaction, Number(id), rangos);
    await transaction.commit();

    res.json({ ok: true, mensaje: "Servicio actualizado correctamente." });

  } catch (err) {
    if (transaction) {
      try { await transaction.rollback(); } catch {}
    }
    console.error("❌ Error actualizando servicio:", err);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar servicio" });
  }
};



export const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    const usados = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT TOP 1 id FROM paquetes WHERE servicio_id = @id`);

    if (usados.recordset.length > 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "Este servicio no se puede eliminar porque ya tiene paquetes asociados."
      });
    }

    await pool.request()
      .input("id", sql.Int, id)
      .query(`DELETE FROM servicios WHERE id = @id`);

    res.json({ ok: true, mensaje: "Servicio eliminado correctamente." });

  } catch (err) {
    console.error("❌ Error eliminando servicio:", err);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar servicio" });
  }
};


export const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          id,
          codigo,
          nombre,
          tipo,
          descripcion,
          tarifa_fija_1lb,
          tarifa_fija_2a5,
          tarifa_fija_6a10,
          tarifa_por_libra_extra,
          tarifa_por_libra_cc,
          porcentaje_seguro,
          seguro_minimo_usd,
          aplica_minimo,
          peso_minimo,
          tarifa_minima_usd,
          aplica_peso_maximo,
          peso_maximo
        FROM servicios
        WHERE id = @id
      `);

    if (!result.recordset[0]) {
      return res.status(404).json({ ok: false, mensaje: "Servicio no encontrado" });
    }

    const rangos = await obtenerRangosPorServicios(pool, [Number(id)]);
    return res.json({
      ok: true,
      servicio: { ...result.recordset[0], tarifas_rangos: rangos.get(Number(id)) || [] },
    });

  } catch (error) {
    console.error("❌ Error obteniendo servicio por ID:", error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener servicio" });
  }
};

export const calcularTarifaServicio = async (req, res) => {
  try {
    const { servicio_id, servicio: configuracion, peso_total, valor_asegurado } = req.body;
    const pool = await poolPromise;

    let servicio = configuracion;
    if (servicio_id) {
      const result = await pool.request()
        .input("id", sql.Int, Number(servicio_id))
        .query("SELECT TOP 1 * FROM servicios WHERE id = @id");
      if (!result.recordset.length) {
        return res.status(404).json({ ok: false, mensaje: "Servicio no encontrado." });
      }
      const rangos = await obtenerRangosPorServicios(pool, [Number(servicio_id)]);
      servicio = { ...result.recordset[0], tarifas_rangos: rangos.get(Number(servicio_id)) || [] };
    }

    if (!servicio) return res.status(400).json({ ok: false, mensaje: "Servicio requerido." });
    const calculo = calcularCotizacionServicio(servicio, peso_total, valor_asegurado);
    return res.status(calculo.ok ? 200 : 400).json(calculo);
  } catch (error) {
    console.error("Error calculando tarifa del servicio:", error);
    return res.status(500).json({ ok: false, mensaje: "Error calculando la tarifa." });
  }
};
