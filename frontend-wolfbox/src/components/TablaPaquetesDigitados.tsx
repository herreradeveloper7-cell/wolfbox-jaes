import iconPrint from "../assets/printer-free-6-svgrepo-com.svg";
import iconEdit from "../assets/pencil-edit-button-svgrepo-com.svg";
import logoEmpresa from "../assets/LogoJaesDashboard.png";
import iconCancel from "../assets/cancel-svgrepo-com (1).svg";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";
import { useState } from "react";
import Swal from 'sweetalert2';

interface Paquete {
  tracking: string;
  hawb: string;
  numero_guia: string;
  fecha_registro: string;
  estado: string;
  oficina: string;
  cliente: string;
  codigo_referencia: string;
  tienda: string;
  contenido: string;
  peso: string;
  notas: string;
  usuario: string;
}

interface TablaPaquetesDigitadosProps {
  paquetes: Paquete[];
  onEditar: (paquete: Paquete) => void;
}

const handleImprimirEtiqueta = (paquete: Paquete) => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, paquete.hawb, {
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
  centerText(doc, paquete.hawb, 200);  

  doc.setFontSize(12);
  centerText(doc, `Date: ${paquete.fecha_registro}`, 230);
  centerText(doc,`Lb: ${paquete.peso}`,250);
  centerText(doc,`Contenido: ${paquete.contenido}`, 270);
  
  centerText(doc,"Bogotá D.C. - Colombia", 300);
  centerText(doc,`${paquete.cliente}`, 320);
  centerText(doc,`Casillero: ${paquete.codigo_referencia}`, 350);

  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
};

export default function TablaPaquetesDigitados({ paquetes,onEditar }: TablaPaquetesDigitadosProps) {

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const handleAnularGuia = async (paquete: Paquete) => {
    const confirmacion = await Swal.fire({
      title: '¿Anular guía?',
      text: `¿Estás seguro de que deseas anular la guía ${paquete.hawb}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#991b1b',
      cancelButtonColor: '#6b7280',
    });
  
    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3000/api/paquetes/anular/${paquete.hawb}`, {
          method: 'PUT',
        });
  
        const data = await response.json();
  
        if (response.ok) {

          const resultado = await Swal.fire({
            icon: 'success',
            title: 'Guía anulada',
            text: data.mensaje || 'La guía fue anulada correctamente.',
            confirmButtonColor: '#991b1b'
          });

          if (resultado.isConfirmed) {
            window.location.reload(); 
          }

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.mensaje || 'No se pudo anular la guía.',
          });
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error inesperado',
          text: 'Ocurrió un error al intentar anular la guía.',
        });
      }
    }
  };
  

  const totalPaginas = Math.ceil(paquetes.length / registrosPorPagina);

  const paquetesAMostrar = paquetes.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const generarNumerosPaginacion = () => {
    const paginas: (number | string)[] = [];

    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      if (paginaActual <= 3) {
        paginas.push(1, 2, 3, 4, "...", totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        paginas.push(1, "...", totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
      } else {
        paginas.push(1, "...", paginaActual - 1, paginaActual, paginaActual + 1, "...", totalPaginas);
      }
    }

    return paginas;
  };
      
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">PAQUETES DIGITADOS</h2>
      <div className="flex justify-end mb-2">
        <label className="mr-2 text-sm font-medium text-gray-700">Registros:</label>
        <select
          className="border rounded px-2 py-1"
          value={registrosPorPagina}
          onChange={(e) => {
            setRegistrosPorPagina(Number(e.target.value));
            setPaginaActual(1); 
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border text-sm">
        <thead className="bg-gray-100 text-gray-700">
            <tr>
                <th className="px-3 py-2">Opciones</th>
                <th className="px-3 py-2">Tracking</th>
                <th className="px-3 py-2">HAWB</th>
                <th className="px-3 py-2">Referencia</th>
                <th className="px-3 py-2">Fecha hora</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Ubicación</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Código casillero</th>
                <th className="px-3 py-2">Tienda</th>        
                <th className="px-3 py-2">Contenido</th>
                <th className="px-3 py-2">Peso (lbs)</th>
                <th className="px-3 py-2">Notas</th>
                <th className="px-3 py-2">Usuario</th>

            </tr>
        </thead>
          <tbody>
            {paquetesAMostrar.map((paquete, index) => (
            <tr key={index} className="border-t text-center">
            <td className="px-3 py-1">
            <div className="flex justify-center items-center gap-2">
              <button 
                className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-200"
                onClick={() => handleImprimirEtiqueta(paquete)}
                title="Imprimir etiqueta"
              >
                <img src={iconPrint} alt="Imprimir" className="w-4 h-4" />
              </button>

              <button 
                className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-200"
                onClick={() => onEditar(paquete)}
                title="Editar guía"
              >
                <img src={iconEdit} alt="Editar" className="w-4 h-4" />
              </button>

              <button 
                className="w-7 h-7 border rounded flex items-center justify-center hover:bg-gray-200"
                title="Anular guía"
                onClick={() => handleAnularGuia(paquete)}
              >
                <img src={iconCancel} alt="Anular" className="w-4 h-4" />
              </button>
            </div>
            </td>
            <td className="px-3 py-1">{paquete.tracking}</td>
            <td className="px-3 py-1">{paquete.hawb}</td>
            <td className="px-3 py-1">{paquete.numero_guia}</td>
            <td className="px-3 py-1">{paquete.fecha_registro}</td>
            <td className="px-3 py-1">{paquete.estado}</td>
            <td className="px-3 py-1">{paquete.oficina}</td>
            <td className="px-3 py-1">{paquete.cliente}</td>
            <td className="px-3 py-1">{paquete.codigo_referencia}</td>
            <td className="px-3 py-1">{paquete.tienda}</td>        
            <td className="px-3 py-1">{paquete.contenido}</td>
            <td className="px-3 py-1">{paquete.peso}</td> 
            <td className="px-3 py-1">{paquete.notas}</td>
            <td className="px-3 py-1">{paquete.usuario}</td>   
            </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-4 gap-2">
        <button
          className={`px-2 py-1 border rounded ${
            paginaActual === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'hover:bg-gray-200'
          }`}
          onClick={() => cambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>

        {generarNumerosPaginacion().map((numero, index) => (
          <button
          key={index}
          className={`px-3 py-1 border rounded cursor-pointer ${
            paginaActual === numero ? 'bg-red-900 text-white' : 'hover:bg-gray-200'
          }`}
          onClick={() => typeof numero === "number" && cambiarPagina(numero)}
          disabled={numero === "..."}
        >
          {numero}
        </button>
        ))}

        <button
        className={`px-2 py-1 border rounded ${
          paginaActual === totalPaginas ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'hover:bg-gray-200'
        }`}
        onClick={() => cambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        >
          Siguiente
        </button>
      </div>

    </div>
  );
}
