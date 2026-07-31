const numero = (valor) => {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
};

export const normalizarRangosTarifa = (rangos = []) =>
  (() => {
    if (Array.isArray(rangos)) return rangos;
    if (typeof rangos !== "string" || !rangos.trim()) return [];
    try {
      const parsed = JSON.parse(rangos);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })()
    .map((rango) => ({
      peso_desde: numero(rango?.peso_desde),
      peso_hasta: numero(rango?.peso_hasta),
      valor_usd: numero(rango?.valor_usd),
    }))
    .sort((a, b) => a.peso_desde - b.peso_desde || a.peso_hasta - b.peso_hasta);

export const validarRangosTarifa = (rangos = []) => {
  const normalizados = normalizarRangosTarifa(rangos);

  if (!normalizados.length) {
    return { ok: false, mensaje: "Debe configurar al menos un rango de peso." };
  }

  for (let index = 0; index < normalizados.length; index += 1) {
    const rango = normalizados[index];
    if (rango.peso_desde < 0 || rango.peso_hasta <= 0 || rango.valor_usd <= 0) {
      return { ok: false, mensaje: "Los pesos no pueden ser negativos y el valor del rango debe ser mayor a cero." };
    }
    if (rango.peso_desde >= rango.peso_hasta) {
      return { ok: false, mensaje: "El peso inicial de cada rango debe ser menor que el peso final." };
    }
    if (index > 0 && rango.peso_desde < normalizados[index - 1].peso_hasta) {
      return { ok: false, mensaje: "Los rangos de peso no pueden superponerse." };
    }
  }

  return { ok: true, rangos: normalizados };
};

const rangosLegacy = (servicio) => {
  const rangos = [
    { peso_desde: 0, peso_hasta: 1, valor_usd: numero(servicio?.tarifa_fija_1lb) },
    { peso_desde: 1, peso_hasta: 5, valor_usd: numero(servicio?.tarifa_fija_2a5) },
    { peso_desde: 5, peso_hasta: 10, valor_usd: numero(servicio?.tarifa_fija_6a10) },
  ].filter((rango) => rango.valor_usd > 0);

  return rangos;
};

export const calcularFleteServicio = (servicio = {}, peso = 0) => {
  const pesoTotal = numero(peso);
  const pesoMaximo = numero(servicio.peso_maximo);

  if (servicio.aplica_peso_maximo && pesoMaximo > 0 && pesoTotal > pesoMaximo) {
    return {
      ok: false,
      mensaje: `El servicio ${servicio.nombre || "seleccionado"} solo permite hasta ${pesoMaximo} lb. Peso actual: ${pesoTotal} lb.`,
      fleteUSD: 0,
    };
  }

  const pesoMinimo = numero(servicio.peso_minimo);
  const tarifaMinimaUSD = numero(servicio.tarifa_minima_usd);
  if (servicio.aplica_minimo && pesoMinimo > 0 && tarifaMinimaUSD > 0 && pesoTotal <= pesoMinimo) {
    return { ok: true, fleteUSD: tarifaMinimaUSD };
  }

  const rangosConfigurados = normalizarRangosTarifa(servicio.tarifas_rangos);
  const rangos = rangosConfigurados.length ? rangosConfigurados : rangosLegacy(servicio);
  const tarifaExtra = numero(servicio.tarifa_por_libra_extra);

  if (rangos.length || tarifaExtra > 0) {
    const rango = rangos.find(
      (item, index) =>
        pesoTotal > item.peso_desde &&
        (pesoTotal <= item.peso_hasta || (index === 0 && pesoTotal === 0))
    );

    if (rango) return { ok: true, fleteUSD: rango.valor_usd };

    const ultimoRango = rangos.at(-1);
    if (ultimoRango && pesoTotal > ultimoRango.peso_hasta && tarifaExtra > 0) {
      return { ok: true, fleteUSD: pesoTotal * tarifaExtra };
    }

    return {
      ok: false,
      mensaje: `El peso ${pesoTotal} lb no está cubierto por los rangos del servicio ${servicio.nombre || "seleccionado"}.`,
      fleteUSD: 0,
    };
  }

  const tarifaLibra = numero(servicio.tarifa_por_libra_cc);
  if (tarifaLibra > 0) {
    const pesoFacturable = pesoTotal < 10 ? 10 : pesoTotal;
    return { ok: true, fleteUSD: pesoFacturable * tarifaLibra };
  }

  return {
    ok: false,
    mensaje: `El servicio ${servicio.nombre || "seleccionado"} no tiene una tarifa válida configurada.`,
    fleteUSD: 0,
  };
};

export const calcularSeguroServicio = (servicio = {}, valorAsegurado = 0) => {
  const asegurado = numero(valorAsegurado);
  const porcentaje = numero(servicio.porcentaje_seguro) / 100;
  const seguroMinimo = numero(servicio.seguro_minimo_usd);
  return Math.max(asegurado * porcentaje, seguroMinimo);
};

export const calcularCotizacionServicio = (servicio, pesoTotal, valorAsegurado) => {
  const flete = calcularFleteServicio(servicio, pesoTotal);
  if (!flete.ok) return flete;

  const seguroUSD = calcularSeguroServicio(servicio, valorAsegurado);
  const fleteUSD = numero(flete.fleteUSD);
  return {
    ok: true,
    fleteUSD: Number(fleteUSD.toFixed(2)),
    seguroUSD: Number(seguroUSD.toFixed(2)),
    totalUSD: Number((fleteUSD + seguroUSD).toFixed(2)),
  };
};
