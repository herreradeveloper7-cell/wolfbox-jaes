import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface Props {
  tipoCliente: string;
}

export default function PersonalForm({ tipoCliente }: Props) {
  
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
  
    const [tipoIdentificacion, setTipoIdentificacion] = useState("");
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

        const data = {
          tipoIdentificacion,
          numeroIdentificacion,
          primerNombre,
          segundoNombre,
          primerApellido,
          segundoApellido,
          email,
          contrasena,
          fechaNacimiento,
          pais: selectedCountry,
          region: selectedRegion,
          ciudad,
          direccion,
          indicativo,
          celular,
          telefonoFijo,
          genero,
          tipo_cliente: tipoCliente,
        };
      
        try {
          // Verificar si el email ya existe
          const validarDuplicado = await fetch(`http://localhost:3000/api/clientes/validar`, {
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
          
          const res = await fetch("http://localhost:3000/api/clientes", {
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


    type CityMap = {
        [region: string]: string[];
        };
    
    const colombia: CityMap = {
        "Amazonas": ["Leticia", "Puerto Nariño", "La Chorrera", "El Encanto", "Tarapacá"],
        "Antioquia": ["Medellín", "Bello", "Itagüí", "Envigado", "Apartadó"],
        "Arauca": ["Arauca", "Saravena", "Tame", "Arauquita", "Fortul"],
        "Atlántico": ["Barranquilla", "Soledad", "Malambo", "Sabanalarga", "Galapa"],
        "Bolívar": ["Cartagena", "Magangué", "Turbaco", "Arjona", "El Carmen de Bolívar"],
        "Boyacá": ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá", "Paipa"],
        "Caldas": ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
        "Caquetá": ["Florencia", "San Vicente del Caguán", "Puerto Rico", "Cartagena del Chairá", "El Doncello"],
        "Casanare": ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Monterrey"],
        "Cauca": ["Popayán", "Santander de Quilichao", "Puerto Tejada", "Patía", "El Tambo"],
        "Cesar": ["Valledupar", "Aguachica", "Codazzi", "La Jagua de Ibirico", "Bosconia"],
        "Chocó": ["Quibdó", "Istmina", "Condoto", "Tadó", "Riosucio"],
        "Córdoba": ["Montería", "Cereté", "Sahagún", "Lorica", "Montelíbano"],
        "Cundinamarca": ["Bogotá", "Soacha", "Fusagasugá", "Girardot", "Chía"],
        "Guainía": ["Inírida"],
        "Guaviare": ["San José del Guaviare", "Calamar", "El Retorno", "Miraflores"],
        "Huila": ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre"],
        "La Guajira": ["Riohacha", "Maicao", "Uribia", "San Juan del Cesar", "Fonseca"],
        "Magdalena": ["Santa Marta", "Ciénaga", "Fundación", "El Banco", "Plato"],
        "Meta": ["Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín"],
        "Nariño": ["Pasto", "Tumaco", "Ipiales", "Túquerres", "Sandoná"],
        "Norte de Santander": ["Cúcuta", "Ocaña", "Pamplona", "Villa del Rosario", "Los Patios"],
        "Putumayo": ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez", "San Miguel"],
        "Quindío": ["Armenia", "Calarcá", "Montenegro", "Quimbaya", "La Tebaida"],
        "Risaralda": ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia", "Belén de Umbría"],
        "San Andrés y Providencia": ["San Andrés", "Providencia"],
        "Santander": ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
        "Sucre": ["Sincelejo", "Corozal", "Sampués", "San Marcos", "Tolú"],
        "Tolima": ["Ibagué", "Espinal", "Melgar", "Honda", "Líbano"],
        "Valle del Cauca": ["Cali", "Buenaventura", "Palmira", "Tuluá", "Cartago"],
        "Vaupés": ["Mitú"],
        "Vichada": ["Puerto Carreño"]
        };
    
    const estadosUnidos: CityMap = {
        "Alabama": ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
        "Alaska": ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"],
        "Arizona": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale"],
        "Arkansas": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
        "California": ["Los Ángeles", "San Diego", "San José", "San Francisco", "Fresno"],
        "Colorado": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood"],
        "Connecticut": ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury"],
        "Delaware": ["Wilmington", "Dover", "Newark", "Middletown", "Smyrna"],
        "Florida": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg"],
        "Georgia": ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens"],
        "Hawái": ["Honolulu", "Hilo", "Kailua", "Kapolei", "Kaneohe"],
        "Idaho": ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello"],
        "Illinois": ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford"],
        "Indiana": ["Indianápolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"],
        "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"],
        "Kansas": ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"],
        "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"],
        "Luisiana": ["Nueva Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"],
        "Maine": ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"],
        "Maryland": ["Baltimore", "Frederick", "Rockville", "Gaithersburg", "Bowie"],
        "Massachusetts": ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
        "Michigan": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor"],
        "Minnesota": ["Minneapolis", "Saint Paul", "Rochester", "Duluth", "Bloomington"],
        "Mississippi": ["Jackson", "Gulfport", "Southaven", "Hattiesburg", "Biloxi"],
        "Missouri": ["Kansas City", "Saint Louis", "Springfield", "Independence", "Columbia"],
        "Montana": ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte"],
        "Nebraska": ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"],
        "Nevada": ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Sparks"],
        "New Hampshire": ["Manchester", "Nashua", "Concord", "Derry", "Rochester"],
        "New Jersey": ["Nueva Jersey", "Jersey City", "Paterson", "Elizabeth", "Edison"],
        "New Mexico": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"],
        "New York": ["Nueva York", "Buffalo", "Rochester", "Yonkers", "Syracuse"],
        "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
        "North Dakota": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo"],
        "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron"],
        "Oklahoma": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond"],
        "Oregon": ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro"],
        "Pennsylvania": ["Filadelfia", "Pittsburgh", "Allentown", "Erie", "Reading"],
        "Rhode Island": ["Providence", "Cranston", "Warwick", "Pawtucket", "East Providence"],
        "South Carolina": ["Columbia", "Charleston", "North Charleston", "Mount Pleasant", "Rock Hill"],
        "South Dakota": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Mitchell"],
        "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
        "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth"],
        "Utah": ["Salt Lake City", "West Valley City", "Provo", "Sandy", "Orem"],
        "Vermont": ["Burlington", "Essex", "South Burlington", "Rutland", "Barre"],
        "Virginia": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News"],
        "Washington": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"],
        "West Virginia": ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Weirton"],
        "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"],
        "Wyoming": ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"]
    };

    const regionOptions =
    selectedCountry === "Colombia"
      ? Object.keys(colombia)
      : selectedCountry === "Estados Unidos"
      ? Object.keys(estadosUnidos)
      : [];

  const cityOptions =
    selectedCountry === "Colombia"
      ? colombia[selectedRegion] || []
      : selectedCountry === "Estados Unidos"
      ? estadosUnidos[selectedRegion] || []
      : [];

    return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div>
        <label className="block font-medium mb-1">Tipo de identificación *</label>
        <select required className="w-full p-2 border rounded"
            value={tipoIdentificacion}
            onChange={(e) => setTipoIdentificacion(e.target.value)}
            >
            <option value="">Seleccione un tipo</option>
            <option value="cc">Cédula de ciudadanía</option>
            <option value="ce">Cédula de extranjería</option>
            <option value="ti">Tarjeta de identidad</option>
            <option value="pasaporte">Pasaporte</option>
        </select>
        </div>
  
        <div>
            <label className="block font-medium mb-1">Número de identificación *</label>
            <input 
            type="text" 
            value={numeroIdentificacion}
            onChange={(e) => setNumeroIdentificacion(e.target.value)}
            className="w-full p-2 border rounded" 
            required />
          {errores.identificacionExistente && (
            <p className="text-red-600 text-sm mt-1">Ya existe un cliente con este número de identificación.</p>
          )}
        </div>
  
        <div>
          <label className="block font-medium mb-1">Primer nombre *</label>
          <input
            type="text" 
            value={primerNombre}
            onChange={(e) => setPrimerNombre(e.target.value)}
            className="w-full p-2 border rounded" 
            required />
        </div>
  
        <div>
          <label className="block font-medium mb-1">Segundo nombre</label>
          <input
            type="text"
            value={segundoNombre}
            onChange={(e) => setSegundoNombre(e.target.value)}
            className="w-full p-2 border rounded"/>
        </div>
  
        <div>
          <label className="block font-medium mb-1">Primer apellido *</label>
          <input
            type="text"
            value={primerApellido}
            onChange={(e) => setPrimerApellido(e.target.value)} 
            className="w-full p-2 border rounded" 
            required />
        </div>
  
        <div>
          <label className="block font-medium mb-1">Segundo apellido</label>
          <input 
            type="text" 
            value={segundoApellido}
            onChange={(e) => setSegundoApellido(e.target.value)}
            className="w-full p-2 border rounded" />
        </div>
  
        <div>
          <label className="block font-medium mb-1">Email *</label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-2 border rounded" 
            required />
          {errores.emailExistente && (
            <p className="text-red-600 text-sm mt-1">Ya existe un cliente con este correo electrónico.</p>
          )}
        </div>
  
        <div>
          <label className="block font-medium mb-1">Confirmar email *</label>
          <input 
            type="email" 
            value={confirmarEmail}
            onChange={(e) => setConfirmarEmail(e.target.value)}
            className="w-full p-2 border rounded" 
            required />
          {!errores.emailCoincide && (
            <p className="text-sm text-red-600 mt-1">Los correos no coinciden</p>
          )}
        </div>
  
        <div>
          <label className="block font-medium mb-1">Contraseña *</label>
          <input 
            type="password" 
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full p-2 border rounded" 
            required />
        </div>
  
        <div>
          <label className="block font-medium mb-1">Confirmación de contraseña *</label>
          <input 
            type="password"
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.target.value)} 
            className="w-full p-2 border rounded" 
            required />
          {!errores.contrasenaCoincide && (
            <p className="text-sm text-red-600 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>

        <div>
            <label className="block font-medium mb-1">Fecha de nacimiento *</label>
            <input
            type="date"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            required
            className="w-full p-2 border rounded"
            />
        </div>
  
        <div>
        <label className="block font-medium mb-1">País *</label>
        <select 
            required 
            className="w-full p-2 border rounded"
            value={selectedCountry}
            onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedRegion("");
            }}
            >
            <option value="">Seleccionar país</option>
            <option value="Colombia">Colombia</option>
            <option value="Estados Unidos">Estados Unidos</option>
        </select>
        </div>
  
        <div>
        <label className="block font-medium mb-1">Departamento / Estado *</label>
        <select 
            required 
            className="w-full p-2 border rounded"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            disabled={!selectedCountry}
        >
            <option value="">Seleccionar departamento/estado</option>
            {regionOptions.map((region) => (
                <option key={region} value={region}>{region}</option>
            ))}
        </select>
        </div>
  
        <div>
        <label className="block font-medium mb-1">Ciudad *</label>
        <select
            required
            className="w-full p-2 border rounded"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            disabled={!selectedRegion}
        >
          <option value="">Seleccionar ciudad</option>
          {cityOptions.map((city: string) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        </div>
  
        <div className="md:col-span-2">
            <label className="block font-medium mb-1">Dirección *</label>
            <input 
            type="text" 
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full p-2 border rounded" 
            required />
        </div>

        <div className="col-span-2 flex gap-4">
            <div className="w-1/4">
            <label className="block font-medium mb-1">Indicativo</label>
            <select
            value={indicativo}
            onChange={(e) => setIndicativo(e.target.value)}
            className="w-full p-2 border rounded">
                <option value="">Indicativo</option>
                <option value="+57">+57 (Colombia)</option>
                <option value="+1">+1 (EE.UU.)</option>
            </select>
            </div>
            <div className="flex-1">
            <label className="block font-medium mb-1">Teléfono celular *</label>
            <input
                type="tel"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                placeholder="Número de celular"
                required
                className="w-full p-2 border rounded"
            />
            </div>
        </div>
  
        <div className="md:col-span-2">
            <label className="block font-medium mb-1">Teléfono fijo*</label>
            <input
            type="text"
            value={telefonoFijo}
            onChange={(e) => setTelefonoFijo(e.target.value)}
            placeholder="Número de teléfono fijo"
            className="w-full p-2 border rounded"
            required />
        </div>

        <div>
            <label className="block font-medium mb-1">Género</label>
            <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            className="w-full p-2 border rounded">
            <option value="">Seleccionar género</option>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="otro">Otro</option>
            </select>
        </div>
  
        <div className="md:col-span-2 flex items-start gap-2 mt-2">
          <input 
          type="checkbox" 
          id="terms" 
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          required 
          className="mt-1 w-5 h-5" />
          <label htmlFor="terms" className="text-sm text-gray-700">
            Acepto los <a href="#" className="text-blue-600 underline">términos y condiciones</a>.
          </label>
        </div>
  
        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-6 py-2 rounded border border-gray-400 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
            !termsAccepted ||
            !errores.emailCoincide ||
            !errores.contrasenaCoincide
            }
            className={`px-6 py-2 rounded text-white transition
            ${!termsAccepted || !errores.emailCoincide || !errores.contrasenaCoincide
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-900 hover:bg-red-950 cursor-pointer'}
            `}
          >
          Enviar
          </button>
        </div>
    </form>
    );
  }  