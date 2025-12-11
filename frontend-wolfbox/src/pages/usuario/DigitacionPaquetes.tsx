import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import BusquedaPaquetes from "../../components/BusquedaPaquetes";
import TablaPaquetesDigitados from "../../components/TablaPaquetesDigitados";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconTrash from "../../assets/trash-svgrepo-com.svg";
import iconSearch from "../../assets/search-alt-svgrepo-com.svg";
import iconSave from "../../assets/save-svgrepo-com.svg";
import iconCancel from "../../assets/cancel-svgrepo-com.svg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

export default function DigitacionPaquetes() {
    const navigate = useNavigate();
    const [fechaActual, setFechaActual] = useState("");
    const [horaActual, setHoraActual] = useState("");
    const [user, setUser] = useState<any>(null);
    const [clienteInput, setClienteInput] = useState("");
    const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);
    const [clienteNoExiste, setClienteNoExiste] = useState(false);
    const [filtrosBusqueda, setFiltrosBusqueda] = useState<{
      fechaInicial?: string;
      fechaFinal?: string;
      tracking?: string;
      contenido?: string;
      notas?: string;
      referencia?: string;
      cliente?: string;
      usuario?: string;
    }>({});  
      
    const [paquetes, setPaquetes] = useState<any[]>([]);
    const [servicios, setServicios] = useState<any[]>([]);

    useEffect(() => {
      const cargarServicios = async () => {
        try {
          const res = await fetch("http://localhost:3000/api/servicios");
          const data = await res.json();
          if (data.ok) {
            setServicios(data.servicios);
          }
        } catch (error) {
          console.error("❌ Error cargando servicios:", error);
        }
      };

      cargarServicios();
    }, []);

    
    const handleBuscarPaquetes = async () => {
      try {
        const params = new URLSearchParams();
          Object.entries(filtrosBusqueda).forEach(([key, value]) => {
            if (value) {
              params.append(key, value);
            }
          });
        
    
        const response = await fetch(`http://localhost:3000/api/paquetes/buscar?${params.toString()}`);
        const data = await response.json();
        setPaquetes(data);
      } catch (error) {
        console.error("❌ Error al buscar paquetes:", error);
      }
    };

    const handleCancelarBusqueda = () => {
      setFiltrosBusqueda({
        fechaInicial: "",
        fechaFinal: "",
        tracking: "",
        contenido: "",
        notas: "",
        referencia: "",
        cliente: "",
        usuario: ""
      });
      cargarPaquetes();
    };
    
    
    const [erroresCampos, setErroresCampos] = useState({
      cliente: false,
      tienda: false,
      tracking: false,
      contenido: false,
      lbs: false,
    });

    const [paqueteFila, setPaqueteFila] = useState<any>({
      id: "",
      tracking: "",
      tienda: "",
      referencia: "",
      lbs: "",
      largo: "0.00",
      ancho: "0.00",
      alto: "0.00",
      dec: "100.00",
      contenido: "",
      ubicacion: "",
      empaque: "SC",
      posicion: "98.07.20.00.00",
      notas: "",
      servicio_id: ""
    });

    const [filasAdicionales, setFilasAdicionales] = useState<any[]>([]);
    const [cantidadCajas, setCantidadCajas] = useState(1);

    const handleAgregarCajas = async () => {
      if (cantidadCajas <= 0) return;
    
      const confirmacion = await Swal.fire({
        title: `¿Agregar ${cantidadCajas} caja(s)?`,
        text: 'Se añadirán nuevas filas para digitación rápida.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, agregar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#991b1b',
      });
    
      if (confirmacion.isConfirmed) {
        const nuevasFilas = Array.from({ length: cantidadCajas }, () => ({
          tracking: "",
          referencia: "",
          tienda: paqueteFila.tienda,
          lbs: "",
          largo: "0.00",
          ancho: "0.00",
          alto: "0.00",
          dec: "100.00",
          contenido: "",
          ubicacion: paqueteFila.ubicacion,
          posicion: paqueteFila.posicion,
          notas: "",
          servicio_id: paqueteFila.servicio_id
        }));
        setFilasAdicionales((prev) => [...prev, ...nuevasFilas]);
      }
    };

    const handleEliminarFila = async (index: number) => {
      const confirmacion = await Swal.fire({
        title: '¿Eliminar esta fila?',
        text: 'La información digitada en esta fila se perderá.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#991b1b',
        cancelButtonColor: '#6b7280',
      });
    
      if (confirmacion.isConfirmed) {
        const nuevasFilas = [...filasAdicionales];
        nuevasFilas.splice(index, 1);
        setFilasAdicionales(nuevasFilas);
      }
    };    

    const [trackingExistente, setTrackingExistente] = useState(false);
    const [referenciaExistente, setReferenciaExistente] = useState(false);

    const [modoEdicion, setModoEdicion] = useState(false);


    useEffect(() => {
      const usuarioGuardado = localStorage.getItem("usuario");
      if (usuarioGuardado) {
        const usuarioParseado = JSON.parse(usuarioGuardado);
        setUser(usuarioParseado);
      }
    
      cargarPaquetes(); 

      const ahora = new Date();
      const fecha = ahora.toISOString().slice(0, 10);
      setFechaActual(fecha);
    
      const actualizarHora = () => {
        const ahora = new Date();
        const hora = ahora.toTimeString().slice(0, 5);
        setHoraActual(hora);
      };
    
      actualizarHora();
      const intervalo = setInterval(actualizarHora, 1000); 
    
      return () => clearInterval(intervalo); 

    }, []);
    
    const cargarPaquetes = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/paquetes`);
        const data = await res.json();
        setPaquetes(data);
      } catch (error) {
        console.error("❌ Error cargando paquetes:", error);
      }
    };
      
    const handleGuardarPaquete = async () => {
      if (
          !clienteInput.trim() ||
          !paqueteFila.tienda.trim() ||
          !paqueteFila.tracking.trim() ||
          !paqueteFila.contenido.trim() ||
          !paqueteFila.lbs.trim()
        ) {
          setErroresCampos({
            cliente: !clienteInput.trim(),
            tienda: !paqueteFila.tienda.trim(),
            tracking: !paqueteFila.tracking.trim(),
            contenido: !paqueteFila.contenido.trim(),
            lbs: !paqueteFila.lbs.trim(),
          });
        
          Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Debes completar todos los campos obligatorios antes de guardar.',
            confirmButtonColor: '#991b1b'
          });
          return;
        }
        
        try {      
          if (modoEdicion) {
            const paquete = {
              tracking: paqueteFila.tracking,
              numero_guia: paqueteFila.referencia,
              tienda: paqueteFila.tienda,
              contenido: paqueteFila.contenido,
              peso: parseFloat(paqueteFila.lbs) || 0,
              digitado_por: user?.nombre || '',
              codigo_referencia: clienteInput.split(" - ")[0],
              ancho: parseInt(paqueteFila.ancho) || 0,
              alto: parseInt(paqueteFila.alto) || 0,
              largo: parseInt(paqueteFila.largo) || 0,
              declaracion_valor: paqueteFila.dec,
              ubicacion: paqueteFila.ubicacion,
              posicion_arancelaria: paqueteFila.posicion,
              notas: paqueteFila.notas,
              punto_control: "Casilleros bodega",
              servicio_id: paqueteFila.servicio_id

            };

            const response = await fetch(`http://localhost:3000/api/paquetes/editar/${paqueteFila.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paquete),
            });
      
            const data = await response.json();
      
            if (response.ok) {
              await Swal.fire({
                icon: 'success',
                title: '¡PAQUETE ACTUALIZADO!',
                text: data.mensaje || 'La información del paquete fue actualizada correctamente.',
                confirmButtonColor: '#991b1b'
              });

              setModoEdicion(false);
              setClienteInput("");
              setPaqueteFila({
                id: "",
                tracking: "",
                tienda: "",
                referencia: "",
                lbs: "",
                largo: "0.00",
                ancho: "0.00",
                alto: "0.00",
                dec: "100.00",
                contenido: "",
                ubicacion: "",
                empaque: "SC",
                posicion: "98.07.20.00.00",
                notas: "",
                servicio_id: ""
              });
              cargarPaquetes();

            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.mensaje || 'No se pudo actualizar el paquete.',
              });
            }
          } else {

            const paquetesARegistrar = [];

            paquetesARegistrar.push({
              tracking: paqueteFila.tracking,
              numero_guia: paqueteFila.referencia,
              tienda: paqueteFila.tienda,
              contenido: paqueteFila.contenido,
              peso: parseFloat(paqueteFila.lbs) || 0,
              digitado_por: user?.nombre || '',
              codigo_referencia: clienteInput.split(" - ")[0],
              ancho: parseInt(paqueteFila.ancho) || 0,
              alto: parseInt(paqueteFila.alto) || 0,
              largo: parseInt(paqueteFila.largo) || 0,
              declaracion_valor: paqueteFila.dec,
              ubicacion: paqueteFila.ubicacion || "",
              posicion_arancelaria: paqueteFila.posicion,
              notas: paqueteFila.notas,
              punto_control: "Casilleros bodega",
              servicio_id: paqueteFila.servicio_id
            });

            for (const fila of filasAdicionales) {
              if (
                !fila.tracking ||
                !fila.referencia ||
                !fila.tienda ||
                !fila.lbs ||
                !fila.contenido
              ) continue; 
      
              paquetesARegistrar.push({
                tracking: paqueteFila.tracking,
                numero_guia: paqueteFila.referencia,
                tienda: paqueteFila.tienda,
                contenido: paqueteFila.contenido,
                peso: parseFloat(paqueteFila.lbs) || 0,
                digitado_por: user?.nombre || '',
                codigo_referencia: clienteInput.split(" - ")[0],
                ancho: parseInt(paqueteFila.ancho) || 0,
                alto: parseInt(paqueteFila.alto) || 0,
                largo: parseInt(paqueteFila.largo) || 0,
                declaracion_valor: paqueteFila.dec,
                ubicacion: paqueteFila.ubicacion || "",
                posicion_arancelaria: paqueteFila.posicion,
                notas: paqueteFila.notas,
                punto_control: "Casilleros bodega",
                servicio_id: paqueteFila.servicio_id
              });
            }

            for (const paquete of paquetesARegistrar) {
              const response = await fetch("http://localhost:3000/api/paquetes/registrar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paquete),
            });
      
            const data = await response.json();
      
            if (!response.ok) {
              Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: data.mensaje || 'No se pudo registrar uno de los paquetes.',
              });
              return;
            }
          }
          await Swal.fire({
            icon: 'success',
            title: '¡PAQUETES DIGITADOS!',
            text: 'Todos los paquetes fueron registrados correctamente.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#991b1b'
          });
          window.location.reload();
          }
        } catch (error) {
          console.error("❌ Error guardando o actualizando paquete:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Ocurrió un error al procesar la solicitud.',
          });
        }
      };
    
      const handleCancelarEdicion = async () => {
        const confirmacion = await Swal.fire({
          title: '¿Cancelar edición?',
          text: 'Se perderán los cambios no guardados.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, cancelar',
          cancelButtonText: 'No, seguir editando',
          confirmButtonColor: '#991b1b',
          cancelButtonColor: '#6b7280',
        });
      
        if (confirmacion.isConfirmed) {
          setModoEdicion(false);
          setPaqueteFila({
            id: "",
            tracking: "",
            tienda: "",
            referencia: "",
            lbs: "",
            largo: "0.00",
            ancho: "0.00",
            alto: "0.00",
            dec: "100.00",
            contenido: "",
            ubicacion: "",
            empaque: "SC",
            posicion: "98.07.20.00.00",
            notas: "",
            servicio_id: ""
          });
        }
      };
      
    
    const handleEditarPaquete = (paquete: any) => {
      setModoEdicion(true);    
      setClienteInput(`${paquete.codigo_referencia} - ${paquete.cliente}`);
      setPaqueteFila({
        id: paquete.id,
        tracking: paquete.tracking || "",
        tienda: paquete.tienda || "",
        referencia: paquete.numero_guia || "",
        lbs: paquete.peso ? paquete.peso.replace(' LB', '') : "",
        largo: "0.00",
        ancho: "0.00",
        alto: "0.00",
        dec: "100.00",
        contenido: paquete.contenido || "",
        ubicacion: "", 
        empaque: "SC",
        posicion: "98.07.20.00.00",
        notas: paquete.notas || "",
        servicio_id: paquete.servicio_id
      });
    };
    
    
    useEffect(() => {
      if (clienteInput.length < 3) {
          setClientesSugeridos([]);
          setClienteNoExiste(false);
          return;
      }

      const delayDebounce = setTimeout(async () => {
        try {
        const res = await fetch(`http://localhost:3000/api/clientes/buscar/${clienteInput}`);
        const data = await res.json();
        if (data.ok) {
            setClientesSugeridos(data.clientes);
            setClienteNoExiste(false);
        } else {
            setClientesSugeridos([]);
            setClienteNoExiste(true);
        }
        } catch (error) {
        console.error("Error al buscar cliente:", error);
        }
    }, 400);
    
    return () => clearTimeout(delayDebounce);
    }, [clienteInput]);

    useEffect(() => {
      const validarCampos = async () => {
        if (paqueteFila.tracking.length > 3) {
          const res = await fetch(`http://localhost:3000/api/paquetes/validar/tracking/${paqueteFila.tracking}`);
          const data = await res.json();
          setTrackingExistente(data.existe);
        }
    
        if (paqueteFila.referencia.length > 3) {
          const res = await fetch(`http://localhost:3000/api/paquetes/validar/referencia/${paqueteFila.referencia}`);
          const data = await res.json();
          setReferenciaExistente(data.existe);
        }
      };
    
      const delay = setTimeout(() => {
        validarCampos();
      }, 400);
    
      return () => clearTimeout(delay);
    }, [paqueteFila.tracking, paqueteFila.referencia]);    

    return (
    <UserDashboardLayout scrollable>
        <div className="text-gray-800 px-4 sm:px-6 lg:px-10 animate-fade-in">
            <h1 className="text-3xl font-bold mb-2 text-red-900">Digitación de paquetes</h1>
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
            <img src={iconHome} alt="Inicio" className="w-4 h-4" />
            <button
                onClick={() => navigate("/dashboardUsuario")}
                className="font-semibold hover:underline text-gray-700 cursor-pointer"
            >
                Dashboard
            </button>
            &gt; Digitación de paquetes
            </p>
    
            <div className="bg-white shadow-md rounded-lg p-6 mb-10">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                DIGITACIÓN DE PAQUETES EN BODEGA
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-25">
                    <div className="flex flex-col gap-4 w-[420px]">
                        <div className="flex items-center gap-3">
                            <label className="w-24 text-sm font-medium">Fecha / Hora</label>
                                <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={fechaActual}
                                    onChange={(e) => setFechaActual(e.target.value)}
                                    className="w-[140px] px-2 py-1 border rounded bg-gray-100"
                                    disabled
                                />
                                <input
                                    type="time"
                                    value={horaActual}
                                    onChange={(e) => setHoraActual(e.target.value)}
                                    className="w-[110px] px-2 py-1 border rounded bg-gray-100"
                                    disabled
                                />
                                </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-24 text-sm font-medium">Usuario</label>
                                <input
                                type="text"
                                value={user?.nombre || ""}
                                disabled
                                className="w-[260px] border px-3 py-1 rounded bg-gray-100"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-24 text-sm font-medium text-green-700">Oficina *</label>
                            <select className="w-[260px] border px-3 py-1 rounded">
                            <option>BOGOTÁ</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-24 text-sm font-medium invisible">Caja</label>
                            <div className="flex gap-2 w-[260px]">
                            <button 
                            onClick={handleAgregarCajas}
                            className="bg-red-900 text-white px-3 py-2 rounded font-semibold whitespace-nowrap flex items-center gap-2"
                            >
                                <span className="text-xl leading-none">+</span> Caja(s)
                            </button>
                            <select 
                            value={cantidadCajas}
                            onChange={(e) => setCantidadCajas(parseInt(e.target.value))}
                            className="flex-1 border px-3 py-1 rounded"
                            >
                            {[...Array(20)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                            </select>
                            </div>
                        </div>
                    </div>


                    <div className="flex flex-col gap-4 w-[420px]">
                    <div className="flex items-center gap-3">
                        <label className="w-48 text-sm font-medium text-green-700">Servicio *</label>
                          <select
                            className="w-full border px-3 py-1 rounded"
                            value={paqueteFila.servicio_id}
                              onChange={(e) =>
                                  setPaqueteFila({
                                    ...paqueteFila,
                                    servicio_id: Number(e.target.value)
                                  })
                                }
                          >
                            <option value="">Seleccione servicio...</option>

                            {servicios.map(serv => (
                              <option key={serv.id} value={serv.id}>
                                {serv.nombre} ({serv.tipo})
                              </option>
                            ))}
                          </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="w-48 text-sm font-medium text-green-700 leading-tight">
                            Nombre cliente / <br />
                            Suite(casillero) / <br />
                            Destinatario *
                        </label>
                        <input
                        type="text"
                        value={clienteInput}
                        onChange={(e) => {
                            setClienteInput(e.target.value);
                            setErroresCampos(prev => ({ ...prev, cliente: false }));
                          }}                        
                        list="clientes-list"
                        className={`border px-3 py-1 rounded w-full ${erroresCampos.cliente ? 'border-red-500' : ''}`}
                        />
                        <datalist id="clientes-list">
                        {clientesSugeridos.map((cliente, index) => (
                            <option key={index} value={`${cliente.codigo_referencia} - ${cliente.nombre}`} />
                        ))}
                        </datalist>
                        {clienteNoExiste && (
                        <p className="text-sm text-red-600 mt-1">⚠️ Cliente no registrado.</p>
                        )}

                    </div>

                    <div className="flex items-center gap-3">
                        <label className="w-48 text-sm font-medium">Oficina Cliente</label>
                        <input 
                        type="text"                             
                        value="Bogotá"
                        disabled 
                        className="w-full border px-3 py-1 rounded bg-gray-100" />
                    </div>
                    </div>


                    <div className="flex flex-col gap-4 w-[320px]">
                    <div className="flex items-center gap-3">
                        <label className="w-28 text-sm font-medium text-gray-700 text-right">Tienda *</label>
                        <input
                        type="text"
                        className={`border px-3 py-1 rounded w-[180px] ${erroresCampos.tienda ? 'border-red-500' : ''}`}
                        value={paqueteFila.tienda}
                        onChange={(e) => {
                            setPaqueteFila({ ...paqueteFila, tienda: e.target.value });
                            setErroresCampos(prev => ({ ...prev, tienda: false }));
                          }}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="w-28 text-sm font-medium text-gray-700 text-right">Destinatario *</label>
                        <select className="border px-3 py-1 rounded w-[180px]">
                        <option>Seleccionar</option>
                        </select>
                    </div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white shadow-md rounded-lg p-6">
                    <table className="min-w-full table-auto border text-sm">
                        <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="px-2 py-1">#</th>
                            <th className="px-2 py-1">Borrar</th>
                            <th className="px-2 py-1">Tracking</th>
                            <th className="px-2 py-1">Referencia</th>
                            <th className="px-2 py-1">Lbs</th>
                            <th className="px-2 py-1">Lar</th>
                            <th className="px-2 py-1">Anc</th>
                            <th className="px-2 py-1">Alt</th>
                            <th className="px-2 py-1">Dec</th>
                            <th className="px-2 py-1">Contenido</th>
                            <th className="px-2 py-1">Declaración</th>
                            <th className="px-2 py-1">Ubicación</th>
                            <th className="px-2 py-1">Imagen</th>
                            <th className="px-2 py-1">Empaque</th>
                            <th className="px-2 py-1">Posición arancelaria</th>
                            <th className="px-2 py-1">Notas</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="px-2 py-1 text-center">1</td>
                            <td className="px-2 py-1 text-center">
                            <button className="hover:scale-110 transition-transform cursor-pointer">
                                <img src={iconTrash} alt="Eliminar" className="w-5 h-5 inline" />
                            </button>
                            </td>
                            <td className="px-2 py-1"><input 
                            type="text" 
                            className={`border rounded px-2 py-1 w-28 ${erroresCampos.tracking ? 'border-red-500' : ''}`} 
                            value={paqueteFila.tracking}
                            onChange={(e) => {
                                setPaqueteFila({ ...paqueteFila, tracking: e.target.value });
                                setErroresCampos(prev => ({ ...prev, tracking: false }));
                            }} 
                            />
                            {trackingExistente && !modoEdicion && (
                              <p className="text-xs text-red-600 mt-1">⚠️ Este tracking ya existe</p>
                            )}
                            </td>
                            <td className="px-2 py-1"><input 
                            type="text" 
                            className="border rounded px-2 py-1 w-28" 
                            value={paqueteFila.referencia}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, referencia: e.target.value })}
                            />
                            {referenciaExistente && !modoEdicion && (
                              <p className="text-xs text-red-600 mt-1">⚠️ Esta referencia ya existe</p>
                            )}
                            </td>
                            <td className="px-2 py-1"><input 
                            type="number" 
                            className={`border rounded px-2 py-1 w-16 ${erroresCampos.lbs ? 'border-red-500' : ''}`} 
                            value={paqueteFila.lbs}
                            onChange={(e) => {
                                setPaqueteFila({ ...paqueteFila, lbs: e.target.value });
                                setErroresCampos(prev => ({ ...prev, lbs: false }));
                            }}
                            />
                            </td>
                            <td className="px-2 py-1"><input
                            type="number" 
                            className="border rounded px-2 py-1 w-16"
                            value={paqueteFila.largo}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, largo: e.target.value })} 
                            /></td>
                            <td className="px-2 py-1"><input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16"
                            value={paqueteFila.ancho}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, ancho: e.target.value })}
                            /></td>
                            <td className="px-2 py-1"><input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16"
                            value={paqueteFila.alto}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, alto: e.target.value })}
                            /></td>

                            <td className="px-2 py-1"><input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16"
                            value={paqueteFila.dec}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, dec: e.target.value })} 
                            /></td>
                            <td className="px-2 py-1"><input 
                            type="text" 
                            className={`border rounded px-2 py-1 w-40 ${erroresCampos.contenido ? 'border-red-500' : ''}`}
                            value={paqueteFila.contenido}
                            onChange={(e) => {
                                setPaqueteFila({ ...paqueteFila, contenido: e.target.value });
                                setErroresCampos(prev => ({ ...prev, contenido: false }));
                            }}
                            /></td>
                            <td className="px-2 py-1 text-center">
                            <button className="px-2 py-1 border rounded bg-gray-200 hover:bg-gray-300">☰</button>
                            </td>
                            <td className="px-2 py-1"><input
                            type="text" 
                            className="border rounded px-2 py-1 w-28"
                            value={paqueteFila.ubicacion}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, ubicacion: e.target.value })}
                            /></td>
                            <td className="px-2 py-1 flex gap-1">
                            <button className="border rounded px-2 bg-gray-200">📤</button>
                            <button className="border rounded px-2 bg-gray-200">📷</button>
                            </td>
                            <td className="px-2 py-1">
                            <select className="border rounded px-2 py-1">
                                <option>SC</option>
                                <option>Box</option>
                            </select>
                            </td>
                            <td className="px-2 py-1">
                            <select 
                            className="border rounded px-2 py-1"
                            value={paqueteFila.posicion}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, posicion: e.target.value })}
                            >
                                <option>98.07.20.00.00</option>
                                <option>87.01.10.00.00</option>
                            </select>
                            </td>

                            <td className="px-2 py-1"><input 
                            type="text" 
                            className="border rounded px-2 py-1 w-28"
                            value={paqueteFila.notas}
                            onChange={(e) => setPaqueteFila({ ...paqueteFila, notas: e.target.value })} 
                            /></td>
                        </tr>

                        {filasAdicionales.map((fila, index) => (
                        <tr key={`extra-${index}`}>
                          <td className="px-2 py-1 text-center">{index + 2}</td>
                          <td className="px-2 py-1 text-center">
                            <button 
                            className="hover:scale-110 transition-transform cursor-pointer"
                            onClick={() => handleEliminarFila(index)} 
                            >
                              <img src={iconTrash} alt="Eliminar" className="w-5 h-5 inline" />
                            </button>
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="text" 
                            className="border rounded px-2 py-1 w-28" 
                            value={fila.tracking} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].tracking = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="text" 
                            className="border rounded px-2 py-1 w-28" 
                            value={fila.referencia} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].referencia = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                            </td>
                          <td className="px-2 py-1">
                            <input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16" 
                            value={fila.lbs} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].lbs = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16" 
                            value={fila.largo} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].largo = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16" 
                            value={fila.ancho} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].ancho = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16" 
                            value={fila.alto} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].alto = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="number" 
                            className="border rounded px-2 py-1 w-16" 
                            value={fila.dec}
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].dec = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }} 
                            />
                            </td>
                          <td className="px-2 py-1">
                            <input 
                            type="text" 
                            className="border rounded px-2 py-1 w-40" 
                            value={fila.contenido}
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].contenido = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }} 
                            />
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button className="px-2 py-1 border rounded bg-gray-200 hover:bg-gray-300">☰</button>
                          </td>
                          <td className="px-2 py-1">
                            <input 
                            type="text" 
                            className="border rounded px-2 py-1 w-28" 
                            value={fila.ubicacion}
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].ubicacion = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                            </td>
                          <td className="px-2 py-1 flex gap-1">
                            <button className="border rounded px-2 bg-gray-200">📤</button>
                            <button className="border rounded px-2 bg-gray-200">📷</button>
                          </td>
                          <td className="px-2 py-1">
                            <select className="border rounded px-2 py-1">
                              <option>SC</option>
                              <option>Box</option>
                            </select>
                          </td>
                          <td className="px-2 py-1">
                            <select 
                            className="border rounded px-2 py-1"
                            value={fila.posicion}
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].posicion = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                          >
                              <option>98.07.20.00.00</option>
                              <option>87.01.10.00.00</option>
                            </select>
                          </td>

                          <td className="px-2 py-1">
                            <input 
                            type="text" 
                            className="border rounded px-2 py-1 w-28" 
                            value={fila.notas} 
                            onChange={(e) => {
                              const nuevasFilas = [...filasAdicionales];
                              nuevasFilas[index].notas = e.target.value;
                              setFilasAdicionales(nuevasFilas);
                            }}
                            />
                            </td>
                        </tr>
                      ))}
                        </tbody>
                    </table>
                </div>
              <div className="flex gap-3 justify-end mt-4">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded flex items-center gap-2"
                  onClick={handleGuardarPaquete}
                  disabled={!modoEdicion && (trackingExistente || referenciaExistente)}
                >
                  <img src={iconSave} alt="Guardar" className="w-5 h-5" />
                  {modoEdicion ? "Guardar Cambios" : "Guardar"}
                </button>

                <button
                  onClick={modoEdicion ? handleCancelarEdicion : () => window.location.reload()}
                  className={`px-5 py-2 rounded flex items-center gap-2 cursor-pointer transition
                    ${modoEdicion
                      ? "bg-gray-400 hover:bg-gray-500 text-white"
                      : "bg-white border border-gray-400 text-gray-700 hover:bg-red-100 hover:border-red-400 hover:text-red-700"}
                  `}
                >
                  <img src={iconCancel} alt="Cancelar" className="w-5 h-5" />
                  {modoEdicion ? "Cancelar Edición" : "Cancelar"}
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">BÚSQUEDA DE PAQUETES</h2>

                <BusquedaPaquetes filtros={filtrosBusqueda} onChangeFiltros={setFiltrosBusqueda} />

                <div className="flex justify-end gap-2 mt-4 px-6">
                    <button
                    onClick={handleCancelarBusqueda}
                    className="flex items-center gap-2 bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded"
                    >
                    <img src={iconCancel} alt="Cancelar" className="w-4 h-4" />
                    Cancelar
                    </button>
                    <button
                        onClick={handleBuscarPaquetes}
                        className="flex items-center gap-2 bg-red-900 hover:bg-red-950 text-white px-4 py-2 rounded"
                    >
                    <img src={iconSearch} alt="Buscar" className="w-4 h-4" />
                    Buscar
                    </button>
                </div>
            </div>
            <TablaPaquetesDigitados paquetes={paquetes} onEditar={handleEditarPaquete} />
            </div>
    </UserDashboardLayout>
    )
}