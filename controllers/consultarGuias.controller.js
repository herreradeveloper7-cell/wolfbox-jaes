import { poolPromise, sql } from "../config/db.js";

export const buscarGuias = async (req, res) => {

  const {
    guia = "",
    referencia,
    servicio,
    fechaDesde,
    fechaHasta,
    cliente,
    usuario,
    oficina,
    tienda,
    trackingCasillero,
  } = req.body;

  try {

    const pool = await poolPromise;
    const request = pool.request();

    request.input("guia", sql.VarChar(sql.MAX), `%${guia}%`);

    let query = `

      WITH UltimoEstado AS (
        SELECT 
          h.hawb,
          h.estado_id,
          h.punto_control,
          h.fecha
        FROM historial_estados h
        INNER JOIN (
          SELECT hawb, MAX(fecha) AS fecha_max
          FROM historial_estados
          GROUP BY hawb
        ) x
          ON h.hawb = x.hawb
         AND h.fecha = x.fecha_max
      )

      SELECT
        p.id,
        ISNULL(p.hawb, p.referencia) AS guia,
        p.tracking,
        p.referencia,
        p.contenido,
        p.fecha_registro AS fecha,
        p.ubicacion,

        ec.nombre AS estado,

        p.peso AS pesoLb,
        (p.peso * 0.453592) AS pesoKg,
        p.declaracion_valor,
        p.codigo_referencia,
        p.digitado_por,

        s.nombre AS servicio,

        d.nombre    AS destinatario_nombre,
        d.direccion AS destinatario_direccion,
        d.ciudad    AS destinatario_ciudad,
        d.telefono  AS destinatario_telefono,

        CASE
          WHEN c.tipo_cliente = 'empresarial' THEN c.nombre_empresa
          WHEN c.tipo_cliente = 'personal' THEN
            LTRIM(RTRIM(
              ISNULL(c.primer_nombre, '') + ' ' + ISNULL(c.primer_apellido, '')
            ))
          ELSE '—'
        END AS cliente

      FROM paquetes p

      LEFT JOIN UltimoEstado ue 
        ON ue.hawb = p.hawb

      LEFT JOIN estados_catalogo ec 
        ON ec.id = ue.estado_id

      LEFT JOIN clientes c 
        ON c.codigo_referencia = p.codigo_referencia

      LEFT JOIN servicios s 
        ON s.id = p.servicio_id

      LEFT JOIN destinatarios d 
        ON d.id = p.destinatario_id

      WHERE ISNULL(p.hawb, p.referencia) LIKE @guia
    `;

    if (referencia) {
      query += " AND p.referencia LIKE @referencia";
      request.input("referencia", sql.VarChar, `%${referencia}%`);
    }

    if (servicio) {
      query += " AND p.servicio_id = @servicio";
      request.input("servicio", sql.Int, servicio);
    }

    if (fechaDesde) {
      query += " AND CAST(p.fecha_registro AS DATE) >= @fechaDesde";
      request.input("fechaDesde", sql.Date, fechaDesde);
    }

    if (fechaHasta) {
      query += " AND CAST(p.fecha_registro AS DATE) <= @fechaHasta";
      request.input("fechaHasta", sql.Date, fechaHasta);
    }

    if (cliente) {

      query += `
        AND (
          p.codigo_referencia = @clienteExacto
          OR c.nombre_empresa LIKE @clienteLike
          OR c.primer_nombre LIKE @clienteLike
          OR c.primer_apellido LIKE @clienteLike
        )
      `;

      request.input("clienteExacto", sql.VarChar, cliente);
      request.input("clienteLike", sql.VarChar, `%${cliente}%`);
    }

    if (usuario) {
      query += " AND p.digitado_por = @usuario";
      request.input("usuario", sql.VarChar, usuario);
    }

    if (oficina) {
      query += " AND p.oficina = @oficina";
      request.input("oficina", sql.VarChar, oficina);
    }

    if (tienda) {
      query += " AND p.tienda LIKE @tienda";
      request.input("tienda", sql.VarChar, `%${tienda}%`);
    }

    if (trackingCasillero) {
      query += " AND p.tracking LIKE @trackingCasillero";
      request.input("trackingCasillero", sql.VarChar, `%${trackingCasillero}%`);
    }

    query += " ORDER BY p.fecha_registro DESC";

    const result = await request.query(query);

    return res.json({ guias: result.recordset });

  } catch (error) {

    console.error("❌ Error al buscar guías:", error);

    return res.status(500).json({
      message: "Error al buscar guías"
    });

  }

};

export const obtenerTiendasUnicas = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT DISTINCT LTRIM(RTRIM(tienda)) AS tienda
      FROM paquetes
      WHERE tienda IS NOT NULL
        AND LTRIM(RTRIM(tienda)) <> ''
      ORDER BY LTRIM(RTRIM(tienda)) ASC
    `);

    return res.json({
      ok: true,
      tiendas: result.recordset
    });

  } catch (error) {
    console.error("❌ Error al obtener tiendas únicas:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener tiendas"
    });
  }
};

export const consultarTrackingFiltrado = async (req, res) => {
  try {
    let {
      hawb,
      referencia,
      estadoGuia,
    } = req.query;

    hawb = hawb?.trim();
    referencia = referencia?.trim();
    estadoGuia = estadoGuia?.trim();

    const pool = await poolPromise;
    const request = pool.request();

    const where = [];

    if (hawb) {
      where.push("(p.hawb LIKE @hawb OR p.hawb_padre LIKE @hawb)");
      request.input("hawb", sql.NVarChar, `%${hawb}%`);
    }

    if (referencia) {
      where.push("p.referencia LIKE @referencia");
      request.input("referencia", sql.NVarChar, `%${referencia}%`);
    }

    if (estadoGuia) {
      where.push("e.nombre = @estadoGuia");
      request.input("estadoGuia", sql.NVarChar, estadoGuia);
    }

    if (!where.length) {
      return res.status(200).json([]);
    }

    const result = await request.query(`
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
      WHERE ${where.join(" AND ")}
      ORDER BY p.fecha_registro DESC
    `);

    const paquetes = result.recordset;

    const respuesta = await Promise.all(
      paquetes.map(async (paquete) => {
        const historial = await pool.request()
          .input("hawb", sql.NVarChar, paquete.hawb)
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

        return {
          hawb: paquete.hawb,
          tracking: paquete.tracking,
          contenido: paquete.contenido,
          peso: paquete.peso,
          tienda: paquete.tienda,
          notas: paquete.notas,
          cliente: paquete.cliente,
          codigo_referencia: paquete.codigo_referencia,
          estado: paquete.estado,
          punto_control: paquete.punto_control,
          fecha_registro: paquete.fecha_registro,

          estados: historial.recordset.map(row => ({
            id: row.id,
            fecha: row.fecha,
            estado: row.estado,
            punto_control: row.punto_control,
            observaciones: row.observaciones,
            responsable: row.responsable
          }))
        };
      })
    );

    return res.status(200).json(respuesta);

  } catch (error) {
    console.error("❌ Error consultando tracking filtrado:", error);
    return res.status(500).json({
      mensaje: "Error al consultar tracking filtrado"
    });
  }
};