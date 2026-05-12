import UserDashboardLayout from "../../layouts/UserDashboardLayout";
import BusquedaPaquetes from "../../components/paquetesDigitados/BusquedaPaquetes";
import TablaPaquetesDigitados from "../../components/paquetesDigitados/TablaPaquetesDigitados";
import iconHome from "../../assets/home-svgrepo-com.svg";
import iconTrash from "../../assets/trash-svgrepo-com.svg";
import iconSearch from "../../assets/search-alt-svgrepo-com.svg";
import iconSave from "../../assets/save-svgrepo-com.svg";
import iconCancel from "../../assets/cancel-svgrepo-com.svg";
import iconRandom from "../../assets/sort-random-svgrepo-com.svg";
import { Destinatario } from "../../types/destinatarios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const getAuthToken = () =>
  localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

const getStoredUser = () =>
  localStorage.getItem("usuario") || sessionStorage.getItem("usuario");

export default function DigitacionPaquetes() {
    const navigate = useNavigate();
    const [fechaActual, setFechaActual] = useState("");
    const [horaActual, setHoraActual] = useState("");
    const [user, setUser] = useState<any>(null);
    const [clienteInput, setClienteInput] = useState("");
    const [clientesSugeridos, setClientesSugeridos] = useState<any[]>([]);
    const [usuariosSugeridos, setUsuariosSugeridos] = useState<any[]>([]);
    const [clienteNoExiste, setClienteNoExiste] = useState(false);
    const [filtrosBusqueda, setFiltrosBusqueda] = useState({
      trackingHawb: "",
      referencia: "",
      cliente: "",
      fechaInicial: "",
      fechaFinal: "",
      contenido: "",
      notas: "",
      usuario: ""
    });
    
    const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);
    const [cargandoDestinatarios, setCargandoDestinatarios] = useState(false);
    const [paquetes, setPaquetes] = useState<any[]>([]);
    const [paquetesFiltrados, setPaquetesFiltrados] = useState<any[]>([]);

    const [servicios, setServicios] = useState<any[]>([]);

    const obtenerHeadersAutenticados = () => {
      const token = getAuthToken();

      if (!token) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "Inicia sesión nuevamente para poder digitar paquetes.",
          confirmButtonColor: "#991b1b",
        });
        navigate("/login");
        return null;
      }

      return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
    };

    useEffect(() => {
      const cargarServicios = async () => {
        try {
          const res = await fetch("/api/servicios");
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
        const response = await fetch(
          "/api/paquetes/buscar",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guia: filtrosBusqueda.trackingHawb,
              referencia: filtrosBusqueda.referencia,
              cliente: filtrosBusqueda.cliente,
              contenido: filtrosBusqueda.contenido,
              notas: filtrosBusqueda.notas,
              usuario: filtrosBusqueda.usuario,
              fechaDesde: filtrosBusqueda.fechaInicial || null,
              fechaHasta: filtrosBusqueda.fechaFinal || null,
            }),
          }
        );

        const data = await response.json();

        if (data.ok) {
          setPaquetesFiltrados(data.paquetes);
        } else {
          setPaquetesFiltrados([]);
        }
      } catch (error) {
        console.error("❌ Error al buscar paquetes:", error);
      }
    };

    const buscarClientesFiltro = async (texto: string) => {
      if (texto.length < 3) {
        setClientesSugeridos([]);
        return;
      }

      try {
        const res = await fetch(`/api/clientes/buscar/${texto}`);
        const data = await res.json();

        if (data.ok) {
          setClientesSugeridos(data.clientes);
        } else {
          setClientesSugeridos([]);
        }
      } catch (error) {
        console.error("Error buscando clientes:", error);
      }
    };

    const buscarUsuariosFiltro = async (texto: string) => {
      if (texto.length < 3) {
        setUsuariosSugeridos([]);
        return;
      }

      try {
        const res = await fetch(`/api/usuarios/buscar/${texto}`);
        const data = await res.json();

        if (data.ok) {
          setUsuariosSugeridos(data.usuarios);
        } else {
          setUsuariosSugeridos([]);
        }
      } catch (error) {
        console.error("Error buscando usuarios:", error);
      }
    };

    const handleCancelarBusqueda = () => {
      setFiltrosBusqueda({
        fechaInicial: "",
        fechaFinal: "",
        trackingHawb: "",
        contenido: "",
        notas: "",
        referencia: "",
        cliente: "",
        usuario: ""
      });
      setPaquetesFiltrados([]);
    };
    
    const limpiarFormulario = () => {
      setClienteInput("");
      setClientesSugeridos([]);
      setClienteNoExiste(false);
      setTrackingExistente(false);
      setReferenciaExistente(false);
      setModoEdicion(false);
      setCantidadCajas(1);

      setErroresCampos({
        cliente: false,
        tienda: false,
        tracking: false,
        contenido: false,
        lbs: false,
        destinatario: false,
        servicio: false,
        oficina: false
      });

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
        servicio_id: "",
        destinatario_id: "",
      });

      setFilasAdicionales([]);
      setDestinatarios([]);
    };
    
    
    const [erroresCampos, setErroresCampos] = useState({
      cliente: false,
      tienda: false,
      tracking: false,
      contenido: false,
      lbs: false,
      destinatario: false,
      servicio: false,
      oficina: false
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
      posicion: "98.07.20.00.00",
      notas: "",
      servicio_id: "",
      destinatario_id: "",
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
          servicio_id: paqueteFila.servicio_id,
          destinatario_id: paqueteFila.destinatario_id,
          empaque: "SC" 
        }));
        setFilasAdicionales((prev) => [...prev, ...nuevasFilas]);
      }
    };

    useEffect(() => {
      setFilasAdicionales(prev =>
        prev.map(fila => ({
          ...fila,
          servicio_id: paqueteFila.servicio_id,
          destinatario_id: paqueteFila.destinatario_id,
          tienda: paqueteFila.tienda,
          ubicacion: paqueteFila.ubicacion
        }))
      );
    }, [paqueteFila.servicio_id, paqueteFila.destinatario_id, paqueteFila.tienda]);

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
      const usuarioGuardado = getStoredUser();
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
        const res = await fetch(`/api/paquetes`);
        const data = await res.json();
        setPaquetes(data);
      } catch (error) {
        console.error("❌ Error cargando paquetes:", error);
      }
    };

    const validarPesoContraServicio = (servicioId: any, peso: number) => {
      const servicio = servicios.find(
        (s) => String(s.id) === String(servicioId)
      );

      if (!servicio) {
        return {
          ok: false,
          mensaje: "No se encontró la configuración del servicio seleccionado.",
        };
      }

      if (
        servicio.aplica_peso_maximo &&
        Number(servicio.peso_maximo) > 0 &&
        peso > Number(servicio.peso_maximo)
      ) {
        return {
          ok: false,
          mensaje: `El servicio "${servicio.nombre}" solo permite hasta ${servicio.peso_maximo} lb. Peso digitado: ${peso} lb.`,
        };
      }

      return {
        ok: true,
        mensaje: "",
      };
    };
      
    const handleGuardarPaquete = async () => {
      if (
        !clienteInput.trim() ||
        !paqueteFila.tienda.trim() ||
        !paqueteFila.tracking.trim() ||
        !paqueteFila.contenido.trim() ||
        !paqueteFila.lbs.trim() ||
        !paqueteFila.destinatario_id ||
        !paqueteFila.servicio_id
      ) {
        setErroresCampos({
          cliente: !clienteInput.trim(),
          tienda: !paqueteFila.tienda.trim(),
          tracking: !paqueteFila.tracking.trim(),
          contenido: !paqueteFila.contenido.trim(),
          lbs: !paqueteFila.lbs.trim(),
          destinatario: !paqueteFila.destinatario_id,
          servicio: !paqueteFila.servicio_id,
          oficina: !paqueteFila.oficina
        });

        Swal.fire({
          icon: "warning",
          title: "Campos incompletos",
          text: "Debes completar todos los campos obligatorios antes de guardar.",
          confirmButtonColor: "#991b1b",
        });
        return;
      }

      const validacionPrincipal = validarPesoContraServicio(
        paqueteFila.servicio_id,
        Number(paqueteFila.lbs || 0)
      );

      if (!validacionPrincipal.ok) {
        await Swal.fire({
          icon: "error",
          title: "Peso no permitido",
          text: validacionPrincipal.mensaje,
          confirmButtonColor: "#991b1b",
        });
        return;
      }

      for (const fila of filasAdicionales) {
        if (!fila.tracking?.trim() || !fila.lbs?.toString().trim() || !fila.contenido?.trim()) {
          continue;
        }

        const validacionFila = validarPesoContraServicio(
          paqueteFila.servicio_id,
          Number(fila.lbs || 0)
        );

        if (!validacionFila.ok) {
          await Swal.fire({
            icon: "error",
            title: "Peso no permitido",
            text: validacionFila.mensaje,
            confirmButtonColor: "#991b1b",
          });
          return;
        }
      }
        
        try {      
          if (modoEdicion) {
            const authHeaders = obtenerHeadersAutenticados();
            if (!authHeaders) return;

            const paquete = {
              tracking: paqueteFila.tracking,
              referencia: paqueteFila.referencia,
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
              servicio_id: paqueteFila.servicio_id,
              destinatario_id: paqueteFila.destinatario_id

            };

            const response = await fetch(`/api/paquetes/editar/${paqueteFila.id}`, {
              method: "PUT",
              headers: authHeaders,
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

              limpiarFormulario();
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
              referencia: paqueteFila.referencia,
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
              servicio_id: paqueteFila.servicio_id,
              destinatario_id: paqueteFila.destinatario_id
            });

            for (const fila of filasAdicionales) {
              if (
                  !fila.tracking?.trim() ||
                  !fila.lbs?.toString().trim() ||
                  !fila.contenido?.trim()
                ) continue;

                paquetesARegistrar.push({
                  tracking: fila.tracking,
                  referencia: fila.referencia || "",
                  tienda: paqueteFila.tienda,
                  contenido: fila.contenido,
                  peso: parseFloat(fila.lbs) || 0,
                  digitado_por: user?.nombre || "",
                  codigo_referencia: clienteInput.split(" - ")[0],
                  ancho: parseInt(fila.ancho) || 0,
                  alto: parseInt(fila.alto) || 0,
                  largo: parseInt(fila.largo) || 0,
                  declaracion_valor: fila.dec,
                  ubicacion: paqueteFila.ubicacion || "",
                  posicion_arancelaria: fila.posicion,
                  notas: fila.notas || "",
                  punto_control: "Casilleros bodega",
                  servicio_id: paqueteFila.servicio_id,
                  destinatario_id: paqueteFila.destinatario_id
                });
              }

            let ultimaUrlPDF = "";
            const authHeaders = obtenerHeadersAutenticados();
            if (!authHeaders) return;

            for (const paquete of paquetesARegistrar) {
              const response = await fetch("/api/paquetes/registrar", {
                method: "POST",
                headers: authHeaders,
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

              if (data.pdfUrl) {
                ultimaUrlPDF = data.pdfUrl;
              }
            }

            if (ultimaUrlPDF) {
              window.open(ultimaUrlPDF, "_blank");
            }

            await Swal.fire({
              icon: 'success',
              title: '¡PAQUETES DIGITADOS!',
              text: 'Todos los paquetes fueron registrados correctamente.',
              confirmButtonText: 'OK',
              confirmButtonColor: '#991b1b'
            });

            limpiarFormulario();
            cargarPaquetes();

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
        limpiarFormulario();
      }
    };
      
    
    const handleEditarPaquete = async (paquete: any) => {
      setPaqueteFila({
        id: paquete.id,
        tracking: paquete.tracking || "",
        tienda: paquete.tienda ?? "",
        referencia: paquete.referencia || "",
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
        servicio_id: paquete.servicio_id,
        destinatario_id: paquete.destinatario_id
      });

      setModoEdicion(true);
      
      try {
        const res = await fetch(`/api/clientes/buscar/${paquete.codigo_referencia}`);
        const data = await res.json();
        if (data.ok && data.clientes.length > 0) {
          const cliente = data.clientes[0];
          const nombreCliente =
            paquete.cliente ||
            paquete.nombre_completo ||
            paquete.nombre ||
            paquete.nombre_empresa ||
            "Sin nombre";

          setClienteInput(`${paquete.codigo_referencia} - ${nombreCliente}`);
          
          const rDest = await fetch(`/api/destinatarios/${cliente.id}`);
          const dataDest = await rDest.json();
          setDestinatarios(dataDest);
          setCargandoDestinatarios(false);
        }
      } catch (error) {
        console.error("Error cargando cliente y destinatarios:", error);
        setDestinatarios([]);
        setCargandoDestinatarios(false);
      }
    
    };
    
    useEffect(() => {
      if (clienteInput.length < 3) {
          setClientesSugeridos([]);
          setClienteNoExiste(false);
          return;
      }

      const delayDebounce = setTimeout(async () => {
        try {
        const res = await fetch(`/api/clientes/buscar/${clienteInput}`);
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
      const codigoCasillero = (clienteInput || "").split(" - ")[0]?.trim();

      if (!codigoCasillero || codigoCasillero.length < 3) {
        setDestinatarios([]);
        setPaqueteFila((prev: any) => ({ ...prev, destinatario_id: "" }));
        return;
      }

      const cargarDestinatarios = async () => {
        try {
          setCargandoDestinatarios(true);

          const res = await fetch(
            `/api/destinatarios/por-cliente/${codigoCasillero}`
          );

          const data = await res.json();

          if (data.ok) {
            const lista: Destinatario[] = data.destinatarios || [];
            setDestinatarios(lista);

            const def = lista.find((d) => d.es_default === 1);

            setPaqueteFila((prev: any) => {
              if (prev.destinatario_id) {
                return prev;
              }

              return {
                ...prev,
                destinatario_id: def ? String(def.id) : ""
              };
            });
          } else {
            setDestinatarios([]);
            setPaqueteFila((prev: any) => ({ ...prev, destinatario_id: "" }));
          }
        } catch (err) {
          console.error("❌ Error cargando destinatarios:", err);
          setDestinatarios([]);
          setPaqueteFila((prev: any) => ({ ...prev, destinatario_id: "" }));
        } finally {
          setCargandoDestinatarios(false);
        }
      };

      cargarDestinatarios();
    }, [clienteInput]);   

    useEffect(() => {
      const validarCampos = async () => {
        if (paqueteFila.tracking.length > 3) {
          const res = await fetch(`/api/paquetes/validar/tracking/${paqueteFila.tracking}`);
          const data = await res.json();
          setTrackingExistente(data.existe);
        }
    
        if (paqueteFila.referencia.length > 3) {
          const res = await fetch(`/api/paquetes/validar/referencia/${paqueteFila.referencia}`);
          const data = await res.json();
          setReferenciaExistente(data.existe);
        }
      };
    
      const delay = setTimeout(() => {
        validarCampos();
      }, 400);
    
      return () => clearTimeout(delay);
    }, [paqueteFila.tracking, paqueteFila.referencia]);

    const limpiarNumeroNegativo = (valor: string) => {
      if (valor === "") return "";

      const numero = Number(valor);

      if (numero < 1) return "1";

      return valor;
    };

    const generarTrackingAleatorio = () => {
      const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numeros = "0123456789";
      let tracking = "";
      
      for (let i = 0; i < 3; i++) {
        tracking += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      
      for (let i = 0; i < 8; i++) {
        tracking += numeros.charAt(Math.floor(Math.random() * numeros.length));
      }
      
      for (let i = 0; i < 2; i++) {
        tracking += letras.charAt(Math.floor(Math.random() * letras.length));
      }
      
      return tracking;
    };

    const inputTablaBase =
    "px-2 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400";

    const inputTablaError =
      "border-red-500 focus:ring-2 focus:ring-red-500/30";

    const selectTablaBase =
      "px-2 py-2 rounded-xl text-sm bg-white shadow-sm transition border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400 cursor-pointer";

    const thTabla =
      "px-3 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap";

    const tdTabla =
      "px-2 py-2 align-top";

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
            
            <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 mb-10 overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                
                <div>
                  <h2 className="text-xl font-bold text-gray-600 tracking-wide">
                    DIGITACIÓN DE PAQUETES EN BODEGA
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Registro operativo de paquetes, cliente, servicio y destinatario
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  <span className="text-xs font-semibold text-gray-600">
                    Módulo activo
                  </span>
                </div>
              </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center">
                        <label className="w-24 text-sm font-semibold text-gray-600 tracking-tighter">
                          Fecha / Hora
                        </label>

                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={fechaActual}
                            onChange={(e) => setFechaActual(e.target.value)}
                            disabled
                            className="w-[150px] px-3 py-2 rounded-xl text-sm border border-gray-200 
                            bg-gray-100 text-gray-500 shadow-inner cursor-not-allowed"
                          />

                          <input
                            type="time"
                            value={horaActual}
                            onChange={(e) => setHoraActual(e.target.value)}
                            disabled
                            className="w-[120px] px-3 py-2 rounded-xl text-sm border border-gray-200 
                            bg-gray-100 text-gray-500 shadow-inner cursor-not-allowed"
                          />
                        </div>
                      </div>

                        <div className="flex items-center gap-3">
                            <label className="w-24 text-sm font-medium">Usuario</label>
                                <input
                                type="text"
                                value={user?.nombre || ""}
                                disabled
                                className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-100 text-gray-500 shadow-inner cursor-not-allowed"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="w-24 text-sm font-medium text-green-700">Oficina *</label>
                            <select className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition cursor-pointer
                              border ${
                                  erroresCampos.oficina
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                                  : 'border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400'
                              }
                              focus:outline-none`}>
                            <option>BOGOTÁ</option>
                            </select>
                        </div>

                      <div className="flex items-center gap-3">
                        <label className="w-22 text-xs font-semibold text-gray-600 tracking-wide invisible">
                          Caja
                        </label>

                          <button
                            onClick={handleAgregarCajas}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-900 text-white text-sm font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition cursor-pointer"
                          >
                            <span className="text-lg leading-none">+</span>
                            Caja(s)
                          </button>

                          <select
                            value={cantidadCajas}
                            onChange={(e) => setCantidadCajas(parseInt(e.target.value))}
                            className="flex-1 px-3 py-2 rounded-xl text-sm bg-white border border-gray-300 shadow-sm 
                            focus:outline-none focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400 transition cursor-pointer"
                          >
                            {[...Array(20)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>

                      </div>
                    </div>


                    <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <label className="w-48 text-sm font-medium text-green-700">Servicio *</label>
                          <select
                          className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition cursor-pointer
                          border ${
                            erroresCampos.servicio
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                              : 'border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400'
                          }
                          focus:outline-none`}
                            value={paqueteFila.servicio_id}
                            onChange={(e) => {
                              setPaqueteFila({
                                ...paqueteFila,
                                servicio_id: e.target.value === "" ? "" : Number(e.target.value)
                              });

                              setErroresCampos(prev => ({
                                ...prev,
                                servicio: false
                              }));
                            }}
                          >
                            <option value="">Seleccione servicio...</option>

                            {servicios.map(serv => (
                              <option key={serv.id} value={serv.id}>
                                {serv.nombre} ({serv.tipo})
                              </option>
                            ))}
                          </select>
                    </div>

                    <div className="flex items-start gap-3 relative w-full">

                      <label className="w-48 text-sm font-medium text-green-700 leading-tight">
                        Nombre cliente / <br />
                        Codigo(casillero) *
                      </label>

                      <div className="w-full relative">
                        <input
                          type="text"
                          value={clienteInput}
                          onChange={(e) => {
                            setClienteInput(e.target.value);
                            setErroresCampos(prev => ({ ...prev, cliente: false }));
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition
                              border ${
                                erroresCampos.cliente
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                                  : 'border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400'
                              }
                              focus:outline-none`}
                            />

                            {erroresCampos.cliente && (
                              <span className="text-xs text-red-500 mt-1">
                                Debes seleccionar un cliente válido
                              </span>
                            )}

                        {clientesSugeridos.length > 0 && (
                          <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-52 overflow-y-auto">

                            {clientesSugeridos.map((cliente, index) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setClienteInput(`${cliente.codigo_referencia} - ${cliente.nombre}`);
                                  setClientesSugeridos([]);
                                }}
                                className="px-4 py-2 cursor-pointer hover:bg-red-50 transition-all duration-150 hover:pl-5"
                              >
                                <div className="font-semibold text-gray-800 text-sm">
                                  {cliente.nombre}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {cliente.codigo_referencia}
                                </div>
                              </div>
                            ))}

                          </div>
                        )}

                        {clienteNoExiste && (
                          <p className="text-sm text-red-600 mt-1">
                            ⚠️ Cliente no registrado.
                          </p>
                        )}

                      </div>

                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-48 text-sm font-medium text-gray-700 leading-tight">
                        Estado inicial
                      </label>

                      <input
                        type="text"
                        value="Digitado"
                        disabled
                        className="w-full px-3 py-2 rounded-xl text-sm border border-gray-200 bg-gray-100 text-gray-500 shadow-inner cursor-not-allowed"
                      />
                    </div>

                    </div>


                    <div className="flex flex-col gap-4 bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <label className="w-24 text-sm font-medium  tracking-wide text-right">
                          Tienda *
                        </label>

                        <input
                          type="text"
                          className={`w-[190px] px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition border ${
                            erroresCampos.tienda
                              ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                              : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
                          } focus:outline-none`}
                          value={paqueteFila.tienda}
                          onChange={(e) => {
                            setPaqueteFila({ ...paqueteFila, tienda: e.target.value });
                            setErroresCampos(prev => ({ ...prev, tienda: false }));
                          }}
                          placeholder="Tienda"
                          key={modoEdicion ? 'edit-tienda' : 'create-tienda'}
                        />

                        {erroresCampos.tienda && (
                          <span className="ml-[124px] text-xs text-red-500">
                            Debes ingresar la tienda
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="w-24 text-sm font-medium  tracking-wide text-right">
                          Destinatario *
                        </label>

                        <select
                          disabled={cargandoDestinatarios}
                          className={`w-[190px] px-3 py-2 rounded-xl text-sm bg-white shadow-sm transition cursor-pointer border ${
                            erroresCampos.destinatario
                              ? "border-red-500 focus:ring-2 focus:ring-red-500/30"
                              : "border-gray-300 focus:ring-2 focus:ring-red-900/20 focus:border-red-900 hover:border-gray-400"
                          } focus:outline-none`}
                          value={String(paqueteFila.destinatario_id)}
                          
                          onChange={(e) => {
                            setPaqueteFila({
                              ...paqueteFila,
                              destinatario_id: e.target.value
                            });

                            setErroresCampos(prev => ({
                              ...prev,
                              destinatario: false
                            }));
                          }}
                          key={modoEdicion ? 'edit-destinatario' : 'create-destinatario'}
                        >
                          <option value="">
                            {cargandoDestinatarios ? "Cargando destinatarios..." : "Seleccione destinatario..."}
                          </option>

                          {destinatarios.map((d) => (
                            <option key={d.id} value={String(d.id)}>
                              {d.nombre}
                            </option>
                          ))}
                        </select>
                        {cargandoDestinatarios && (
                          <span className="ml-2 text-xs text-gray-500">
                            Cargando...
                          </span>
                        )}
                        {erroresCampos.destinatario && (
                          <span className="ml-[124px] text-xs text-red-500">
                            Debes seleccionar un destinatario
                          </span>
                        )}
                      </div>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-5 mt-6">
                    <table className="min-w-full table-auto text-sm border-separate border-spacing-y-2">
                        <thead className="bg-gray-100 text-gray-700">
                        <tr className="bg-gray-50 hover:bg-gray-100 transition">
                            <th className={thTabla}>#</th>
                            <th className={thTabla}>Borrar</th>
                            <th className={thTabla}>Tracking</th>
                            <th className={thTabla}>Referencia</th>
                            <th className={thTabla}>Lbs</th>
                            <th className={thTabla}>Lar</th>
                            <th className={thTabla}>Anc</th>
                            <th className={thTabla}>Alt</th>
                            <th className={thTabla}>Dec</th>
                            <th className={thTabla}>Contenido</th>
                            <th className={thTabla}>Posición arancelaria</th>
                            <th className={thTabla}>Notas</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td className="px-2 py-1 text-center">1</td>
                            <td className="px-2 py-1 text-center">
                            <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:scale-105 transition cursor-pointer">
                              <img src={iconTrash} alt="Eliminar" className="w-5 h-5" />
                            </button>
                            </td>
                            <td className={tdTabla}>
                            <div className="flex gap-2 items-start">
                              <input 
                                type="text" 
                                className={`w-32 ${inputTablaBase} ${
                                  erroresCampos.tracking ? inputTablaError : ""
                                }`}
                                value={paqueteFila.tracking}
                                onChange={(e) => {
                                  setPaqueteFila({ ...paqueteFila, tracking: e.target.value });
                                  setErroresCampos(prev => ({ ...prev, tracking: false }));
                                }} 
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const trackingAleatorio = generarTrackingAleatorio();
                                  setPaqueteFila({ ...paqueteFila, tracking: trackingAleatorio });
                                  setErroresCampos(prev => ({ ...prev, tracking: false }));
                                }}
                                className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900 text-white hover:bg-red-950 hover:shadow-lg hover:scale-105 transition shadow-md"
                                title="Generar tracking aleatorio"
                              >
                                <img src={iconRandom} alt="Generar" className="w-5 h-5" />
                              </button>
                            </div>
                            {trackingExistente && !modoEdicion && (
                              <p className="text-xs text-red-600 mt-1">⚠️ Este tracking ya existe</p>
                            )}
                            </td>

                            <td className={tdTabla}>
                            <input 
                              type="text" 
                              className={`w-32 ${inputTablaBase}`}
                              value={paqueteFila.referencia}
                              onChange={(e) => setPaqueteFila({ ...paqueteFila, referencia: e.target.value })}
                            />
                            {referenciaExistente && !modoEdicion && (
                              <p className="text-xs text-red-600 mt-1">⚠️ Esta referencia ya existe</p>
                            )}
                            </td>

                            <td className={tdTabla}>
                            <input 
                              type="number" 
                              min={0}
                              className={`w-20 ${inputTablaBase} ${
                                erroresCampos.lbs ? inputTablaError : ""
                              }`}
                              value={paqueteFila.lbs}
                              onChange={(e) => {
                                setPaqueteFila({
                                  ...paqueteFila,
                                  lbs: limpiarNumeroNegativo(e.target.value)
                                });

                                setErroresCampos(prev => ({ ...prev, lbs: false }));
                              }}
                            />
                            </td>

                            <td className={tdTabla}>
                              <input
                                type="number" 
                                min={0}
                                className={`w-20 ${inputTablaBase}`}
                                value={paqueteFila.largo}
                                onChange={(e) =>
                                  setPaqueteFila({
                                    ...paqueteFila,
                                    largo: limpiarNumeroNegativo(e.target.value)
                                  })
                                }
                              />
                            </td>

                            <td className={tdTabla}>
                            <input
                            type="number" 
                            min={0}
                            className={`w-20 ${inputTablaBase}`}
                            value={paqueteFila.ancho}
                            onChange={(e) =>
                              setPaqueteFila({
                                ...paqueteFila,
                                ancho: limpiarNumeroNegativo(e.target.value)
                              })
                            }
                            />
                            </td>

                            <td className={tdTabla}>
                            <input 
                            type="number" 
                            min={0}
                            className={`w-20 ${inputTablaBase}`}
                            value={paqueteFila.alto}
                            onChange={(e) =>
                              setPaqueteFila({
                                ...paqueteFila,
                                alto: limpiarNumeroNegativo(e.target.value)
                              })
                            }
                            />
                            </td>

                            <td className={tdTabla}>
                            <input 
                              type="number" 
                              min={0}
                              className={`w-20 ${inputTablaBase}`}
                              value={paqueteFila.dec}
                              onChange={(e) =>
                                setPaqueteFila({
                                  ...paqueteFila,
                                  dec: limpiarNumeroNegativo(e.target.value)
                                })
                              }
                            />
                            </td>

                            <td className={tdTabla}>
                            <input 
                              type="text" 
                              className={`w-44 ${inputTablaBase} ${
                                erroresCampos.contenido ? inputTablaError : ""
                              }`}
                              value={paqueteFila.contenido}
                              onChange={(e) => {
                                setPaqueteFila({ ...paqueteFila, contenido: e.target.value });
                                setErroresCampos(prev => ({ ...prev, contenido: false }));
                              }}
                            />
                            </td>

                            <td className={tdTabla}>
                            <select 
                              className={`w-40 ${selectTablaBase}`}
                              value={paqueteFila.posicion}
                              onChange={(e) => setPaqueteFila({ ...paqueteFila, posicion: e.target.value })}
                            >
                              <option>98.07.20.00.00</option>
                              <option>87.01.10.00.00</option>
                            </select>
                            </td>

                            <td className={tdTabla}>
                              <input 
                                type="text" 
                                className={`w-36 ${inputTablaBase}`}
                                value={paqueteFila.notas}
                                onChange={(e) => setPaqueteFila({ ...paqueteFila, notas: e.target.value })} 
                              />
                            </td>
                        </tr>

                        {filasAdicionales.map((fila, index) => (
                          <tr key={`extra-${index}`} className="bg-white hover:bg-gray-50 transition">
                            
                            <td className="px-2 py-1 text-center">{index + 2}</td>

                            <td className="px-2 py-1 text-center">
                              <button 
                                onClick={() => handleEliminarFila(index)}
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-red-50 hover:scale-105 transition cursor-pointer"
                              >
                                <img src={iconTrash} className="w-5 h-5 inline" />
                              </button>
                            </td>

                            <td className="px-2 py-1">
                              <div className="flex gap-2 items-start">
                                <input 
                                  type="text" 
                                  className={`w-32 ${inputTablaBase}`}
                                  value={fila.tracking}
                                  onChange={(e) => {
                                    const nuevas = [...filasAdicionales];
                                    nuevas[index].tracking = e.target.value;
                                    setFilasAdicionales(nuevas);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trackingAleatorio = generarTrackingAleatorio();
                                    const nuevas = [...filasAdicionales];
                                    nuevas[index].tracking = trackingAleatorio;
                                    setFilasAdicionales(nuevas);
                                  }}
                                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900 text-white hover:bg-red-950 hover:shadow-lg hover:scale-105 transition shadow-md"
                                  title="Generar tracking aleatorio"
                                >
                                  <img src={iconRandom} alt="Generar" className="w-5 h-5" />
                                </button>
                              </div>
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="text" 
                                className={`w-32 ${inputTablaBase}`}
                                value={fila.referencia}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].referencia = e.target.value;
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="number" 
                                className={`w-20 ${inputTablaBase}`}
                                value={fila.lbs}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].lbs = limpiarNumeroNegativo(e.target.value);
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="number" 
                                className={`w-20 ${inputTablaBase}`}
                                value={fila.largo}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].largo = limpiarNumeroNegativo(e.target.value);
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="number" 
                                className={`w-20 ${inputTablaBase}`}
                                value={fila.ancho}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].ancho = limpiarNumeroNegativo(e.target.value);
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="number" 
                                className={`w-20 ${inputTablaBase}`}
                                value={fila.alto}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].alto = limpiarNumeroNegativo(e.target.value);
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="number" 
                                className={`w-20 ${inputTablaBase}`}
                                value={fila.dec}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].dec = limpiarNumeroNegativo(e.target.value);
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="text" 
                                className={`w-44 ${inputTablaBase}`}
                                value={fila.contenido}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].contenido = e.target.value;
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>

                            <td className="px-2 py-1">
                              <select
                                className={`border rounded px-3 py-1 w-40 ${selectTablaBase}`}
                                value={fila.posicion}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].posicion = e.target.value;
                                  setFilasAdicionales(nuevas);
                                }}
                              >
                                <option>98.07.20.00.00</option>
                                <option>87.01.10.00.00</option>
                              </select>
                            </td>

                            <td className="px-2 py-1">
                              <input 
                                type="text" 
                                className={`border rounded px-2 py-1 w-36 ${inputTablaBase}`}
                                value={fila.notas}
                                onChange={(e) => {
                                  const nuevas = [...filasAdicionales];
                                  nuevas[index].notas = e.target.value;
                                  setFilasAdicionales(nuevas);
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-4">

                
                  <button
                    onClick={handleGuardarPaquete}
                    disabled={!modoEdicion && (trackingExistente || referenciaExistente)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition
                    shadow-md ${
                      !modoEdicion && (trackingExistente || referenciaExistente)
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:scale-[1.02]"
                    }`}
                  >
                    <img src={iconSave} alt="Guardar" className="w-5 h-5" />
                    {modoEdicion ? "Guardar Cambios" : "Guardar"}
                  </button>

                 
                  <button
                    onClick={modoEdicion ? handleCancelarEdicion : limpiarFormulario}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm border
                      ${
                        modoEdicion
                          ? "bg-gray-500 text-white hover:bg-gray-600 hover:shadow-md"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                      }`}
                  >
                    <img src={iconCancel} alt="Cancelar" className="w-5 h-5" />
                    {modoEdicion ? "Cancelar Edición" : "Cancelar"}
                  </button>

                </div>
            </div>

            <div className="relative bg-white/95 border border-gray-200 shadow-xl rounded-2xl p-6 overflow-hidden">

              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-gray-300 to-red-900"></div>

              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-600 tracking-wide">
                    BÚSQUEDA DE PAQUETES
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Filtra paquetes por guía, referencia, cliente o rango de fechas
                  </p>
                </div>

                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
                  <span className="w-2 h-2 rounded-full bg-green-900"></span>
                  <span className="text-xs font-semibold text-gray-600">
                    Filtros activos
                  </span>
                </div>
              </div>

              <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 shadow-sm">
                <BusquedaPaquetes
                  filtros={filtrosBusqueda}
                  onChangeFiltros={setFiltrosBusqueda}

                  clientesSugeridos={clientesSugeridos}
                  usuariosSugeridos={usuariosSugeridos}

                  onBuscarCliente={buscarClientesFiltro}
                  onSeleccionarCliente={(cliente) => {
                    setFiltrosBusqueda((prev) => ({
                      ...prev,
                      cliente: cliente.nombre_completo || cliente.nombre || cliente.cliente || "",
                    }));

                    setClientesSugeridos([]);
                  }}

                  onBuscarUsuario={buscarUsuariosFiltro}
                  onSeleccionarUsuario={(usuario) => {
                    setFiltrosBusqueda((prev) => ({
                      ...prev,
                      usuario: usuario.nombre_completo || usuario.nombre || usuario.usuario || "",
                    }));

                    setUsuariosSugeridos([]);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-4">

                <button
                  onClick={handleCancelarBusqueda}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm border bg-white border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400 hover:text-red-700"
                >
                  <img src={iconCancel} alt="Cancelar" className="w-5 h-5" />
                  Cancelar
                </button>

                <button
                  onClick={handleBuscarPaquetes}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md bg-red-900 text-white hover:bg-red-950 hover:shadow-lg hover:scale-[1.02]"
                >
                  <img src={iconSearch} alt="Buscar" className="w-5 h-5" />
                  Buscar
                </button>

              </div>
            </div>
            
            <TablaPaquetesDigitados
              paquetes={
                paquetesFiltrados.length > 0
                  ? paquetesFiltrados
                  : paquetes
              }
              onEditar={handleEditarPaquete}
            />
            </div>
    </UserDashboardLayout>
    );
} 
