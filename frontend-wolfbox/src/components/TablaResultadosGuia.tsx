import React, { useState } from "react";
import iconEdit from "../assets/editExtra-svgrepo-com.svg";
import iconPrint from "../assets/print2-svgrepo-com.svg";
import iconDetails from "../assets/options-lines-svgrepo-com.svg";
import iconDelete from "../assets/cancel-svgrepo-com.svg";
import ModalEditarGuia from "./ModalEditarGuia";
import ModalHistorialGuia from "./ModalHistorialGuia";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import logoEmpresa from "../assets/LogoJaesDashboard.png";
import Swal from "sweetalert2";
import axios from "axios";





export type GuiaRow = {
  id: string;
  guia: string;
  guiaAsociada?: string | null;
  tracking: string;
  fecha: string;        
  ubicacion: string;
  estado: string;
  total: number;
  pesoLb: number;
  pesoKg: number;
  valorDeclarado: number;
  contenido?: string;     
  notas?: string; 
  cliente?: string;              
  codigo_referencia?: string;    
};

interface Props {
  rows: GuiaRow[];
  loading?: boolean;
  emptyText?: string;
  fetchResults: () => void;
}

const TablaResultadosGuia: React.FC<Props> = ({ rows, loading, emptyText, fetchResults  }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuia, setSelectedGuia] = useState<any>(null);
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [hawbSeleccionado, setHawbSeleccionado] = useState<string | null>(null);

  const handleEditClick = (guia: any) => {
    if (!guia) return; 
    setSelectedGuia({ ...guia }); 
    setIsModalOpen(true);
  };


  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Cargando resultados…</div>
    );
  }

  if (!rows.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        {emptyText ?? "Sin resultados para mostrar"}
      </div>
    );
  }

const handleAnular = async (hawb: string) => {
  Swal.fire({
    title: "¿Anular guía?",
    text: `¿Estás seguro de que deseas anular la guía ${hawb}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#8B0000",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sí, anular",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await axios.put(`http://localhost:3000/api/paquetes/anular/${hawb}`);

        Swal.fire({
          icon: "success",
          title: "Guía anulada correctamente",
          text: `La guía ${hawb} ha sido marcada como Anulada.`,
          timer: 2000,
          showConfirmButton: false,
        });

        // Refresca los datos en la tabla
        fetchResults();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error al anular la guía",
          text: "No se pudo anular. Intenta nuevamente.",
        });
      }
    }
  });
};

const handleDetalles = (guia: GuiaRow) => {
  if (!guia.guia) return;
  setHawbSeleccionado(guia.guia);
  setIsHistorialOpen(true);
};

const handleImprimirEtiqueta = (guia: GuiaRow) => {
  try {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, guia.guia || guia.tracking, {
      format: "CODE128",
      displayValue: false,
      width: 2,
      height: 60,
      margin: 0,
    });

    const barcodeImage = canvas.toDataURL("image/png");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [300, 500],
    });

    const centerText = (doc: any, text: string, y: number) => {
      const textWidth = doc.getTextWidth(text);
      const pageWidth = doc.internal.pageSize.getWidth();
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };

    doc.addImage(logoEmpresa, "PNG", 220, 20, 60, 40);

    doc.setFontSize(14);
    doc.text("BOGOTÁ -", 20, 40);
    doc.text("CO", 20, 65);

    doc.addImage(barcodeImage, "PNG", 50, 90, 200, 60);

    doc.setFontSize(12);
    doc.text("1 de 1", 20, 170);
    doc.setFontSize(20);
    centerText(doc, guia.guia || guia.tracking, 200);

    doc.setFontSize(12);
    centerText(doc, `Fecha: ${guia.fecha}`, 230);
    centerText(doc, `Lb: ${guia.pesoLb}`, 250);
    centerText(doc, `Contenido: ${guia.contenido || "No especificado"}`, 270);

    centerText(doc, "Bogotá D.C. - Colombia", 300);
    centerText(doc, `${guia.cliente || "Cliente no especificado"}`, 320);
    centerText(doc, `Casillero: ${guia.codigo_referencia || "—"}`, 340);


    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } catch (error) {
    console.error("❌ Error al generar etiqueta:", error);
    Swal.fire({
      icon: "error",
      title: "Error al generar etiqueta",
      text: "No se pudo crear la etiqueta. Intenta nuevamente.",
    });
  }
};


  
  return (
    <>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:whitespace-nowrap">
            <th className="text-left">Opciones</th>
            <th className="text-left">Guía</th>
            <th className="text-left">Guía asociada</th>
            <th className="text-left">Tracking</th>
            <th className="text-left">Contenido</th>
            <th className="text-left">Cliente</th>
            <th className="text-left">Código Casillero</th>
            <th className="text-left">Fecha</th>
            <th className="text-left">Ubicación</th>
            <th className="text-left">Estado</th>
            <th className="text-right">Total</th>
            <th className="text-right">Peso lb</th>
            <th className="text-right">Peso Kg</th>
            <th className="text-right">Valor Declarado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-800">
          {rows.map((r) => (
            <tr key={r.id} className="[&>td]:px-3 [&>td]:py-2">
            <td className="flex gap-2">
            {r.estado !== "Anulado" ? (
              <>
                <button
                  onClick={() => handleEditClick(r)}
                  title="Editar guía"
                  className="p-1 rounded bg-yellow-400 hover:bg-yellow-500 transition cursor-pointer"
                >
                  <img src={iconEdit} alt="Editar" className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleAnular(r.guia)}
                  title="Anular guía"
                  className="p-1 rounded bg-red-500 hover:bg-red-600 transition cursor-pointer"
                >
                  <img src={iconDelete} alt="Anular" className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleDetalles(r)}
                  title="Ver historial"
                  className="p-1 rounded bg-green-600 hover:bg-green-700 transition cursor-pointer"
                >
                  <img src={iconDetails} alt="Detalles" className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleImprimirEtiqueta(r)}
                  title="Imprimir etiqueta"
                  className="p-1 rounded bg-blue-600 hover:bg-blue-700 transition cursor-pointer"
                >
                  <img src={iconPrint} alt="Imprimir" className="w-5 h-5" />
                </button>
              </>
            ) : (
              <span className="text-gray-500 italic text-xs">Anulada</span>
            )}

            </td>
              <td>{r.guia}</td>
              <td>{r.guiaAsociada || "—"}</td>
              <td className="truncate max-w-[240px]">{r.tracking}</td>
              <td className="truncate max-w-[240px]">{r.contenido || "—"}</td>
              <td className="truncate max-w-[200px]">{r.cliente || "—"}</td>
              <td className="truncate max-w-[150px]">{r.codigo_referencia || "—"}</td>

              <td>{r.fecha}</td>
              <td>{r.ubicacion}</td>
              <td>{r.estado || "Sin estado"}</td>
              <td className="text-right">{Number(r.total ?? 0).toFixed(2)}</td>
              <td className="text-right">{Number(r.pesoLb ?? 0).toFixed(2)}</td>
              <td className="text-right">{Number(r.pesoKg ?? 0).toFixed(2)}</td>
              <td className="text-right">{Number(r.valorDeclarado ?? 0).toFixed(2)}</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {isModalOpen && (
      <ModalEditarGuia
        guiaSeleccionada={selectedGuia}
        onClose={() => setIsModalOpen(false)}
        onActualizado={fetchResults}
      />
    )}
    {isHistorialOpen && hawbSeleccionado && (
      <ModalHistorialGuia
        hawb={hawbSeleccionado}
        onClose={() => setIsHistorialOpen(false)}
      />
    )}

  </>
  );
};

export default TablaResultadosGuia;
