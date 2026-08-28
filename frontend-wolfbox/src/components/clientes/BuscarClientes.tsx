import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

interface Cliente {
  id: number;
  nombre: string;
  codigo_referencia: string;
  tipo_cliente?: string;
  email?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (cliente: Cliente) => void;
  placeholder?: string;
  minCaracteres?: number;
}

export default function BuscarClientes({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar por nombre o código de casillero...",
  minCaracteres = 3,
}: Props) {
  const [sugerencias, setSugerencias] = useState<Cliente[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<any>(null);
  const requestRef = useRef(0);

  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const actualizarPosicion = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();

    setDropdownStyle({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!mostrarDropdown && !loading) return;

    actualizarPosicion();

    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);

    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [mostrarDropdown, loading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestRef.current += 1;
  }, []);

  const buscarClientes = (texto: string) => {
    onChange(texto);
    setSinResultados(false);
    setErrorBusqueda(false);

    if (timerRef.current) clearTimeout(timerRef.current);
    const requestActual = ++requestRef.current;

    if (texto.trim().length < minCaracteres) {
      setSugerencias([]);
      setMostrarDropdown(false);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        setLoading(true);

        const { data } = await axios.get(
          `/api/clientes/buscar/${encodeURIComponent(texto)}`
        );

        const clientes = Array.isArray(data) ? data : data.clientes || [];

        if (requestActual !== requestRef.current) return;

        setSugerencias(clientes);
        setMostrarDropdown(clientes.length > 0);
        setSinResultados(clientes.length === 0);
      } catch (error) {
        if (requestActual !== requestRef.current) return;
        console.error("❌ Error buscando clientes:", error);
        setSugerencias([]);
        setMostrarDropdown(false);
        setErrorBusqueda(true);
      } finally {
        if (requestActual === requestRef.current) setLoading(false);
      }
    }, 300);
  };

  const seleccionarCliente = (cliente: Cliente) => {
    onChange(cliente.codigo_referencia);
    onSelect(cliente);
    setSugerencias([]);
    setMostrarDropdown(false);
    setSinResultados(false);
    setErrorBusqueda(false);
    requestRef.current += 1;
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => buscarClientes(e.target.value)}
        onFocus={() => {
          if (sugerencias.length > 0) setMostrarDropdown(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 focus:border-[#5a0c0c] focus:ring-4 focus:ring-[#5a0c0c]/10"
      />

      {sinResultados && !loading && (
        <p className="mt-2 px-1 text-sm font-semibold text-red-600" role="status">
          ⚠️ Cliente no registrado.
        </p>
      )}

      {errorBusqueda && !loading && (
        <p className="mt-2 px-1 text-sm font-semibold text-amber-700" role="alert">
          No fue posible consultar los clientes. Intenta nuevamente.
        </p>
      )}

      {(loading || (mostrarDropdown && sugerencias.length > 0)) &&
      dropdownStyle.width > 0 &&
      createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: dropdownStyle.top,
            left: dropdownStyle.left,
            width: dropdownStyle.width,
            zIndex: 9000,
          }}
        >
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-fade-in">
            {loading && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#5a0c0c]"></span>
                Buscando clientes...
              </div>
            )}

            {!loading && mostrarDropdown && sugerencias.length > 0 && (
              <div className="max-h-72 overflow-y-auto">
                {sugerencias.map((cli) => (
                  <div
                    key={cli.id}
                    onClick={() => seleccionarCliente(cli)}
                    className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-gray-700 transition hover:bg-red-50"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{cli.nombre}</p>

                      <p className="text-xs font-semibold text-gray-400">
                        {cli.tipo_cliente || "Cliente registrado"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-xs font-semibold text-gray-600">
                      {cli.codigo_referencia}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
