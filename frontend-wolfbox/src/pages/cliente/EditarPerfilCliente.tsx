import { useState, useEffect } from "react";
import ClientDashboardLayout from "../../layouts/ClientDashboardLayout";

export default function EditarPerfilCliente() {
  const [cliente, setCliente] = useState({
    id: 0,
    nombre: "",
    email: "",
    genero: "",
    direccion: "",
    ciudad: "",
    region: "",
    celular: "",
    codigoReferencia: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem("cliente");
    if (stored) {
      setCliente(JSON.parse(stored));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const res = await fetch("/api/clientes/actualizar-perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente)
      });
  
      const data = await res.json();
      if (data.ok) {
        alert("✅ Perfil actualizado con éxito");
        localStorage.setItem("cliente", JSON.stringify(cliente));
      } else {
        alert("❌ No se pudo actualizar el perfil");
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Error del servidor");
    }
  };
  

  return (
    <ClientDashboardLayout scrollable>
      <h2 className="text-2xl font-bold mb-6">Editar perfil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Nombre completo</label>
          <input
            name="nombre"
            value={cliente.nombre}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            name="email"
            value={cliente.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium">Género</label>
          <select
            name="genero"
            value={cliente.genero}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Seleccionar</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Dirección</label>
          <input
            name="direccion"
            value={cliente.direccion}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Ciudad</label>
          <input
            name="ciudad"
            value={cliente.ciudad}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Departamento / Región</label>
          <input
            name="region"
            value={cliente.region}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Celular</label>
          <input
            name="celular"
            value={cliente.celular}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-red-900 text-white px-6 py-3 cursor-pointer rounded hover:bg-red-950 transition"
          >
            Guardar cambios
          </button>
        </div>
      </form>
      </ClientDashboardLayout>
  );
}
