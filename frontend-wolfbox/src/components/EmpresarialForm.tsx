import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from "react";
interface Props {
  tipoCliente: string;
}

const getFechaMaximaMayorEdad = () => {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() - 18);
  return fecha.toISOString().slice(0, 10);
};

const esMayorDeEdad = (fechaNacimiento: string) => {
  if (!fechaNacimiento) return false;
  return fechaNacimiento <= getFechaMaximaMayorEdad();
};

export default function EmpresarialForm({ tipoCliente }: Props) {
  
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
    const [tipoIdentificacion, setTipoIdentificacion] = useState("");
    const [razonSocial, setRazonSocial] = useState("");
    const [numeroIdentificacion, setNumeroIdentificacion] = useState("");
    const [primerNombre, setPrimerNombre] = useState("");
    const [segundoNombre, setSegundoNombre] = useState("");
    const [primerApellido, setPrimerApellido] = useState("");
    const [segundoApellido, setSegundoApellido] = useState("");
    const [email, setEmail] = useState("");
    const [confirmarEmail, setConfirmarEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
    const [fechaNacimiento, setFechaNacimiento] = useState("");
    const [ciudad, setCiudad] = useState("");
    const [direccion, setDireccion] = useState("");
    const [indicativo, setIndicativo] = useState("");
    const [celular, setCelular] = useState("");
    const [telefonoFijo, setTelefonoFijo] = useState("");
    const [genero, setGenero] = useState("");



    const [errores,setErrores] = useState({
      emailCoincide: true,
      contrasenaCoincide: true,
      termsAccepted: false,
      emailExistente: false,
      identificacionExistente: false,
      fechaNacimientoValida: true,
    });

    const [termsAccepted, setTermsAccepted] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
      setErrores(prev => ({
        ...prev,
        emailCoincide: email === confirmarEmail,
        contrasenaCoincide: contrasena === confirmarContrasena
      }));
    }, [email, confirmarEmail, contrasena, confirmarContrasena]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!esMayorDeEdad(fechaNacimiento)) {
        setErrores(prev => ({
          ...prev,
          fechaNacimientoValida: false,
        }));
        return;
      }

      const data = {
        razonSocial,
        tipoIdentificacion,
        numeroIdentificacion,
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        email,
        contrasena,
        fechaNacimiento,
        pais: paises.find((p) => String(p.id) === selectedCountry)?.nombre || "",
        region: regiones.find((r) => String(r.id) === selectedRegion)?.nombre || "",
        ciudad: ciudades.find((c) => String(c.id) === ciudad)?.nombre || "",
        direccion,
        indicativo,
        celular,
        telefonoFijo,
        genero,
        tipo_cliente: tipoCliente,
      };
    
      try {
        const validarDuplicado = await fetch(`/api/clientes/validar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, numeroIdentificacion }),
        });
        
        const validacion = await validarDuplicado.json();
        
        if (!validacion.ok) {
          setErrores(prev => ({
            ...prev,
            emailExistente: validacion.emailExistente,
            identificacionExistente: validacion.identificacionExistente
          }));
          return;
        }

        const res = await fetch("/api/clientes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
    
        const result = await res.json();
    
        if (res.ok) {
        navigate("/confirmacion", {
          state: { codigoReferencia: result.codigoReferencia }
        });
        } else {
          alert("❌ Error: " + result.message);
        }
      } catch (err) {
        console.error("Error en el registro:", err);
        alert("Error al conectar con el servidor");
      }
  }

  interface Pais {
    id: number;
    nombre: string;
    codigo_iso: string;
    activo: boolean;
  }

  interface Region {
    id: number;
    pais_id: number;
    nombre: string;
    activo: boolean;
    tipo_region: string;
  }

  interface Ciudad {
    id: number;
    region_id: number;
    nombre: string;
    activo: boolean;
  }

  const [paises, setPaises] = useState<Pais[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);

  useEffect(() => {
    const cargarPaises = async () => {
      try {
        const res = await fetch("/api/catalogos/paises");
        const data = await res.json();
        setPaises(data);
      } catch (error) {
        console.error("Error cargando países:", error);
      }
    };

    cargarPaises();
  }, []);

  useEffect(() => {
    const cargarRegiones = async () => {
      if (!selectedCountry) {
        setRegiones([]);
        setSelectedRegion("");
        setCiudades([]);
        setCiudad("");
        return;
      }

      try {
        const res = await fetch(
          `/api/catalogos/regiones/${selectedCountry}`
        );
        const data = await res.json();

        setRegiones(data);
        setSelectedRegion("");
        setCiudades([]);
        setCiudad("");
      } catch (error) {
        console.error("Error cargando regiones:", error);
      }
    };

    cargarRegiones();
  }, [selectedCountry]);

  useEffect(() => {
    const cargarCiudades = async () => {
      if (!selectedRegion) {
        setCiudades([]);
        setCiudad("");
        return;
      }

      try {
        const res = await fetch(
          `/api/catalogos/ciudades/${selectedRegion}`
        );
        const data = await res.json();

        setCiudades(data);
        setCiudad("");
      } catch (error) {
        console.error("Error cargando ciudades:", error);
      }
    };

    cargarCiudades();
  }, [selectedRegion]);
    
    

  const inputBase = "w-full rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-gray-300 focus:border-red-900 focus:bg-white focus:ring-4 focus:ring-red-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
  const labelBase = "mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500";
  const errorBase = "mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700";
    
    return(
    <form onSubmit={handleSubmit} className="relative mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-900 via-gray-300 to-red-900" />

      <div className="mb-6 border-b border-gray-100 pb-5">
        <span className="inline-flex rounded-full border border-red-900/10 bg-red-900/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-red-900">
          Cuenta empresarial
        </span>
        <h3 className="mt-3 text-xl font-black text-slate-800">Datos de registro</h3>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Completa la informacion legal, representante, contacto y credenciales de acceso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-red-900" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Empresa</p>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
        </div>
      <div>
        <label className={labelBase}>Tipo de identificación *</label>
        <select
          required
          className={inputBase}
          value={tipoIdentificacion}
          onChange={(e) => setTipoIdentificacion(e.target.value)}
        >
          <option value="">Seleccionar</option>
          <option value="NIT">NIT</option>
          <option value="RUT">RUT</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      <div>
        <label className={labelBase}>NIT o Número de identificación *</label>
        <input 
        type="text" 
        value={numeroIdentificacion}
        onChange={(e) => setNumeroIdentificacion(e.target.value)}
        className={inputBase} 
        required />
        {errores.identificacionExistente && (
          <p className={errorBase}>Ya existe un cliente con este número de identificación.</p>
        )}
      </div>
  
      <div>
        <label className={labelBase}>Razón social *</label>
        <input 
        type="text"
        value={razonSocial}
        onChange={(e) => setRazonSocial(e.target.value)}
        className={inputBase} 
        required />
      </div>
  
      <div className="md:col-span-2 pt-2">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-red-900" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Representante</p>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      </div>

      <div>
        <label className={labelBase}>Primer nombre *</label>
        <input 
        type="text" 
        value={primerNombre}
        onChange={(e) => setPrimerNombre(e.target.value)}
        className={inputBase} 
        required />
      </div>
  
      <div>
        <label className={labelBase}>Segundo nombre</label>
        <input 
        type="text"
        value={segundoNombre}
        onChange={(e) => setSegundoNombre(e.target.value)} 
        className={inputBase} />
      </div>

      <div>
        <label className={labelBase}>Primer apellido *</label>
        <input 
        type="text"
        value={primerApellido}
        onChange={(e) => setPrimerApellido(e.target.value)} 
        className={inputBase} 
        required />
      </div>
  
      <div>
        <label className={labelBase}>Segundo apellido</label>
        <input 
        type="text"
        value={segundoApellido}
        onChange={(e) => setSegundoApellido(e.target.value)} 
        className={inputBase} />
      </div>

      <div className="md:col-span-2 pt-2">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-red-900" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Credenciales</p>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      </div>

      <div>
        <label className={labelBase}>Email *</label>
        <input 
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)} 
        className={inputBase} 
        required />
        {errores.emailExistente && (
          <p className={errorBase}>Ya existe un cliente con este correo electrónico.</p>
        )}
      </div>
  
      <div>
        <label className={labelBase}>Confirmar email *</label>
        <input 
        type="email"
        value={confirmarEmail}
        onChange={(e) => setConfirmarEmail(e.target.value)} 
        className={`${inputBase} ${
          !errores.emailCoincide ? 'border-red-500 focus:border-red-600 focus:ring-red-600/10' : ''
        }`} 
        required 
        />
        {!errores.emailCoincide && (
          <p className={errorBase}>Los correos no coinciden</p>
        )}
      </div>

      <div>
        <label className={labelBase}>Contraseña *</label>
        <input 
        type="password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        className={inputBase} 
        required />
      </div>
  
      <div>
        <label className={labelBase}>Confirmación de Contraseña *</label>
        <input 
          type="password"
          value={confirmarContrasena}
          onChange={(e) => setConfirmarContrasena(e.target.value)}
          className={`${inputBase} ${!errores.contrasenaCoincide ? 'border-red-500 focus:border-red-600 focus:ring-red-600/10' : ''}`}
          required
        />
        {!errores.contrasenaCoincide && (
          <p className={errorBase}>Las contraseñas no coinciden</p>
        )}
      </div>

      <div className="md:col-span-2 pt-2">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-red-900" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Ubicacion y contacto</p>
          <span className="h-px flex-1 bg-gray-200" />
        </div>
      </div>

      <div>
        <label className={labelBase}>Fecha de nacimiento *</label>
        <input
        type="date"
        value={fechaNacimiento}
        max={getFechaMaximaMayorEdad()}
        onChange={(e) => {
          setFechaNacimiento(e.target.value);
          setErrores(prev => ({
            ...prev,
            fechaNacimientoValida: esMayorDeEdad(e.target.value),
          }));
        }}
        required
        className={inputBase}
        />
        {!errores.fechaNacimientoValida && (
          <p className={errorBase}>Debes ser mayor de 18 años para registrarte.</p>
        )}
      </div>

      <div>
      <label className={labelBase}>País *</label>
      <select
        value={selectedCountry}
        onChange={(e) => setSelectedCountry(e.target.value)}
        className={inputBase}
        required
      >
        <option value="">Seleccione país</option>
        {paises.map((pais) => (
          <option key={pais.id} value={pais.id}>
            {pais.nombre}
          </option>
        ))}
      </select>
      </div>
  
      <div>
        <label className={labelBase}>Departamento / Estado *</label>
          <select 
            required 
            className={inputBase}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            disabled={!selectedCountry}
          >
          <option value="">Seleccionar departamento/estado</option>
            {regiones.map((region) => (
              <option key={region.id} value={region.id}>
                {region.nombre}
              </option>
            ))}
          </select>
      </div>
  
      <div>
        <label className={labelBase}>Ciudad *</label>
          <select
              required
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              className={inputBase}
              disabled={!selectedRegion}
          >
            <option value="">Seleccionar ciudad</option>
            {ciudades.map((ciudad) => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.nombre}
              </option>
            ))}
          </select>
      </div>
  
      <div className="md:col-span-2">
        <label className={labelBase}>Dirección *</label>
        <input 
        type="text" 
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        className={inputBase} 
        required 
        />
      </div>

      <div className="md:col-span-2 grid grid-cols-1 gap-5 sm:grid-cols-[150px_1fr]">
          <div>
          <label className={labelBase}>Indicativo</label>
          <select 
            required
            value={indicativo}
            onChange={(e) => setIndicativo(e.target.value)}
            className={inputBase}>
            <option value="">Indicativo</option>
            <option value="+57">+57 (Colombia)</option>
            <option value="+1">+1 (EE.UU.)</option>
          </select>
          </div>

          <div className="flex-1">
          <label className={labelBase}>Teléfono celular *</label>
          <input
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              required
              className={inputBase}
          />
          </div>
      </div>
  
      <div className="md:col-span-2">
        <label className={labelBase}>Teléfono fijo*</label>
        <input 
        type="text"
        value={telefonoFijo}
        onChange={(e) => setTelefonoFijo(e.target.value)}
        className={inputBase} 
        required />
      </div>

      <div>
          <label className={labelBase}>Género</label>
          <select
            required
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className={inputBase}>
          <option value="">Seleccionar género</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
          </select>
      </div>
  
      <div className="md:col-span-2 flex items-start gap-3 rounded-2xl border border-gray-200 bg-slate-50/80 p-4">
        <input
          type="checkbox"
          id="terms"
          checked={termsAccepted}
          onChange={(e) => {
            setTermsAccepted(e.target.checked);
            setErrores((prev) => ({ ...prev, termsAccepted: e.target.checked }));
          }}
          className="mt-0.5 h-5 w-5 shrink-0 accent-green-700"
        />
        <label htmlFor="terms" className="text-sm font-semibold leading-6 text-slate-600">
          Acepto los <a href="#" className="text-blue-600 underline">términos y condiciones</a>.
        </label>
      </div>
  
      <div className="md:col-span-2 flex flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={
            !termsAccepted || !errores.emailCoincide || !errores.contrasenaCoincide || !errores.fechaNacimientoValida
          }
          className={`rounded-2xl px-7 py-3 text-sm font-black text-white shadow-lg transition-all ${
            !termsAccepted || !errores.emailCoincide || !errores.contrasenaCoincide || !errores.fechaNacimientoValida
              ? 'bg-gray-400 cursor-default shadow-none'
              : 'bg-gradient-to-r from-red-950 to-red-900 shadow-red-950/20 hover:-translate-y-0.5 hover:from-red-900 hover:to-red-800 hover:shadow-xl cursor-pointer'
          }`}
        >
          Enviar
        </button>
      </div>
      </div>
    </form>
  );
}
