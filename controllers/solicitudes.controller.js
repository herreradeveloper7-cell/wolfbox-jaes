import { poolPromise, sql } from "../config/db.js";

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import { fileURLToPath } from "url";
import { drawLogoJaesCargo } from "../utils/pdf.helpers.js";
import {
  enviarEmailDesdePlantilla,
  obtenerPlantillaEmailPorEvento,
} from "../utils/email.service.js";
import { crearNotificacionUsuarios } from "../utils/notificaciones.service.js";
import {
  azureStorageDisponible,
  crearUrlTemporalLectura,
  descargarArchivoPrivado,
  eliminarArchivoPrivado,
  nombreSeguroArchivo,
  subirArchivoPrivado,
} from "../utils/storage.service.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const calcularFleteServicio = (servicio, pesoTotal) => {
  const aplicaPesoMaximo = Boolean(servicio.aplica_peso_maximo);
  const pesoMaximo = Number(servicio.peso_maximo || 0);

  if (aplicaPesoMaximo && pesoMaximo > 0 && pesoTotal > pesoMaximo) {
    return {
      ok: false,
      mensaje: `El servicio ${servicio.nombre} solo permite hasta ${pesoMaximo} lb. Peso actual: ${pesoTotal} lb.`,
      fleteUSD: 0,
    };
  }

  const aplicaMinimo = Boolean(servicio.aplica_minimo);
  const pesoMinimo = Number(servicio.peso_minimo || 0);
  const tarifaMinimaUSD = Number(servicio.tarifa_minima_usd || 0);

  if (aplicaMinimo && pesoMinimo > 0 && tarifaMinimaUSD > 0 && pesoTotal <= pesoMinimo) {
    return {
      ok: true,
      fleteUSD: tarifaMinimaUSD,
    };
  }

  const tarifa1 = Number(servicio.tarifa_fija_1lb || 0);
  const tarifa2a5 = Number(servicio.tarifa_fija_2a5 || 0);
  const tarifa6a10 = Number(servicio.tarifa_fija_6a10 || 0);
  const tarifaExtra = Number(servicio.tarifa_por_libra_extra || 0);
  const tarifaLibra = Number(servicio.tarifa_por_libra_cc || 0);

  const tieneRangos =
    tarifa1 > 0 || tarifa2a5 > 0 || tarifa6a10 > 0 || tarifaExtra > 0;

  if (tieneRangos) {
    if (pesoTotal <= 1) return { ok: true, fleteUSD: tarifa1 };
    if (pesoTotal <= 5) return { ok: true, fleteUSD: tarifa2a5 };
    if (pesoTotal <= 10) return { ok: true, fleteUSD: tarifa6a10 };

    return {
      ok: true,
      fleteUSD: tarifa6a10 + (pesoTotal - 10) * tarifaExtra,
    };
  }

  if (tarifaLibra > 0) {
    const pesoFacturable = pesoTotal < 10 ? 10 : pesoTotal;

    return {
      ok: true,
      fleteUSD: pesoFacturable * tarifaLibra,
    };
  }

  return {
    ok: false,
    mensaje: `El servicio ${servicio.nombre} no tiene una tarifa válida configurada.`,
    fleteUSD: 0,
  };
};

export const normalizarHawbsAgrupacion = (hawbs) => {
  if (!Array.isArray(hawbs)) return [];

  return [
    ...new Set(
      hawbs
        .map((hawb) => String(hawb || "").trim())
        .filter(Boolean)
    ),
  ];
};

export const buildHawbInClause = (hawbs) =>
  hawbs.map((_, index) => `@hawb${index}`).join(",");

export const bindHawbInputs = (request, hawbs) => {
  hawbs.forEach((hawb, index) => {
    request.input(`hawb${index}`, sql.NVarChar(50), hawb);
  });

  return request;
};

export const buildTrackingPadreAgrupado = (hawbPadre) => hawbPadre;
const WHATSAPP_SERVICIO = "+57 302 8600369";
const WHATSAPP_SERVICIO_URL = "https://wa.me/573028600369";
const INFORMACION_BANCARIA = {
  titular: "JAES CARGO INTERNACIONAL",
  banco: "Davivienda",
  cuenta: "1089 0062 3159",
  nit: "901.935.143-6",
  llave: "@9019351436",
};

const formatCOP = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
  });

const formatUSD = (value) => `$${Number(value || 0).toFixed(2)}`;

const esBlobPrivado = (valor) =>
  Boolean(valor && String(valor).startsWith("azure://"));

const blobNameDesdeValor = (valor) =>
  esBlobPrivado(valor) ? String(valor).replace(/^azure:\/\//, "") : null;

const rutaLocalDesdeValor = (valor) =>
  String(valor || "").replace(/^https?:\/\/[^/]+/i, "");

const eliminarArchivoLocalComprobante = (rutaRelativa) => {
  const ruta = rutaLocalDesdeValor(rutaRelativa);

  if (!ruta || !ruta.startsWith("/uploads/comprobantes/")) return;

  const filePath = path.join(__dirname, "..", ruta);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const crearPlantillaFallbackSolicitudFacturada = () => ({
  id: null,
  email_remitente: process.env.BREVO_DEFAULT_SENDER_EMAIL,
  asunto: "Solicitud #{{solicitud_id}} disponible para pago en Colombia",
  cuerpo: `<div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;padding:24px 14px;">
    <div style="overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 18px 45px rgba(17,24,39,.12);">
      <div style="height:5px;background:linear-gradient(90deg,#450a0a,#7f1d1d,#d1d5db);"></div>
      <div style="padding:22px 24px 24px;">
        <div style="display:inline-block;border-radius:999px;background:#7f1d1d14;color:#7f1d1d;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;">
          Wolfbox - JAES Cargo
        </div>
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.18;color:#111827;">
          Solicitud disponible para pago
        </h1>
        <p style="margin:0 0 14px;color:#4b5563;font-size:14px;line-height:1.6;">
          Hola <strong>{{cliente_nombre}}</strong>, tu solicitud <strong>#{{solicitud_id}}</strong> ya se encuentra facturada y disponible para pago en Colombia.
        </p>
        <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
          Por favor realiza el pago y responde a este mismo correo con el comprobante. Tambien puedes enviarlo por WhatsApp a
          <a href="{{whatsapp_url}}" style="color:#7f1d1d;font-weight:800;text-decoration:none;">{{whatsapp_servicio}}</a>.
        </p>
        <div style="border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;padding:14px;margin:14px 0;">
          <p style="margin:0 0 8px;color:#7f1d1d;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">
            Informacion bancaria
          </p>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.7;">
            <strong>{{banco_titular}}</strong><br />
            <strong>{{banco_nombre}}</strong><br />
            <strong>Cuenta de Ahorros:</strong> {{banco_cuenta}}<br />
            <strong>NIT:</strong> {{banco_nit}}<br />
            <strong>Llave:</strong> {{banco_llave}}
          </p>
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          Adjuntamos el PDF de la solicitud de envio para revisar el detalle del cobro.
        </p>
      </div>
    </div>
  </div>
</div>`,
});

const obtenerSolicitudParaCobro = async (pool, solicitudId) => {
  const solicitudQuery = await pool
    .request()
    .input("id", sql.Int, solicitudId)
    .query(`
      SELECT
        s.id,
        s.fecha,
        s.estado,
        s.valor_estimado_usd,
        s.valor_moneda_local,
        s.servicio_id,
        CASE
          WHEN LOWER(ISNULL(c.tipo_cliente, '')) = 'empresarial' THEN
            COALESCE(NULLIF(c.nombre_empresa, ''), CONCAT(c.primer_nombre, ' ', c.primer_apellido))
          ELSE
            RTRIM(
              ISNULL(c.primer_nombre, '') + ' ' +
              ISNULL(c.segundo_nombre + ' ', '') +
              ISNULL(c.primer_apellido, '') + ' ' +
              ISNULL(c.segundo_apellido, '')
            )
        END AS cliente_nombre,
        c.correo AS cliente_correo,
        c.codigo_referencia AS codigoCasillero,
        c.direccion AS cliente_direccion,
        c.ciudad AS cliente_ciudad,
        d.nombre AS destinatario_nombre,
        d.ciudad AS destinatario_ciudad,
        d.direccion AS destinatario_direccion,
        d.telefono AS destinatario_telefono
      FROM solicitudes s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN destinatarios d ON s.destinatario = d.id
      WHERE s.id = @id
    `);

  if (!solicitudQuery.recordset.length) return null;

  const solicitud = solicitudQuery.recordset[0];

  const paquetes = await pool
    .request()
    .input("id", sql.Int, solicitudId)
    .query(`
      SELECT tracking, hawb, peso, contenido, asegurado
      FROM paquetes
      WHERE solicitud_id = @id
      ORDER BY id ASC
    `);

  const cargos = await pool
    .request()
    .input("id", sql.Int, solicitudId)
    .query(`
      SELECT tipo_cargo, valor_usd, valor_cop
      FROM cargos_adicionales
      WHERE solicitud_id = @id
      ORDER BY id ASC
    `);

  const servicioQuery = await pool
    .request()
    .input("id", sql.Int, solicitud.servicio_id)
    .query(`
      SELECT
        nombre AS servicio_nombre,
        codigo,
        tipo,
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

  const servicio = servicioQuery.recordset[0] || {};
  const paquetesParaTotales = paquetes.recordset.filter(
    (p) => !String(p.hawb || "").toUpperCase().endsWith("G")
  );
  const totalPeso = paquetesParaTotales.reduce(
    (sum, p) => sum + Number(p.peso || 0),
    0
  );
  const totalAsegurado = paquetesParaTotales.reduce(
    (sum, p) => sum + Number(p.asegurado || 0),
    0
  );
  const calculoFlete = calcularFleteServicio(servicio, totalPeso);

  if (!calculoFlete.ok) {
    const error = new Error(calculoFlete.mensaje);
    error.statusCode = 400;
    throw error;
  }

  const porcentaje = Number(servicio.porcentaje_seguro || 0) / 100;
  const seguroMinimoUSD = Number(servicio.seguro_minimo_usd || 0);
  const seguroUSD = Math.max(totalAsegurado * porcentaje, seguroMinimoUSD);
  const fleteUSD = Number(calculoFlete.fleteUSD || 0);
  const totalUSD = Number(solicitud.valor_estimado_usd || fleteUSD + seguroUSD || 0);
  const totalCOP = Number(solicitud.valor_moneda_local || 0);
  const totalCargosUSD = cargos.recordset.reduce(
    (sum, cargo) => sum + Number(cargo.valor_usd || 0),
    0
  );
  const totalCargosCOP = cargos.recordset.reduce(
    (sum, cargo) => sum + Number(cargo.valor_cop || 0),
    0
  );

  return {
    ...solicitud,
    servicio_nombre: servicio.servicio_nombre || "Servicio no especificado",
    paquetes: paquetes.recordset,
    cargos: cargos.recordset,
    seguroUSD,
    fleteUSD,
    totalUSD,
    totalCOP,
    totalUSDConCargos: totalUSD + totalCargosUSD,
    totalCOPConCargos: totalCOP + totalCargosCOP,
    trm: totalUSD > 0 ? Number((totalCOP / totalUSD).toFixed(2)) : 0,
  };
};

const generarPdfCobroSolicitud = (solicitud) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 38 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 76;
    const red = "#8B0000";

    drawLogoJaesCargo(doc, 44, 38, 92);

    doc
      .fillColor(red)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("SOLICITUD DE ENVIO", 280, 46, { align: "right", width: 260 });
    doc
      .fillColor("#222222")
      .fontSize(12)
      .text(`No. ${solicitud.id}`, 280, 76, { align: "right", width: 260 });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text(
        `Fecha: ${
          solicitud.fecha ? new Date(solicitud.fecha).toLocaleDateString("es-CO") : "-"
        }`,
        280,
        94,
        { align: "right", width: 260 }
      );

    const infoBoxY = 132;
    const infoBoxX = 38;
    const infoPaddingX = 18;
    const infoTop = infoBoxY + 18;
    const columnWidth = 224;
    const rightColumnX = 306;
    const lineOptions = { width: columnWidth, lineGap: 1 };
    const clienteLineas = [
      ["Nombre", solicitud.cliente_nombre],
      ["Codigo casillero", solicitud.codigoCasillero],
      ["Direccion", solicitud.cliente_direccion],
      ["Ciudad", solicitud.cliente_ciudad],
    ];
    const destinatarioLineas = [
      ["Nombre", solicitud.destinatario_nombre],
      ["Ciudad", solicitud.destinatario_ciudad],
      ["Direccion", solicitud.destinatario_direccion],
      ["Telefono", solicitud.destinatario_telefono],
    ];

    const medirColumnaInfo = (lineas) => {
      doc.font("Helvetica").fontSize(8.7);

      return lineas.reduce((alto, [label, value]) => {
        const texto = `${label}: ${value || "-"}`;
        return alto + doc.heightOfString(texto, lineOptions) + 5;
      }, 21);
    };

    const infoBoxHeight = Math.max(
      122,
      medirColumnaInfo(clienteLineas) + 32,
      medirColumnaInfo(destinatarioLineas) + 32
    );

    doc
      .roundedRect(infoBoxX, infoBoxY, contentWidth, infoBoxHeight, 10)
      .lineWidth(1)
      .strokeColor("#E5E7EB")
      .stroke();

    const dibujarColumnaInfo = (titulo, x, lineas) => {
      let currentY = infoTop;

      doc
        .fillColor(red)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(titulo, x, currentY, { width: columnWidth });

      currentY += 21;

      lineas.forEach(([label, value]) => {
        const texto = `${label}: ${value || "-"}`;
        const alto = doc.heightOfString(texto, lineOptions);

        doc
          .fillColor("#222222")
          .font("Helvetica")
          .fontSize(8.7)
          .text(texto, x, currentY, lineOptions);

        currentY += alto + 5;
      });
    };

    dibujarColumnaInfo("CLIENTE", infoBoxX + infoPaddingX, clienteLineas);
    dibujarColumnaInfo("DESTINATARIO", rightColumnX, destinatarioLineas);

    let y = infoBoxY + infoBoxHeight + 30;
    doc.fillColor(red).font("Helvetica-Bold").fontSize(10).text("DETALLE DE PAQUETES", 38, y);
    y += 18;

    const columns = [
      { label: "Tracking", x: 38, width: 130 },
      { label: "HAWB", x: 168, width: 110 },
      { label: "Contenido", x: 278, width: 140 },
      { label: "Peso", x: 418, width: 55 },
      { label: "Asegurado", x: 473, width: 70 },
    ];

    const resumirContenidoPdf = (contenido) => {
      const texto = String(contenido || "-").trim();

      if (texto.length <= 120 || !texto.includes(",")) return texto || "-";

      const partes = texto
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (partes.length < 4) return texto;

      const conteo = new Map();

      partes.forEach((item) => {
        const clave = item.toLowerCase();
        const actual = conteo.get(clave);

        conteo.set(clave, {
          label: actual?.label || item,
          total: (actual?.total || 0) + 1,
        });
      });

      const resumen = [...conteo.values()]
        .map((item) => (item.total > 1 ? `${item.label} (${item.total})` : item.label))
        .join(", ");

      return resumen.length <= texto.length ? resumen : texto;
    };

    const dibujarHeaderPaquetes = () => {
      doc.rect(38, y, contentWidth, 24).fill(red);
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
      columns.forEach((col) =>
        doc.text(col.label, col.x + 5, y + 8, { width: col.width - 8 })
      );
      y += 24;
    };

    dibujarHeaderPaquetes();

    doc.font("Helvetica").fontSize(7.6).fillColor("#333333");
    solicitud.paquetes.forEach((paquete, index) => {
      const valores = [
        paquete.tracking || "-",
        paquete.hawb || "-",
        resumirContenidoPdf(paquete.contenido),
        String(paquete.peso || "0"),
        formatUSD(paquete.asegurado),
      ];
      const rowOptions = (col) => ({ width: col.width - 10, lineGap: 1 });
      const rowHeight = Math.max(
        26,
        ...valores.map((valor, colIndex) =>
          doc.heightOfString(String(valor), rowOptions(columns[colIndex])) + 14
        )
      );

      if (y + rowHeight > 730) {
        doc.addPage();
        y = 50;
        dibujarHeaderPaquetes();
        doc.font("Helvetica").fontSize(7.6).fillColor("#333333");
      }

      if (index % 2 === 0) {
        doc.rect(38, y, contentWidth, rowHeight).fill("#F9FAFB");
        doc.fillColor("#333333");
      }

      doc
        .font("Helvetica")
        .fontSize(7.6)
        .fillColor("#333333");

      columns.forEach((col, colIndex) => {
        doc.text(String(valores[colIndex]), col.x + 5, y + 8, rowOptions(col));
      });

      y += rowHeight;
    });

    y += 22;
    if (solicitud.cargos.length) {
      doc.fillColor(red).font("Helvetica-Bold").fontSize(10).text("CARGOS ADICIONALES", 38, y);
      y += 18;

      solicitud.cargos.forEach((cargo) => {
        doc
          .fillColor("#333333")
          .font("Helvetica")
          .fontSize(9)
          .text(cargo.tipo_cargo || "-", 48, y, { width: 220 })
          .text(formatUSD(cargo.valor_usd), 300, y, { width: 90 })
          .text(formatCOP(cargo.valor_cop), 410, y, { width: 120 });
        y += 16;
      });
      y += 14;
    }

    if (y > 560) {
      doc.addPage();
      y = 50;
    }

    doc
      .roundedRect(38, y, contentWidth, 142, 10)
      .fillAndStroke("#FAFAFA", "#E5E7EB");
    doc.fillColor(red).font("Helvetica-Bold").fontSize(10).text("TOTALES", 54, y + 18);
    doc
      .fillColor("#222222")
      .font("Helvetica")
      .fontSize(10)
      .text(`Seguro total (USD): ${formatUSD(solicitud.seguroUSD)}`, 54, y + 40)
      .text(`Flete (USD): ${formatUSD(solicitud.fleteUSD)}`, 54, y + 58)
      .text(`Total USD: ${formatUSD(solicitud.totalUSDConCargos)}`, 54, y + 76)
      .text(`TRM aplicada: ${solicitud.trm}`, 300, y + 40)
      .text(`Total COP: ${formatCOP(solicitud.totalCOPConCargos)}`, 300, y + 58);

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(red)
      .text(`Total final COP: ${formatCOP(solicitud.totalCOPConCargos)}`, 54, y + 104);

    y += 164;

    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    doc
      .roundedRect(38, y, contentWidth, 116, 10)
      .fillAndStroke("#FFFFFF", "#E5E7EB");
    doc
      .fillColor(red)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("INFORMACION BANCARIA", 54, y + 18);
    doc
      .fillColor("#222222")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(INFORMACION_BANCARIA.titular, 54, y + 42);
    doc
      .font("Helvetica-Bold")
      .text(INFORMACION_BANCARIA.banco, 54, y + 58);
    doc
      .font("Helvetica")
      .text(`Cuenta de Ahorros: ${INFORMACION_BANCARIA.cuenta}`, 54, y + 74)
      .text(`NIT: ${INFORMACION_BANCARIA.nit}`, 54, y + 90)
      .text(`Llave: ${INFORMACION_BANCARIA.llave}`, 300, y + 90);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6B7280")
      .text(
        "Documento generado automaticamente por Wolfbox - JAES Cargo Internacional.",
        38,
        780,
        { align: "center", width: contentWidth }
      );

    doc.end();
  });

export const crearSolicitud = async (req, res) => {
  let transaction;
  let transactionStarted = false;

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
      !Array.isArray(paquetes) ||
      paquetes.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        mensaje: "Datos incompletos o formato inválido."
      });
    }

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const paqueteIds = [...new Set(paquetes.map((p) => Number(p.id)))];

    if (paqueteIds.length !== paquetes.length) {
      const error = new Error("La selección contiene paquetes repetidos.");
      error.statusCode = 400;
      throw error;
    }

    const clienteResult = await request()
      .input("cliente_id", sql.Int, cliente_id)
      .input("destinatario_id", sql.Int, destinatario)
      .query(`
        SELECT TOP 1 id, codigo_referencia
        FROM clientes
        WHERE id = @cliente_id;

        SELECT TOP 1 id
        FROM destinatarios
        WHERE id = @destinatario_id
          AND cliente_id = @cliente_id
          AND activo = 1;
      `);

    const cliente = clienteResult.recordsets[0]?.[0];
    const destinatarioValido = clienteResult.recordsets[1]?.[0];

    if (!cliente) {
      const error = new Error("El cliente seleccionado no existe.");
      error.statusCode = 404;
      throw error;
    }

    if (!destinatarioValido) {
      const error = new Error("El destinatario no pertenece al cliente seleccionado o está inactivo.");
      error.statusCode = 400;
      throw error;
    }

    const paquetesRequest = request();
    const placeholders = paqueteIds.map((id, index) => {
      const nombre = `paquete_${index}`;
      paquetesRequest.input(nombre, sql.Int, id);
      return `@${nombre}`;
    });

    const resultServicios = await paquetesRequest.query(`
      SELECT
        p.id,
        p.cliente_id,
        p.codigo_referencia,
        p.servicio_id,
        p.peso,
        p.asegurado,
        p.solicitud_id,
        p.agrupado_bit,
        p.hawb_padre,
        e.nombre AS estado
      FROM paquetes p
      LEFT JOIN estados_catalogo e ON e.id = p.estado_id
      WHERE p.id IN (${placeholders.join(",")})
    `);

    if (resultServicios.recordset.length !== paqueteIds.length) {
      const error = new Error("Uno o más paquetes seleccionados no existen.");
      error.statusCode = 400;
      throw error;
    }

    const paqueteInvalido = resultServicios.recordset.find((paquete) => {
      const perteneceCliente =
        Number(paquete.cliente_id) === Number(cliente_id) ||
        String(paquete.codigo_referencia || "") === String(cliente.codigo_referencia || "");
      const disponible =
        !paquete.solicitud_id &&
        !paquete.agrupado_bit &&
        !paquete.hawb_padre &&
        String(paquete.estado || "").trim().toLowerCase() !== "anulado";

      return !perteneceCliente || !disponible;
    });

    if (paqueteInvalido) {
      const error = new Error("Uno o más paquetes no pertenecen al cliente o ya no están disponibles.");
      error.statusCode = 409;
      throw error;
    }

    for (const p of paquetes) {
      if (p.asegurado !== undefined && p.asegurado !== null) {
        await request()
          .input("id", sql.Int, p.id)
          .input("asegurado", sql.Decimal(10, 2), p.asegurado)
          .input("cliente_id", sql.Int, cliente_id)
          .input("codigo_referencia", sql.NVarChar(50), cliente.codigo_referencia)
          .query(`
            UPDATE paquetes
            SET asegurado = @asegurado
            WHERE id = @id
              AND (cliente_id = @cliente_id OR codigo_referencia = @codigo_referencia)
          `);

        const paqueteActualizado = resultServicios.recordset.find(
          (paquete) => Number(paquete.id) === Number(p.id)
        );
        if (paqueteActualizado) paqueteActualizado.asegurado = p.asegurado;
      }
    }

    const serviciosEncontrados = [
      ...new Set(resultServicios.recordset.map(r => r.servicio_id))
    ];

    if (serviciosEncontrados.length === 0) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: "No se encontró servicio para los paquetes seleccionados (servicio_id = null)."
      });
    }

    if (serviciosEncontrados.length > 1) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: "Los paquetes seleccionados pertenecen a servicios diferentes."
      });
    }

    const servicio_id = serviciosEncontrados[0];

    
    const datosServicio = await request()
      .input("id", sql.Int, servicio_id)
      .query(`
        SELECT 
          codigo,
          nombre,
          tipo,
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

    if (datosServicio.recordset.length === 0) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: "Servicio no encontrado para los paquetes."
      });
    }

    const servicio = datosServicio.recordset[0];


    if (!servicio.codigo) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(500).json({
        ok: false,
        mensaje: "El servicio no tiene código configurado."
      });
    }


    const peso_total = resultServicios.recordset.reduce(
      (sum, p) => sum + parseFloat(p.peso || 0),
      0
    );

    const asegurado_total = resultServicios.recordset.reduce(
      (sum, p) => sum + parseFloat(p.asegurado || 0),
      0
    );


    const calculoFlete = calcularFleteServicio(servicio, peso_total);

    if (!calculoFlete.ok) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: calculoFlete.mensaje,
      });
    }

    const fleteUSD = calculoFlete.fleteUSD;


    const porcentaje = Number(servicio.porcentaje_seguro || 0) / 100;
    const seguroMinimoUSD = Number(servicio.seguro_minimo_usd || 0);

    const seguroCalculadoUSD = asegurado_total * porcentaje;
    const seguroUSD = Math.max(seguroCalculadoUSD, seguroMinimoUSD);

    const valor_estimado_usd = fleteUSD + seguroUSD;

  
    const trmQuery = await request().query(`
      SELECT TOP 1 valor
      FROM trm
      ORDER BY fecha DESC
    `);

    const trmValor = trmQuery.recordset[0]?.valor || 0;
    const valor_moneda_local = valor_estimado_usd * trmValor;


    const resultSolicitud = await request()
      .input("cliente_id", sql.Int, cliente_id)
      .input("usuario_id", sql.Int, usuario_id || null)
      .input("destinatario", sql.Int, destinatario)
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


    for (const p of paquetes) {
      const asignacion = await request()
        .input("solicitud_id", sql.Int, solicitud_id)
        .input("paquete_id", sql.Int, p.id)
        .query(`
          UPDATE paquetes
          SET solicitud_id = @solicitud_id
          WHERE id = @paquete_id
            AND solicitud_id IS NULL
        `);

      if (Number(asignacion.rowsAffected?.[0] || 0) !== 1) {
        const error = new Error("Uno de los paquetes dejó de estar disponible. Actualiza la lista e intenta nuevamente.");
        error.statusCode = 409;
        throw error;
      }
    }

    await transaction.commit();
    transactionStarted = false;

    res.status(201).json({
      ok: true,
      mensaje: "Solicitud creada correctamente",
      codigo: solicitud_id,
      total_usd: valor_estimado_usd,
      total_local: valor_moneda_local
    });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo crearSolicitud:", rollbackError);
      }
    }

    console.error("❌ Error en crearSolicitud:", error);
    res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.statusCode ? error.message : "Error interno al crear la solicitud"
    });
  }
};





export const obtenerSolicitudes = async (req, res) => {
  try {
    const { usuario_id, codigo } = req.query;
    const pool = await poolPromise;
    const request = pool.request();

    let query = `
    SELECT  
      s.id,
      s.cliente_id,
      c.codigo_referencia AS codigoCasillero,
      CONVERT(varchar, s.fecha, 23) AS fecha,
      s.estado,
      s.destinatario,
      d.nombre AS destinatario_nombre,
      s.medio_pago,
      s.observaciones,
      s.comprobante_pago_url,
      CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente,

      MAX(
        CASE 
          WHEN p.hawb LIKE '%G' AND ISNULL(p.agrupado_bit, 0) = 0 
          THEN p.hawb 
        END
      ) AS guia_agrupada,

      STRING_AGG(
        CASE 
          WHEN ISNULL(p.agrupado_bit, 0) = 1 
          THEN p.hawb 
        END,
        CHAR(10)
      ) AS hawbs_agrupados,

      STRING_AGG(
        CASE 
          WHEN ISNULL(p.agrupado_bit, 0) = 0 
              AND p.hawb NOT LIKE '%G'
          THEN p.hawb 
        END,
        CHAR(10)
      ) AS hawbs_normales,

      COUNT(
        CASE 
          WHEN p.hawb NOT LIKE '%G' THEN 1 
        END
      ) AS cantidadPaquetes,

      ISNULL(SUM(
        CASE 
          WHEN p.hawb NOT LIKE '%G' 
          THEN CAST(ISNULL(p.peso, 0) AS DECIMAL(10,2))
          ELSE 0
        END
      ), 0) AS pesoTotal


      FROM solicitudes s
      INNER JOIN clientes c ON s.cliente_id = c.id
      LEFT JOIN destinatarios d ON d.id = s.destinatario
      LEFT JOIN paquetes p ON p.solicitud_id = s.id
      WHERE 1 = 1
  `;


    if (codigo) {
      query += ` AND c.codigo_referencia = @codigo`;
      request.input("codigo", sql.NVarChar(50), codigo);
    } else if (usuario_id) {
      query += ` AND s.usuario_id = @usuario_id`;
      request.input("usuario_id", sql.Int, usuario_id);
    }

    query += `
      GROUP BY
        s.id,
        s.cliente_id,
        c.codigo_referencia,
        s.fecha,
        s.estado,
        s.destinatario,
        d.nombre,
        s.medio_pago,
        s.observaciones,
        s.comprobante_pago_url,
        c.primer_nombre,
        c.primer_apellido

      ORDER BY s.fecha DESC
    `;

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    res.status(500).json({ mensaje: "Error al obtener solicitudes" });
  }
};

export const reporteSolicitudes = async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, desbloqueo = "todas" } = req.query;
    const pool = await poolPromise;
    const request = pool.request();
    const where = [];

    if (fechaDesde) {
      where.push("CONVERT(date, s.fecha) >= @fechaDesde");
      request.input("fechaDesde", sql.Date, fechaDesde);
    }

    if (fechaHasta) {
      where.push("CONVERT(date, s.fecha) <= @fechaHasta");
      request.input("fechaHasta", sql.Date, fechaHasta);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const filtroDesbloqueo =
      desbloqueo === "desbloqueadas"
        ? "AND pt.desbloqueada = 1"
        : desbloqueo === "sin_desbloquear"
          ? "AND pt.desbloqueada = 0"
          : "";

    const result = await request.query(`
      WITH paquetes_solicitud AS (
        SELECT
          p.solicitud_id,
          ISNULL(SUM(
            CASE
              WHEN p.hawb NOT LIKE '%G' THEN 1
              ELSE 0
            END
          ), 0) AS cantidad_paquetes,
          ISNULL(SUM(
            CASE
              WHEN p.hawb NOT LIKE '%G' THEN CAST(ISNULL(p.peso, 0) AS DECIMAL(10,2))
              ELSE 0
            END
          ), 0) AS peso_total,
          ISNULL(SUM(
            CASE
              WHEN p.hawb NOT LIKE '%G' THEN CAST(ISNULL(p.asegurado, 0) AS DECIMAL(10,2))
              ELSE 0
            END
          ), 0) AS asegurado_total,
          STRING_AGG(CAST(p.hawb AS NVARCHAR(MAX)), CHAR(10)) AS hawbs,
          MAX(CASE WHEN LOWER(ISNULL(ec.nombre, '')) = 'desbloqueado' THEN 1 ELSE 0 END) AS desbloqueada
        FROM paquetes p
        LEFT JOIN estados_catalogo ec ON ec.id = p.estado_id
        WHERE p.solicitud_id IS NOT NULL
        GROUP BY p.solicitud_id
      ),
      cargos_solicitud AS (
        SELECT
          solicitud_id,
          ISNULL(SUM(CAST(ISNULL(valor_usd, 0) AS DECIMAL(10,2))), 0) AS cargos_usd,
          ISNULL(SUM(CAST(ISNULL(valor_cop, 0) AS DECIMAL(18,2))), 0) AS cargos_cop
        FROM cargos_adicionales
        GROUP BY solicitud_id
      )
      SELECT
        s.id,
        CONVERT(varchar, s.fecha, 120) AS fecha,
        s.estado AS estado_solicitud,
        s.medio_pago,
        s.observaciones,
        s.valor_estimado_usd,
        s.valor_moneda_local,
        c.codigo_referencia AS codigo_casillero,
        CASE
          WHEN LOWER(ISNULL(c.tipo_cliente, '')) = 'empresarial' THEN
            ISNULL(NULLIF(LTRIM(RTRIM(c.nombre_empresa)), ''), 'Sin nombre')
          ELSE
            ISNULL(
              NULLIF(
                LTRIM(RTRIM(
                  ISNULL(c.primer_nombre, '') + ' ' +
                  ISNULL(c.segundo_nombre + ' ', '') +
                  ISNULL(c.primer_apellido, '') + ' ' +
                  ISNULL(c.segundo_apellido, '')
                )),
                ''
              ),
              ISNULL(NULLIF(LTRIM(RTRIM(c.nombre_empresa)), ''), 'Sin nombre')
            )
        END AS cliente,
        d.nombre AS destinatario,
        srv.nombre AS servicio,
        srv.codigo AS servicio_codigo,
        srv.tipo AS servicio_tipo,
        srv.tarifa_fija_1lb,
        srv.tarifa_fija_2a5,
        srv.tarifa_fija_6a10,
        srv.tarifa_por_libra_extra,
        srv.tarifa_por_libra_cc,
        srv.porcentaje_seguro,
        srv.seguro_minimo_usd,
        srv.aplica_minimo,
        srv.peso_minimo,
        srv.tarifa_minima_usd,
        srv.aplica_peso_maximo,
        srv.peso_maximo,
        pt.cantidad_paquetes,
        pt.peso_total,
        pt.asegurado_total,
        pt.hawbs,
        pt.desbloqueada,
        ISNULL(cs.cargos_usd, 0) AS cargos_usd,
        ISNULL(cs.cargos_cop, 0) AS cargos_cop
      FROM solicitudes s
      INNER JOIN clientes c ON c.id = s.cliente_id
      LEFT JOIN destinatarios d ON d.id = s.destinatario
      LEFT JOIN servicios srv ON srv.id = s.servicio_id
      INNER JOIN paquetes_solicitud pt ON pt.solicitud_id = s.id
      LEFT JOIN cargos_solicitud cs ON cs.solicitud_id = s.id
      ${whereClause}
      ${whereClause ? filtroDesbloqueo : filtroDesbloqueo.replace(/^AND /, "WHERE ")}
      ORDER BY s.fecha DESC
    `);

    const solicitudes = result.recordset.map((solicitud) => {
      const calculoFlete = calcularFleteServicio(solicitud, Number(solicitud.peso_total || 0));
      const porcentaje = Number(solicitud.porcentaje_seguro || 0) / 100;
      const seguroMinimoUSD = Number(solicitud.seguro_minimo_usd || 0);
      const seguroCalculadoUSD = Number(solicitud.asegurado_total || 0) * porcentaje;
      const seguroUSD = Math.max(seguroCalculadoUSD, seguroMinimoUSD);

      const {
        servicio_codigo,
        servicio_tipo,
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
        peso_maximo,
        ...data
      } = solicitud;

      return {
        ...data,
        trm_liquidacion: (() => {
          const valorUSDGuardado = Number(data.valor_estimado_usd || 0);
          const valorCOPGuardado = Number(data.valor_moneda_local || 0);
          return valorUSDGuardado > 0
            ? Number((valorCOPGuardado / valorUSDGuardado).toFixed(2))
            : 0;
        })(),
        flete_usd: calculoFlete.ok ? Number(calculoFlete.fleteUSD.toFixed(2)) : 0,
        seguro_usd: Number(seguroUSD.toFixed(2)),
        valor_estimado_usd: Number(
          (
            (calculoFlete.ok ? Number(calculoFlete.fleteUSD || 0) : 0) +
            seguroUSD +
            Number(data.cargos_usd || 0)
          ).toFixed(2)
        ),
        valor_moneda_local: Number(
          (
            (() => {
              const valorUSDGuardado = Number(data.valor_estimado_usd || 0);
              const valorCOPGuardado = Number(data.valor_moneda_local || 0);
              const trm = valorUSDGuardado > 0 ? valorCOPGuardado / valorUSDGuardado : 0;
              const baseUSD = (calculoFlete.ok ? Number(calculoFlete.fleteUSD || 0) : 0) + seguroUSD;
              return baseUSD * trm + Number(data.cargos_cop || 0);
            })()
          ).toFixed(2)
        ),
      };
    });

    return res.json({ ok: true, solicitudes });
  } catch (error) {
    console.error("Error generando reporte de solicitudes:", error);
    return res.status(500).json({
      ok: false,
      mensaje: "Error generando reporte de solicitudes.",
    });
  }
};



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


export const eliminarSolicitud = async (req, res) => {
  const { id } = req.params;
  let transaction;
  let transactionStarted = false;

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    const check = await request()
      .input("id", sql.Int, id)
      .query(`
        SELECT id 
        FROM solicitudes 
        WHERE id = @id
      `);

    if (check.recordset.length === 0) {
      await transaction.rollback();
      transactionStarted = false;

      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada."
      });
    }

    // 🔴 VALIDAR SI YA TIENE PROCESO LOGÍSTICO
    const validacion = await request()
      .input("id", sql.Int, id)
      .query(`
        SELECT 
          p.hawb,
          ec.nombre AS estado
        FROM paquetes p
        LEFT JOIN estados_catalogo ec 
          ON ec.id = p.estado_id
        WHERE p.solicitud_id = @id
      `);

    const paquetes = validacion.recordset;

    const tieneGuiaPadre = paquetes.some(p => p.hawb?.endsWith("G"));

    const tieneFacturado = paquetes.some(p =>
      p.estado === "Facturado Pendiente de Pago"
    );

    if (tieneGuiaPadre || tieneFacturado) {
      await transaction.rollback();
      transactionStarted = false;

      return res.status(400).json({
        ok: false,
        mensaje:
          "Esta solicitud ya fue procesada (agrupada o facturada) y no puede eliminarse."
      });
    }

    // ✅ LIBERAR PAQUETES
    await request()
      .input("solicitud_id", sql.Int, id)
      .query(`
        UPDATE paquetes
        SET solicitud_id = NULL
        WHERE solicitud_id = @solicitud_id
      `);

    // ✅ ELIMINAR SOLICITUD
    await request()
      .input("solicitud_id", sql.Int, id)
      .query(`
        DELETE FROM cargos_adicionales
        WHERE solicitud_id = @solicitud_id
      `);

    await request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM solicitudes
        WHERE id = @id
      `);

    await transaction.commit();
    transactionStarted = false;

    return res.json({
      ok: true,
      mensaje: `Solicitud #${id} eliminada correctamente.`
    });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo eliminarSolicitud:", rollbackError);
      }
    }
    console.error("❌ Error eliminando solicitud:", error);

    return res.status(500).json({
      ok: false,
      mensaje: "Error interno al eliminar solicitud."
    });
  }
};


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
          s.servicio_id,
          CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente,
          c.codigo_referencia
        FROM solicitudes s
        INNER JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN destinatarios d ON s.destinatario = d.id
        WHERE s.id = @id
      `);

    if (solicitud.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const solicitudData = solicitud.recordset[0];

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
          p.asegurado,
          p.tienda,
          CONVERT(varchar, p.fecha_registro, 120) AS fecha_digitacion,
          p.agrupado_bit,
          p.hawb_padre
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

    const servicioQuery = await pool
      .request()
      .input("id", sql.Int, solicitudData.servicio_id)
      .query(`
        SELECT 
          nombre AS servicio_nombre,
          codigo,
          tipo,
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

    const servicio = servicioQuery.recordset[0] || {};

    const paquetesParaTotales = paquetes.recordset.filter(
      (p) => !String(p.hawb || "").toUpperCase().endsWith("G")
    );

    const totalPeso = paquetesParaTotales.reduce(
      (sum, p) => sum + Number(p.peso || 0),
      0
    );

    const totalAsegurado = paquetesParaTotales.reduce(
      (sum, p) => sum + Number(p.asegurado || 0),
      0
    );

    const calculoFlete = calcularFleteServicio(servicio, totalPeso);

    if (!calculoFlete.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: calculoFlete.mensaje,
      });
    }

    const fleteUSD = calculoFlete.fleteUSD;

    const porcentaje = Number(servicio.porcentaje_seguro || 0) / 100;
    const seguroMinimoUSD = Number(servicio.seguro_minimo_usd || 0);
    const seguroCalculadoUSD = totalAsegurado * porcentaje;
    const seguroUSD = Math.max(seguroCalculadoUSD, seguroMinimoUSD);

    const totalUSDCalculado = fleteUSD + seguroUSD;
    const totalUSD = Number(solicitudData.valor_estimado_usd || totalUSDCalculado || 0);
    const totalCOP = Number(solicitudData.valor_moneda_local || 0);
    const trm = totalUSD > 0 ? Number((totalCOP / totalUSD).toFixed(2)) : 0;

    const totalCargosUSD = cargos.recordset.reduce(
      (sum, c) => sum + Number(c.valor_usd || 0),
      0
    );

    const totalCargosCOP = cargos.recordset.reduce(
      (sum, c) => sum + Number(c.valor_cop || 0),
      0
    );

    const totalUSDConCargos = totalUSD + totalCargosUSD;
    const totalCOPConCargos = totalCOP + totalCargosCOP;

    res.json({
      solicitud: {
        ...solicitudData,
        servicio_nombre: servicio.servicio_nombre || null,
        seguroUSD,
        fleteUSD,
        totalUSD,
        totalCOP,
        totalUSDConCargos,
        totalCOPConCargos,
        trm,
      },
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

    const solicitudQuery = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT 
          s.id, 
          s.fecha, 
          s.estado,
          s.valor_estimado_usd,
          s.valor_moneda_local,
          s.servicio_id,
          CONCAT(c.primer_nombre, ' ', c.primer_apellido) AS cliente_nombre,
          c.codigo_referencia AS codigoCasillero,
          c.direccion AS cliente_direccion,
          c.ciudad AS cliente_ciudad,
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

    const cargos = await pool
      .request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT tipo_cargo, valor_usd, valor_cop
        FROM cargos_adicionales
        WHERE solicitud_id = @id
      `);

    const servicioQuery = await pool
      .request()
      .input("id", sql.Int, solicitud.servicio_id)
      .query(`
        SELECT 
          nombre AS servicio_nombre,
          codigo,
          tipo,
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

    const servicio = servicioQuery.recordset[0] || {};

    const totalPeso = paquetes.recordset.reduce(
      (sum, p) => sum + Number(p.peso || 0),
      0
    );

    const totalAsegurado = paquetes.recordset.reduce(
      (sum, p) => sum + Number(p.asegurado || 0),
      0
    );

    const calculoFlete = calcularFleteServicio(servicio, totalPeso);

    if (!calculoFlete.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: calculoFlete.mensaje,
      });
    }

    const fleteUSD = calculoFlete.fleteUSD;

    const porcentaje = Number(servicio.porcentaje_seguro || 0) / 100;
    const seguroMinimoUSD = Number(servicio.seguro_minimo_usd || 0);

    const seguroCalculadoUSD = totalAsegurado * porcentaje;
    const seguroUSD = Math.max(seguroCalculadoUSD, seguroMinimoUSD);

    const totalUSDCalculado = fleteUSD + seguroUSD;
    const totalUSD = Number(solicitud.valor_estimado_usd || totalUSDCalculado || 0);
    const totalCOP = Number(solicitud.valor_moneda_local || 0);
    const trm = totalUSD > 0 ? Number((totalCOP / totalUSD).toFixed(2)) : 0;

    const totalCargosUSD = cargos.recordset.reduce(
      (sum, c) => sum + Number(c.valor_usd || 0),
      0
    );

    const totalCargosCOP = cargos.recordset.reduce(
      (sum, c) => sum + Number(c.valor_cop || 0),
      0
    );

    const totalUSDConCargos = totalUSD + totalCargosUSD;
    const totalCOPConCargos = totalCOP + totalCargosCOP;

    res.json({
      solicitud: {
        ...solicitud,
        servicio_nombre: servicio.servicio_nombre || null,
        paquetes: paquetes.recordset,
        cargos: cargos.recordset,
        seguroUSD,
        fleteUSD,
        totalUSD,
        totalCOP,
        totalUSDConCargos,
        totalCOPConCargos,
        trm,
      },
    });
  } catch (err) {
    console.error("❌ Error en obtenerDatosPDFSolicitud", err);
    res.status(500).json({ error: "Error generando datos para PDF" });
  }
};

export const generarPDFSolicitudCobro = async (req, res) => {
  try {
    const pool = await poolPromise;
    const solicitudId = Number(req.params.id);

    if (!solicitudId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Solicitud no valida.",
      });
    }

    const solicitud = await obtenerSolicitudParaCobro(pool, solicitudId);

    if (!solicitud) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada.",
      });
    }

    const pdfBuffer = await generarPdfCobroSolicitud(solicitud);
    const fileName = `Solicitud_${solicitud.id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generando PDF de solicitud:", error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.statusCode ? error.message : "Error generando PDF de solicitud.",
    });
  }
};

export const enviarCobroSolicitud = async (req, res) => {
  try {
    const pool = await poolPromise;
    const solicitudId = Number(req.params.id);

    if (!solicitudId) {
      return res.status(400).json({
        ok: false,
        mensaje: "Solicitud no valida.",
      });
    }

    const solicitud = await obtenerSolicitudParaCobro(pool, solicitudId);

    if (!solicitud) {
      return res.status(404).json({
        ok: false,
        mensaje: "Solicitud no encontrada.",
      });
    }

    if (!solicitud.cliente_correo) {
      return res.status(400).json({
        ok: false,
        mensaje: "El cliente no tiene correo registrado.",
      });
    }

    const plantilla =
      (await obtenerPlantillaEmailPorEvento("solicitud_facturada")) ||
      crearPlantillaFallbackSolicitudFacturada();

    const pdfBuffer = await generarPdfCobroSolicitud(solicitud);

    await enviarEmailDesdePlantilla({
      plantilla,
      destinatarios: [
        {
          email: solicitud.cliente_correo,
          name: solicitud.cliente_nombre || "Cliente",
        },
      ],
      variables: {
        cliente_nombre: solicitud.cliente_nombre || "Cliente",
        codigo_casillero: solicitud.codigoCasillero || "",
        email: solicitud.cliente_correo,
        solicitud_id: solicitud.id,
        total_cop: formatCOP(solicitud.totalCOPConCargos),
        total_usd: formatUSD(solicitud.totalUSDConCargos),
        fecha: new Date().toLocaleDateString("es-CO"),
        whatsapp_servicio: WHATSAPP_SERVICIO,
        whatsapp_url: WHATSAPP_SERVICIO_URL,
        banco_titular: INFORMACION_BANCARIA.titular,
        banco_nombre: INFORMACION_BANCARIA.banco,
        banco_cuenta: INFORMACION_BANCARIA.cuenta,
        banco_nit: INFORMACION_BANCARIA.nit,
        banco_llave: INFORMACION_BANCARIA.llave,
      },
      evento: "solicitud_facturada",
      adjuntos: [
        {
          name: `Solicitud_${solicitud.id}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    return res.json({
      ok: true,
      mensaje: "Cobro enviado correctamente al cliente.",
      destinatario: solicitud.cliente_correo,
    });
  } catch (error) {
    console.error("Error enviando cobro de solicitud:", error);
    return res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.message || "Error enviando cobro de solicitud.",
    });
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
        SET solicitud_id = NULL
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
        SET solicitud_id = @solicitud_id
        WHERE id = @paquete_id
      `);

    res.json({ ok: true, mensaje: "Paquete agregado a la solicitud" });
  } catch (err) {
    res.status(500).json({ ok: false, mensaje: "Error agregando paquete" });
  }
};


export const editarSolicitudCompleta = async (req, res) => {
  const { id } = req.params;
  let transaction;
  let transactionStarted = false;

  // ✅ ahora recibe destinatario
  const { paquetes, cargos, destinatario, trm_liquidacion } = req.body;

  // ✅ permitir que paquetes/cargos vengan vacíos o no vengan
  const paquetesArr = Array.isArray(paquetes) ? paquetes : [];
  const cargosArr = Array.isArray(cargos) ? cargos : [];

  // ✅ si no envían nada, tampoco tiene sentido
  if (
    paquetes === undefined &&
    cargos === undefined &&
    destinatario === undefined &&
    trm_liquidacion === undefined
  ) {
    return res.status(400).json({
      ok: false,
      mensaje: "No se enviaron datos para actualizar.",
    });
  }

  try {
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);
    const trmSolicitud =
      trm_liquidacion !== undefined && trm_liquidacion !== null && trm_liquidacion !== ""
        ? Number(trm_liquidacion)
        : null;

    if (trmSolicitud !== null && (!Number.isFinite(trmSolicitud) || trmSolicitud <= 0)) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: "La TRM de la solicitud debe ser mayor a cero.",
      });
    }

    if (destinatario !== undefined && destinatario !== null && destinatario !== "") {
      await request()
        .input("id", sql.Int, id)
        .input("destinatario", sql.Int, Number(destinatario))
        .query(`
          UPDATE solicitudes
          SET destinatario = @destinatario
          WHERE id = @id
        `);
    }

    // ✅ 2) Actualizar paquetes (si vienen)
    for (const p of paquetesArr) {
      await request()
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

    // ✅ 3) Sincronizar cargos (si vienen)
    if (cargos !== undefined) {
      const cargosDB = await request()
        .input("id", sql.Int, id)
        .query(`SELECT id FROM cargos_adicionales WHERE solicitud_id = @id`);

      const idsExistentes = cargosDB.recordset.map((c) => c.id);
      const idsRecibidos = cargosArr.map((c) => c.id).filter(Boolean);

      const idsEliminar = idsExistentes.filter(
        (idCargo) => !idsRecibidos.includes(idCargo)
      );

      for (const cargoID of idsEliminar) {
        await request()
          .input("id", sql.Int, cargoID)
          .query(`DELETE FROM cargos_adicionales WHERE id = @id`);
      }

      for (const c of cargosArr) {
        const valorUSD = Number(c.valor_usd || 0);
        const valorCOP =
          trmSolicitud !== null ? Number((valorUSD * trmSolicitud).toFixed(2)) : Number(c.valor_cop || 0);

        if (!c.id) {
          await request()
            .input("solicitud_id", sql.Int, id)
            .input("tipo_cargo", sql.VarChar(100), c.tipo_cargo)
            .input("valor_usd", sql.Decimal(10, 2), valorUSD)
            .input("valor_cop", sql.Decimal(18, 2), valorCOP)
            .query(`
              INSERT INTO cargos_adicionales (solicitud_id, tipo_cargo, valor_usd, valor_cop)
              VALUES (@solicitud_id, @tipo_cargo, @valor_usd, @valor_cop)
            `);
        } else {
          await request()
            .input("id", sql.Int, c.id)
            .input("tipo_cargo", sql.VarChar(100), c.tipo_cargo)
            .input("valor_usd", sql.Decimal(10, 2), valorUSD)
            .input("valor_cop", sql.Decimal(18, 2), valorCOP)
            .query(`
              UPDATE cargos_adicionales
              SET tipo_cargo = @tipo_cargo,
                  valor_usd = @valor_usd,
                  valor_cop = @valor_cop
              WHERE id = @id
            `);
        }
      }
    }

    if (trmSolicitud !== null) {
      await request()
        .input("id", sql.Int, id)
        .input("trm", sql.Decimal(18, 2), trmSolicitud)
        .query(`
          UPDATE cargos_adicionales
          SET valor_cop = CAST(ISNULL(valor_usd, 0) AS DECIMAL(18,2)) * @trm
          WHERE solicitud_id = @id
        `);
    }

    const solicitudTotales = await request()
      .input("id", sql.Int, id)
      .query(`
        SELECT
          s.valor_estimado_usd,
          s.valor_moneda_local,
          srv.nombre AS servicio_nombre,
          srv.codigo,
          srv.tipo,
          srv.tarifa_fija_1lb,
          srv.tarifa_fija_2a5,
          srv.tarifa_fija_6a10,
          srv.tarifa_por_libra_extra,
          srv.tarifa_por_libra_cc,
          srv.porcentaje_seguro,
          srv.seguro_minimo_usd,
          srv.aplica_minimo,
          srv.peso_minimo,
          srv.tarifa_minima_usd,
          srv.aplica_peso_maximo,
          srv.peso_maximo,
          ISNULL(SUM(
            CASE
              WHEN p.hawb NOT LIKE '%G' THEN CAST(ISNULL(p.peso, 0) AS DECIMAL(10,2))
              ELSE 0
            END
          ), 0) AS peso_total,
          ISNULL(SUM(
            CASE
              WHEN p.hawb NOT LIKE '%G' THEN CAST(ISNULL(p.asegurado, 0) AS DECIMAL(10,2))
              ELSE 0
            END
          ), 0) AS asegurado_total
        FROM solicitudes s
        LEFT JOIN servicios srv ON srv.id = s.servicio_id
        LEFT JOIN paquetes p ON p.solicitud_id = s.id
        WHERE s.id = @id
        GROUP BY
          s.valor_estimado_usd,
          s.valor_moneda_local,
          srv.nombre,
          srv.codigo,
          srv.tipo,
          srv.tarifa_fija_1lb,
          srv.tarifa_fija_2a5,
          srv.tarifa_fija_6a10,
          srv.tarifa_por_libra_extra,
          srv.tarifa_por_libra_cc,
          srv.porcentaje_seguro,
          srv.seguro_minimo_usd,
          srv.aplica_minimo,
          srv.peso_minimo,
          srv.tarifa_minima_usd,
          srv.aplica_peso_maximo,
          srv.peso_maximo
      `);

    const datosTotales = solicitudTotales.recordset[0];

    if (!datosTotales) {
      const error = new Error("Solicitud no encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const calculoFlete = calcularFleteServicio(datosTotales, Number(datosTotales.peso_total || 0));

    if (!calculoFlete.ok) {
      const error = new Error(calculoFlete.mensaje);
      error.statusCode = 400;
      throw error;
    }

    const porcentaje = Number(datosTotales.porcentaje_seguro || 0) / 100;
    const seguroMinimoUSD = Number(datosTotales.seguro_minimo_usd || 0);
    const seguroCalculadoUSD = Number(datosTotales.asegurado_total || 0) * porcentaje;
    const seguroUSD = Math.max(seguroCalculadoUSD, seguroMinimoUSD);
    const valorEstimadoUSD = Number((Number(calculoFlete.fleteUSD || 0) + seguroUSD).toFixed(2));
    const valorUSDAnterior = Number(datosTotales.valor_estimado_usd || 0);
    const valorCOPAnterior = Number(datosTotales.valor_moneda_local || 0);
    const trmLiquidacion =
      trmSolicitud !== null
        ? trmSolicitud
        : valorUSDAnterior > 0
          ? valorCOPAnterior / valorUSDAnterior
          : 0;
    const valorMonedaLocal = Number((valorEstimadoUSD * trmLiquidacion).toFixed(2));

    await request()
      .input("id", sql.Int, id)
      .input("valor_estimado_usd", sql.Decimal(10, 2), valorEstimadoUSD)
      .input("valor_moneda_local", sql.Decimal(18, 2), valorMonedaLocal)
      .query(`
        UPDATE solicitudes
        SET valor_estimado_usd = @valor_estimado_usd,
            valor_moneda_local = @valor_moneda_local
        WHERE id = @id
      `);

    await transaction.commit();
    transactionStarted = false;

    res.json({
      ok: true,
      mensaje: "Solicitud actualizada correctamente.",
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo editarSolicitudCompleta:", rollbackError);
      }
    }

    console.error("❌ Error en editarSolicitudCompleta:", error);
    res.status(error.statusCode || 500).json({
      ok: false,
      mensaje: error.statusCode ? error.message : "Error actualizando solicitud.",
    });
  }
};


export const obtenerDestinatariosPorCliente = async (req, res) => {
  const { codigoCasillero } = req.params;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("codigoCasillero", sql.NVarChar(50), codigoCasillero)
      .query(`
      SELECT 
        d.id,
        d.nombre,
        d.ciudad,
        d.direccion,
        d.telefono,
        d.activo,
        d.es_default
      FROM destinatarios d
      INNER JOIN clientes c ON d.cliente_id = c.id
      WHERE c.codigo_referencia = @codigoCasillero
      ORDER BY d.nombre
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error obteniendo destinatarios:", err);
    res.status(500).json({ mensaje: "Error obteniendo destinatarios" });
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
      return res.status(400).json({ ok: false, mensaje: "No se envio ningun archivo." });
    }

    const pool = await poolPromise;

    const solicitud = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT
          s.comprobante_pago_url,
          s.comprobante,
          c.codigo_referencia,
          CASE
            WHEN LOWER(ISNULL(c.tipo_cliente, '')) = 'empresarial' THEN
              COALESCE(NULLIF(c.nombre_empresa, ''), CONCAT(c.primer_nombre, ' ', c.primer_apellido))
            ELSE
              RTRIM(
                ISNULL(c.primer_nombre, '') + ' ' +
                ISNULL(c.segundo_nombre + ' ', '') +
                ISNULL(c.primer_apellido, '') + ' ' +
                ISNULL(c.segundo_apellido, '')
              )
          END AS nombre_cliente
        FROM solicitudes s
        LEFT JOIN clientes c ON c.id = s.cliente_id
        WHERE s.id = @id
      `);

    if (solicitud.recordset.length === 0) {
      if (req.file.filename) {
        eliminarArchivoLocalComprobante(`/uploads/comprobantes/${req.file.filename}`);
      }
      return res.status(404).json({ ok: false, mensaje: "Solicitud no encontrada." });
    }

    const comprobanteActual =
      solicitud.recordset[0].comprobante_pago_url || solicitud.recordset[0].comprobante;

    if (comprobanteActual) {
      const blobAnterior = blobNameDesdeValor(comprobanteActual);

      if (blobAnterior) {
        eliminarArchivoPrivado(blobAnterior).catch((error) => {
          console.error("Error eliminando comprobante anterior en Azure:", error);
        });
      } else {
        eliminarArchivoLocalComprobante(comprobanteActual);
      }
    }

    let rutaArchivo = `/uploads/comprobantes/${req.file.filename}`;

    if (azureStorageDisponible()) {
      const nombreSeguro = nombreSeguroArchivo(req.file.originalname || req.file.filename);
      const blobName = `comprobantes/solicitud-${solicitudId}/${Date.now()}-${nombreSeguro}`;
      const resultadoStorage = await subirArchivoPrivado({
        buffer: req.file.buffer,
        blobName,
        contentType: req.file.mimetype,
      });

      rutaArchivo = `azure://${resultadoStorage.blobName}`;

      if (req.file.filename) {
        eliminarArchivoLocalComprobante(`/uploads/comprobantes/${req.file.filename}`);
      }
    }

    await pool.request()
      .input("id", sql.Int, solicitudId)
      .input("url", sql.NVarChar, rutaArchivo)
      .query(`
        UPDATE solicitudes
        SET comprobante_pago_url = @url,
            comprobante = @url
        WHERE id = @id
      `);

    const datosSolicitud = solicitud.recordset[0];
    const cliente =
      datosSolicitud?.nombre_cliente || datosSolicitud?.codigo_referencia || "cliente";
    const accion = comprobanteActual ? "reemplazo" : "cargo";

    crearNotificacionUsuarios({
      tipo: "success",
      titulo: comprobanteActual ? "Comprobante reemplazado" : "Comprobante cargado",
      mensaje: `Se ${accion} el comprobante de pago de la solicitud #${solicitudId} para ${cliente}.`,
      entidadTipo: "solicitud",
      entidadId: Number(solicitudId),
      url: `/conciliacion-pagos?solicitud=${solicitudId}`,
    }).catch((error) => {
      console.error("Error creando notificacion de comprobante:", error);
    });

    return res.json({
      ok: true,
      mensaje: "Comprobante actualizado correctamente",
      url: rutaArchivo,
    });
  } catch (error) {
    console.error("Error en subirComprobantePago:", error);
    return res.status(500).json({ ok: false, mensaje: "Error al subir comprobante" });
  }
};

export const obtenerComprobantePago = async (req, res) => {
  try {
    const solicitudId = req.params.id;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT comprobante_pago_url, comprobante
        FROM solicitudes
        WHERE id = @id
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const comprobante = result.recordset[0].comprobante_pago_url || result.recordset[0].comprobante;

    if (!comprobante) {
      return res.status(404).json({ mensaje: "La solicitud no tiene comprobante cargado." });
    }

    const blobName = blobNameDesdeValor(comprobante);

    if (blobName) {
      const urlTemporal = await crearUrlTemporalLectura(blobName);

      if (urlTemporal) {
        return res.redirect(urlTemporal);
      }

      const descarga = await descargarArchivoPrivado(blobName);

      if (!descarga?.readableStreamBody) {
        return res.status(404).json({ mensaje: "No se encontro el archivo del comprobante." });
      }

      res.setHeader("Content-Disposition", `inline; filename="${path.basename(blobName)}"`);
      res.setHeader("Content-Type", descarga.contentType || "application/octet-stream");
      return descarga.readableStreamBody.pipe(res);
    }

    const rutaRelativa = rutaLocalDesdeValor(comprobante);

    if (!rutaRelativa.startsWith("/uploads/comprobantes/")) {
      return res.status(400).json({ mensaje: "Ruta de comprobante no valida." });
    }

    const filePath = path.join(__dirname, "..", rutaRelativa);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ mensaje: "No se encontro el archivo del comprobante." });
    }

    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Error obteniendo comprobante:", error);
    return res.status(500).json({ mensaje: "Error interno" });
  }
};

export const eliminarComprobantePago = async (req, res) => {
  try {
    const solicitudId = req.params.id;
    const pool = await poolPromise;

    const solicitud = await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        SELECT comprobante_pago_url, comprobante
        FROM solicitudes
        WHERE id = @id
      `);

    if (!solicitud.recordset.length) {
      return res.status(404).json({ mensaje: "Solicitud no encontrada" });
    }

    const comprobante = solicitud.recordset[0].comprobante_pago_url || solicitud.recordset[0].comprobante;

    if (comprobante) {
      const blobName = blobNameDesdeValor(comprobante);

      if (blobName) {
        await eliminarArchivoPrivado(blobName);
      } else {
        eliminarArchivoLocalComprobante(comprobante);
      }
    }

    await pool.request()
      .input("id", sql.Int, solicitudId)
      .query(`
        UPDATE solicitudes
        SET comprobante_pago_url = NULL,
            comprobante = NULL
        WHERE id = @id
      `);

    return res.json({ ok: true, mensaje: "Comprobante eliminado correctamente." });
  } catch (error) {
    console.error("Error eliminando comprobante:", error);
    return res.status(500).json({ mensaje: "Error interno" });
  }
};
export const agruparSolicitud = async (req, res) => {

  const { id } = req.params;
  const { hawbs } = req.body;
  const hawbsNormalizados = normalizarHawbsAgrupacion(hawbs);
  let transaction;
  let transactionStarted = false;

  if (!id) {
    return res.status(400).json({
      ok: false,
      mensaje: "ID de solicitud requerido"
    });
  }

  if (hawbsNormalizados.length < 2) {
    return res.status(400).json({
      ok: false,
      mensaje: "Debe seleccionar al menos 2 paquetes para agrupar"
    });
  }

  try {

    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    transactionStarted = true;
    const request = () => new sql.Request(transaction);

    // 🔹 Obtener paquetes hijos
    const hawbInClause = buildHawbInClause(hawbsNormalizados);

    const paquetesRequest = bindHawbInputs(
      request().input("solicitud_id", sql.Int, id),
      hawbsNormalizados
    );

    const paquetes = await paquetesRequest
      .query(`
        SELECT 
          id,
          hawb,
          tracking,
          contenido,
          peso,
          asegurado,
          servicio_id,
          tienda,
          codigo_referencia,
          digitado_por
        FROM paquetes
        WHERE solicitud_id = @solicitud_id
          AND ISNULL(agrupado_bit,0) = 0
          AND hawb IN (${hawbInClause})
      `);

    if (paquetes.recordset.length !== hawbsNormalizados.length) {
      await transaction.rollback();
      transactionStarted = false;
      return res.status(400).json({
        ok: false,
        mensaje: "No hay paquetes válidos para agrupar"
      });
    }

    const hijos = paquetes.recordset;

    const prefijo = hijos[0].hawb.substring(0, 4);
    const consecutivo = Math.floor(100000000 + Math.random() * 900000000);
    const hawbPadre = `${prefijo}${consecutivo}G`;

    const pesoTotal = hijos.reduce((s,p)=>s+Number(p.peso||0),0);
    const aseguradoTotal = hijos.reduce((s,p)=>s+Number(p.asegurado||0),0);

    const tracking = buildTrackingPadreAgrupado(hawbPadre);
    const contenido = hijos.map(p=>p.contenido).filter(Boolean).join(", ");

    const servicio = hijos[0].servicio_id;
    const tienda = hijos[0].tienda;
    const codigo_referencia = hijos[0].codigo_referencia;
    const digitado_por = hijos[0].digitado_por;

    const padre = await request()
      .input("hawb", sql.NVarChar(50), hawbPadre)
      .input("tracking", sql.NVarChar(50), tracking)
      .input("contenido", sql.NVarChar(sql.MAX), contenido)
      .input("peso", sql.Decimal(10,2), pesoTotal)
      .input("asegurado", sql.Decimal(10,2), aseguradoTotal)
      .input("servicio_id", sql.Int, servicio)
      .input("tienda", sql.NVarChar(100), tienda)
      .input("codigo_referencia", sql.NVarChar(50), codigo_referencia)
      .input("digitado_por", sql.NVarChar(100), digitado_por)
      .input("solicitud_id", sql.Int, id)
      .query(`
        INSERT INTO paquetes (
          hawb,
          tracking,
          contenido,
          peso,
          asegurado,
          servicio_id,
          tienda,
          codigo_referencia,
          digitado_por,
          solicitud_id,
          agrupado_bit
        )
        OUTPUT INSERTED.id
        VALUES (
          @hawb,
          @tracking,
          @contenido,
          @peso,
          @asegurado,
          @servicio_id,
          @tienda,
          @codigo_referencia,
          @digitado_por,
          @solicitud_id,
          0
        )
      `);

    // 🔹 Marcar hijos
    const actualizarHijosRequest = bindHawbInputs(
      request()
        .input("padre", sql.NVarChar(50), hawbPadre)
        .input("solicitud_id", sql.Int, id),
      hawbsNormalizados
    );

    await actualizarHijosRequest
      .query(`
        UPDATE paquetes
        SET agrupado_bit = 1,
            hawb_padre = @padre
        WHERE solicitud_id = @solicitud_id
          AND hawb IN (${hawbInClause})
      `);

    // 🔹 Obtener estado Agrupado
    const estado = await request()
      .query(`
        SELECT TOP 1 id
        FROM estados_catalogo
        WHERE nombre = 'Agrupado'
      `);

    const estado_id = estado.recordset[0].id;

    // 🔹 Crear estado inicial
    await request()
      .input("hawb", sql.NVarChar(50), hawbPadre)
      .input("estado_id", sql.Int, estado_id)
      .input("punto_control", sql.NVarChar(100), "Otras operaciones")
      .input("observaciones", sql.NVarChar(200), "Guía agrupada automáticamente")
      .input("responsable", sql.NVarChar(100), "Sistema")
      .query(`
        INSERT INTO historial_estados
        (hawb, estado, estado_id, punto_control, observaciones, responsable)
        VALUES
        (@hawb, 'Agrupado', @estado_id, @punto_control, @observaciones, @responsable)
      `);

    await transaction.commit();
    transactionStarted = false;

    res.json({
      ok: true,
      mensaje: "Paquetes agrupados correctamente",
      hawb_agrupado: hawbPadre,
      peso_total: pesoTotal
    });

  } catch (error) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error revirtiendo agruparSolicitud:", rollbackError);
      }
    }

    console.error("❌ Error agrupando solicitud:", error);

    res.status(500).json({
      ok: false,
      mensaje: "Error interno al agrupar paquetes"
    });

  }

};

export const generarEtiquetaHawbPadre = async (req, res) => {
  const { hawbPadre: hawb } = req.params;

  try {
    const pool = await poolPromise;

    // 1️⃣ Obtener datos del HAWB PADRE
    const result = await pool.request()
      .input("hawb", sql.NVarChar(50), hawb)
      .query(`
        SELECT
          p.hawb,
          p.peso,
          p.contenido,
          p.fecha_registro,
          p.solicitud_id,
          s.id AS solicitud_id,
          d.nombre,
          d.direccion,
          d.ciudad,
          d.departamento,
          d.pais,
          d.telefono,
          c.codigo_referencia,
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
          END AS cliente
        FROM paquetes p
        INNER JOIN solicitudes s ON s.id = p.solicitud_id
        LEFT JOIN destinatarios d ON d.id = s.destinatario
        LEFT JOIN clientes c ON c.id = s.cliente_id
        WHERE p.hawb = @hawb
          AND p.hawb LIKE '%G'
          AND ISNULL(p.agrupado_bit, 0) = 0
      `);

    if (!result.recordset.length) {
      return res.status(404).json({ mensaje: "HAWB padre no encontrado" });
    }

    const padre = result.recordset[0];

    // 2️⃣ Contar paquetes hijos
    const hijos = await pool.request()
      .input("hawb", sql.NVarChar(50), hawb)
      .query(`
        SELECT COUNT(*) AS total
        FROM paquetes
        WHERE hawb_padre = @hawb
      `);

    const totalHijos = hijos.recordset[0].total || 0;

    // 3️⃣ Código de barras
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: hawb,
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
      `inline; filename="${hawb}.pdf"`
    );

    doc.pipe(res);

    doc.roundedRect(8, 8, 284, 584, 12).stroke("#222222");

    drawLogoJaesCargo(doc, 18, 16, 85);

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
      .text(hawb, 20, 132, {
        align: "center",
        width: 260
      });

    doc.image(barcodeBuffer, 38, 185, { width: 224, height: 55 });

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(hawb, 20, 245, {
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

    const fechaFormateada = new Date(padre.fecha_registro).toLocaleDateString("es-CO");

    dibujarFila("Cliente", padre.cliente);
    dibujarFila("Contenido", padre.contenido);
    dibujarFila("Peso total", `${Number(padre.peso).toFixed(2)} LB`);
    dibujarFila("Fecha", fechaFormateada);
    dibujarFila("Código ref.", padre.codigo_referencia);
    dibujarFila("Paquetes hijos", totalHijos.toString());
    dibujarFila("País", padre.pais);
    dibujarFila("Ciudad", padre.ciudad);
    dibujarFila("Dirección", padre.direccion);
    dibujarFila("Celular", padre.telefono);

    doc.end();


  } catch (error) {
    console.error("❌ Error PDF:", error);
    res.status(500).json({ mensaje: "Error generando etiqueta" });
  }
};







