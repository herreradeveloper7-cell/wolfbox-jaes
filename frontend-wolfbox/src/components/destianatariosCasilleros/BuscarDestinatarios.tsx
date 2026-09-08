import BuscarClientes from "../clientes/BuscarClientes";

interface Cliente {
  id: number;
  nombre: string;
  codigo_referencia: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (cliente: Cliente) => void;
}

export default function BuscarDestinatarios({ value, onChange, onSelect }: Props) {
  return (
    <BuscarClientes
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      placeholder="Nombre o código de cliente"
    />
  );
}
