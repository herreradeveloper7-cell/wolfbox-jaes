export type ValorExcel = string | number | boolean | Date | null | undefined;

export interface HojaExcel {
  nombre: string;
  filas: ValorExcel[][];
  anchos?: number[];
}

export const filasDesdeObjetos = (
  registros: Array<Record<string, ValorExcel>>
): ValorExcel[][] => {
  if (registros.length === 0) return [];

  const encabezados = Object.keys(registros[0]);
  return [
    encabezados,
    ...registros.map((registro) =>
      encabezados.map((encabezado) => registro[encabezado])
    ),
  ];
};

export const exportarExcel = async (
  nombreArchivo: string,
  hojas: HojaExcel[]
) => {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "WolfBox";
  workbook.created = new Date();

  hojas.forEach(({ nombre, filas, anchos }) => {
    const worksheet = workbook.addWorksheet(nombre);
    worksheet.addRows(
      filas.map((fila) => fila.map((valor) => (valor == null ? "" : valor)))
    );

    if (anchos) {
      anchos.forEach((ancho, indice) => {
        worksheet.getColumn(indice + 1).width = ancho;
      });
    }

    const encabezado = worksheet.getRow(1);
    encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
    encabezado.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF8B0000" },
    };
    encabezado.alignment = { vertical: "middle" };
    encabezado.height = 22;
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = worksheet.rowCount
      ? { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.columnCount } }
      : undefined;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
};
