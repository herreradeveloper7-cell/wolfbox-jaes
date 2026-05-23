import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const cardBase =
  "rounded-2xl border border-gray-200/80 bg-white/90 shadow-[0_18px_45px_rgba(17,24,39,0.08)]";

const labelBase =
  "text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500";

const formatUsd = (value: number) => `$${value.toFixed(2)} USD`;

const formatCop = (value: number) =>
  `$${value.toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} COP`;

function LoadingState({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-red-900/30 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-red-900/10" />
        
        <div className="relative">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-red-900/20 border-t-red-900 border-r-red-900 animate-spin" />
          <p className="font-bold text-gray-800 text-lg">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 backdrop-blur-md">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-900/30 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border border-red-900/10" />
        
        <div className="relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-red-100 text-3xl font-semibold text-red-900 shadow-lg">
            !
          </div>
          <p className="font-bold text-red-900 text-lg">{text}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg sm:rounded-xl border border-red-900/10 bg-gradient-to-br from-white via-red-50/50 to-gray-50 p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-50/0 to-red-950/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-1 sm:mt-2 break-words font-mono text-sm sm:text-xl font-semibold text-red-950 relative z-10">
        {value}
      </p>
      {helper && <p className="mt-0.5 sm:mt-1 text-xs font-medium text-gray-500">{helper}</p>}
    </div>
  );
}

export default function ModalVerDetalleSolicitud({
  solicitud,
  onClose,
}: {
  solicitud: any;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<any>({
    solicitud: null,
    paquetes: [],
    cargos: [],
  });

  const [cargando, setCargando] = useState(true);
  const [enviandoCobro, setEnviandoCobro] = useState(false);

  const [servicio, setServicio] = useState<any>(null);
  const [loadingServicio, setLoadingServicio] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await axios.get(
          `/api/solicitudes/detalle/${solicitud.id}`
        );

      setDetalle({
        solicitud: data.solicitud,
        paquetes: data.paquetes || [],
        cargos: data.cargos || [],
      });

      } catch (error) {
        Swal.fire("Error", "No se pudo obtener el detalle", "error");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [solicitud.id]);

  useEffect(() => {
    if (!detalle.solicitud?.servicio_id) return;

    const cargarServicio = async () => {
      try {
        const { data } = await axios.get(
          `/api/servicios/${detalle.solicitud.servicio_id}`
        );

        if (data.ok) {
          setServicio(data.servicio);
        }
      } catch (err) {
        console.error("Error cargando servicio:", err);
      } finally {
        setLoadingServicio(false);
      }
    };

    cargarServicio();
  }, [detalle.solicitud?.servicio_id]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  if (loadingServicio || cargando) {
    return <LoadingState text="Cargando información de la solicitud..." />;
  }

  if (!servicio) {
    return <ErrorState text="Error: No se encontró el servicio asociado" />;
  }

  const esHawbPadre = (p: any) => {
    return (
      p.es_padre === true ||
      p.es_padre === 1 ||
      p.es_padre === "1" ||
      String(p.hawb || "").toUpperCase().endsWith("G")
    );
  };

  const hawbPadre = detalle.paquetes.find((p: any) => esHawbPadre(p));
  const hawbHijos = detalle.paquetes.filter((p: any) => !esHawbPadre(p));
  const paquetesParaTotales = hawbPadre ? hawbHijos : detalle.paquetes;

  const totalPeso = paquetesParaTotales.reduce(
    (acc: number, p: any) => acc + Number(p.peso || 0),
    0
  );


  const fleteUSD = Number(detalle.solicitud?.fleteUSD || 0);
  const seguroUSD = Number(detalle.solicitud?.seguroUSD || 0);

  const totalCargosUSD = detalle.cargos.reduce(
    (acc: number, c: any) => acc + Number(c.valor_usd || 0),
    0
  );

  const totalUSD = Number(
    detalle.solicitud?.totalUSDConCargos ??
    detalle.solicitud?.totalUSD ??
    0
  );

  const totalCOP = Number(
    detalle.solicitud?.totalCOPConCargos ??
    detalle.solicitud?.totalCOP ??
    detalle.solicitud?.valor_moneda_local ??
    0
  );

  const trmAplicada = Number(
    detalle.solicitud?.trm ??
    (
      Number(detalle.solicitud?.valor_estimado_usd || 0) > 0
        ? Number(detalle.solicitud?.valor_moneda_local || 0) /
          Number(detalle.solicitud?.valor_estimado_usd || 0)
        : 0
    )
  );

  const cantidadPaquetes = hawbPadre ? hawbHijos.length : detalle.paquetes.length;

  const enviarCobro = async () => {
    const confirmacion = await Swal.fire({
      title: "Enviar cobro",
      text: "Se enviara el correo de solicitud facturada al email registrado del cliente con el PDF adjunto.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#7d1111",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Si, enviar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setEnviandoCobro(true);
      const { data } = await axios.post(
        `/api/solicitudes/enviar-cobro/${solicitud.id}`
      );

      Swal.fire(
        "Cobro enviado",
        data?.destinatario
          ? `El correo fue enviado a ${data.destinatario}.`
          : "El correo fue enviado correctamente.",
        "success"
      );
    } catch (error: any) {
      console.error("Error enviando cobro:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.mensaje || "No se pudo enviar el cobro.",
        "error"
      );
    } finally {
      setEnviandoCobro(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/65 px-3 py-3 backdrop-blur-md animate-fade-in sm:px-6 sm:py-5">
      <div className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-white/30 bg-gray-50 shadow-[0_30px_90px_rgba(0,0,0,0.38)] max-h-[95vh] sm:max-h-[92vh]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-950 via-red-700 to-gray-300" />

        <header className="relative overflow-hidden border-b border-gray-200/50 bg-gradient-to-br from-white via-red-50/20 to-white px-4 py-6 sm:px-8 sm:py-10 flex-shrink-0">
          <div className="absolute bottom-0 right-0 h-32 w-80 rounded-tl-full bg-red-950/5 pointer-events-none" />
          <div className="absolute right-10 top-0 h-px w-96 bg-gradient-to-r from-transparent via-red-900/20 to-transparent pointer-events-none" />

          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-900/20 bg-gradient-to-r from-red-50 to-red-100/60 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-red-950 backdrop-blur-sm">
                Detalle de solicitud
              </span>
              <span className="rounded-full border border-gray-200/60 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                ID #{solicitud.id}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-700">
              {solicitud.destinatario_nombre}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-600">
              <span className="text-red-950 font-semibold">Servicio:</span> {servicio.nombre} · <span className="text-red-950 font-semibold">Pago:</span> {solicitud.medio_pago}
            </p>
          </div>
        </header>

        <div className="overflow-y-auto flex-1 px-4 py-5 sm:px-8 sm:py-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
            <main className="space-y-4 sm:space-y-6 min-w-0">
              <section className={`${cardBase} overflow-hidden`}>
                <div className="border-b border-gray-200/50 bg-gradient-to-r from-red-950 to-red-900 px-4 sm:px-5 py-4 sm:py-5 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100/70">
                    Detalles operacionales
                  </p>
                  <h3 className="mt-2 text-base sm:text-lg font-semibold text-white tracking-tight">
                    Información de la solicitud
                  </h3>
                </div>

                <div className="grid gap-3 sm:gap-4 p-4 sm:p-5 sm:grid-cols-2">
                  <div className="relative overflow-hidden rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/80 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-50/0 to-red-950/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className={labelBase}>Destinatario</p>
                    <p className="mt-2 text-sm sm:text-base font-semibold text-gray-700 relative z-10 break-words">
                      {solicitud.destinatario_nombre}
                    </p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/80 p-3 sm:p-4 hover:shadow-md transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-50/0 to-red-950/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className={labelBase}>Medio de pago</p>
                    <p className="mt-2 text-sm sm:text-base font-semibold text-gray-700 relative z-10">
                      {solicitud.medio_pago}
                    </p>
                  </div>

                  {solicitud.observaciones && (
                    <div className="relative overflow-hidden rounded-xl border border-red-900/20 bg-gradient-to-br from-red-50/80 to-red-100/40 p-3 sm:p-4 sm:col-span-2 group hover:shadow-md transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-100/0 to-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className={labelBase}>Observaciones</p>
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-700 relative z-10">
                        {solicitud.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {hawbPadre && (
                <section className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-gradient-to-br from-red-950 via-red-900 to-[#3b0505] text-white shadow-[0_24px_60px_rgba(69,10,10,0.3)]">
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-white/10 pointer-events-none" />
                  <div className="absolute -left-20 -bottom-20 h-60 w-60 rounded-full border border-white/5 pointer-events-none" />

                  <div className="relative p-4 sm:p-6 md:p-8">
                    <div className="mb-4 sm:mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200/70">
                          Agrupación principal
                        </p>
                        <h3 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">HAWB Padre</h3>
                      </div>
                      <p className="font-mono text-xs sm:text-sm font-bold text-red-100/80 bg-white/10 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20 break-all">
                        {hawbPadre.hawb}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-4">
                      {[
                        { label: "HAWB", value: hawbPadre.hawb },
                        { label: "Tracking", value: hawbPadre.tracking },
                        { label: "Peso", value: `${hawbPadre.peso} lb` },
                        { label: "Asegurado", value: formatUsd(Number(hawbPadre.asegurado || 0)) },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 sm:p-3 hover:bg-white/15 transition-all duration-300 group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-red-100/60">
                            {item.label}
                          </p>
                          <p className="mt-1.5 sm:mt-2 break-all  sm:text-sm font-semibold relative z-10">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {hawbPadre.contenido && (
                      <div className="mt-3 sm:mt-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 sm:p-4">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-red-100/60">
                          Contenido
                        </p>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-white/95">
                          {hawbPadre.contenido}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {hawbHijos.length > 0 && (
                <section className={`${cardBase} overflow-hidden`}>
                  <div className="flex flex-col gap-2 border-b border-gray-200/50 bg-gradient-to-r from-red-950 to-red-900 px-4 sm:px-5 py-4 sm:py-5 text-white sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100/70">
                        {hawbPadre ? "Desglose de agrupación" : "Detalle de paquetes"}
                      </p>
                      <h3 className="mt-2 text-base sm:text-lg font-semibold text-white tracking-tight">
                        Trazabilidad y valores asegurados
                      </h3>
                    </div>
                    <span className="w-fit text-xs sm:text-sm font-bold text-red-100 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      {hawbHijos.length} registros
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 sticky top-0">
                        <tr className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-gray-600">
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-left font-semibold">HAWB</th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-left font-semibold">Tracking</th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-left font-semibold">
                            Tienda
                          </th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-left font-semibold">
                              Fecha digitación
                            </th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-center font-semibold">Peso</th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-center font-semibold">Asegurado</th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-left font-semibold hidden sm:table-cell">Contenido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {hawbHijos.map((p: any, idx: number) => (
                          <tr
                            key={idx}
                            className="bg-white transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/60 hover:to-transparent group"
                          >
                            <td className="px-3 sm:px-5 py-3 sm:py-4 font-mono font-semibold text-red-950 text-xs sm:text-sm">
                              {p.hawb}
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 font-mono text-gray-700 font-semibold group-hover:text-red-700 transition text-xs sm:text-sm">
                              {p.tracking}
                            </td>

                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <div className="max-w-[180px] truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700">
                                {p.tienda || "—"}
                              </div>
                            </td>

                            <td className="px-3 sm:px-5 py-3 sm:py-4">
                              <div className="flex flex-col">
                                <span className="font-mono text-xs font-bold text-gray-700">
                                  {p.fecha_digitacion
                                    ? new Date(p.fecha_digitacion).toLocaleDateString("es-CO")
                                    : "—"}
                                </span>

                                <span className="font-mono text-[10px] text-gray-400">
                                  {p.fecha_digitacion
                                    ? new Date(p.fecha_digitacion).toLocaleTimeString("es-CO", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : ""}
                                </span>
                              </div>
                            </td>

                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-center font-semibold text-gray-700 text-xs sm:text-sm">
                              {p.peso}
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-center font-mono font-bold text-red-950 text-xs sm:text-sm">
                              {formatUsd(Number(p.asegurado || 0))}
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-xs leading-relaxed text-gray-600 hidden sm:table-cell">
                              {p.contenido || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {detalle.cargos.length > 0 && (
                <section className={`${cardBase} overflow-hidden`}>
                  <div className="flex flex-col gap-2 border-b border-gray-200/50 bg-gradient-to-r from-red-950 to-red-900 px-4 sm:px-5 py-4 sm:py-5 text-white sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100/70">
                        Finanzas
                      </p>
                      <h3 className="mt-2 text-base sm:text-lg font-semibold text-white tracking-tight">
                        Cargos y conceptos adicionales
                      </h3>
                    </div>
                    <span className="w-fit text-xs sm:text-sm font-bold text-red-100 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                      {detalle.cargos.length} cargos
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 sticky top-0">
                        <tr className="text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-gray-600">
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-left font-semibold">
                            Tipo de cargo
                          </th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-center font-semibold">
                            Valor USD
                          </th>
                          <th className="px-3 sm:px-5 py-3 sm:py-4 text-center font-semibold">
                            Valor COP
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detalle.cargos.map((c: any) => (
                          <tr key={c.id} className="bg-white transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50/60 hover:to-transparent">
                            <td className="px-3 sm:px-5 py-3 sm:py-4 font-semibold text-gray-800 text-xs sm:text-sm">
                              {c.tipo_cargo}
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-center font-mono font-bold text-red-950 text-xs sm:text-sm">
                              {formatUsd(Number(c.valor_usd || 0))}
                            </td>
                            <td className="px-3 sm:px-5 py-3 sm:py-4 text-center font-mono font-semibold text-gray-700 text-xs sm:text-sm">
                              {formatCop(Number(c.valor_cop || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </main>

            {/* Sidebar - Resumen Total */}
            <aside className="lg:sticky lg:top-0 lg:self-start lg:space-y-6">
              <section className="relative overflow-hidden rounded-2xl border border-red-900/30 bg-white shadow-[0_24px_60px_rgba(17,24,39,0.12)]">
                <div className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-[#3b0505] p-4 sm:p-6 text-white">
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full border border-white/10 pointer-events-none" />
                  
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-100/70">
                      Total a cobrar
                    </p>
                    <p className="mt-2 sm:mt-3 font-mono text-3xl sm:text-5xl font-semibold tracking-tighter">
                      {formatUsd(totalUSD)}
                    </p>
                    <p className="mt-1 sm:mt-2 font-mono text-xs sm:text-lg font-bold text-red-100/90">
                      {formatCop(totalCOP)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-5">
                  <StatCard label="Paquetes" value={cantidadPaquetes} />
                  <StatCard label="Peso" value={`${totalPeso} lb`} />
                  <StatCard label="Flete" value={formatUsd(fleteUSD)} />
                  <StatCard label="Seguro" value={formatUsd(seguroUSD)} />
                  {totalCargosUSD > 0 && (
                    <div className="col-span-2">
                      <StatCard
                        label="Cargos"
                        value={formatUsd(totalCargosUSD)}
                        helper="Adicionales"
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
                      TRM aplicada
                    </p>
                    <p className="mt-1 font-mono font-semibold text-red-950 text-sm sm:text-lg">
                      {trmAplicada.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="text-2xl sm:text-3xl text-red-950/20">$</div>
                </div>
              </section>
            </aside>
          </div>
        </div>

        {/* Footer - Button */}
        <footer className="flex items-center justify-end gap-3 border-t border-gray-200/50 bg-gradient-to-r from-white via-gray-50/50 to-white px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
          <button
            onClick={enviarCobro}
            disabled={enviandoCobro}
            className="inline-flex items-center justify-center rounded-xl border border-red-900/20 bg-white px-5 sm:px-7 py-2 sm:py-3 text-xs sm:text-sm font-bold text-red-950 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-900/10 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            {enviandoCobro ? "Enviando cobro..." : "Enviar cobro"}
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-950/20 transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-900/20 whitespace-nowrap cursor-pointer"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
              
