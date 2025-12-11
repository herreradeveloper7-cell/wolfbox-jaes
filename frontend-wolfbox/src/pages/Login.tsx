import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/LogoJaesCargo.svg";
import Loader from "../components/Loader";

export default function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [stayLoggedIn, setStayLoggedIn] = useState(false);
    const [loginError, setLoginError] = useState(""); 
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const res = await fetch("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, contrasena: password }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 403) {
            setLoginError(data.message || "Usuario inhabilitado");
          } else {
            setLoginError(data.message || "Error al iniciar sesión");
          }
          setLoading(false);
          return;
        }

        setLoginError("");
        const usuario = data.usuario;

        console.log("🧾 Tipo detectado:", usuario.tipo);
        console.log("👤 Datos recibidos:", usuario);

        if (usuario.tipo === "cliente") {
          localStorage.setItem("cliente", JSON.stringify(usuario));
          navigate("/dashboardCliente");

        } else if (usuario.tipo === "admin") {
          localStorage.setItem("usuario", JSON.stringify(usuario));
          navigate("/dashboardUsuario");

        } else {
          setLoginError("⚠️ Tipo de usuario no reconocido");
        }


      } catch (err) {
        console.error("❌ Error al iniciar sesión:", err);
        setLoginError("Error en el servidor");
      } finally {
        setLoading(false);
      }
    };

      
      if (loading) {
        return <Loader />;
      }      
    
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-4">
            <div className="absolute top-6 left-6">
            <svg
                onClick={() => navigate("/")}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-20 h-20 cursor-pointer hover:scale-110  transition"
                
            >
                <title>Volver a Home</title>
                <path
                d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM13.92 16.13H9C8.59 16.13 8.25 15.79 8.25 15.38C8.25 14.97 8.59 14.63 9 14.63H13.92C15.2 14.63 16.25 13.59 16.25 12.3C16.25 11.01 15.21 9.97 13.92 9.97H8.85L9.11 10.23C9.4 10.53 9.4 11 9.1 11.3C8.95 11.45 8.76 11.52 8.57 11.52C8.38 11.52 8.19 11.45 8.04 11.3L6.47 9.72C6.18 9.43 6.18 8.95 6.47 8.66L8.04 7.09C8.33 6.8 8.81 6.8 9.1 7.09C9.39 7.38 9.39 7.86 9.1 8.15L8.77 8.48H13.92C16.03 8.48 17.75 10.2 17.75 12.31C17.75 14.42 16.03 16.13 13.92 16.13Z"
                fill="#82181A"
                />
            </svg>
            </div>


            <img src={logo} alt="Logo de WolfBox" className="mt-4 w-32 h-32 sm:w-36 sm:h-36 md:w-60 md:h-60" />
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg p-6 sm:p-8 bg-white rounded-2xl shadow-lg flex flex-col justify-between min-h-[620px]">
                <h2 className="text-center text-2xl font-semibold mb-10">
                    Inicie sesión para su ingreso
                </h2>

                <form
                onSubmit={handleLogin}
                className="flex flex-col"
                >
                    <input
                    type="email"
                    required
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (loginError) setLoginError("");
                    }}
                    className="w-full border px-3 py-2 mb-3 rounded text-base sm:text-lg"
                    />
                    <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError("");
                    }}
                    className="w-full border px-3 py-2 mb-3 rounded text-base sm:text-lg"
                    />
                    {loginError && (
                        <p className="text-red-600 text-sm mt-1">{loginError}</p>
                    )}

                    <div className="flex items-center mb-8 text-sm">
                    <input
                        id="keepSession"
                        type="checkbox"
                        checked={stayLoggedIn}
                        onChange={(e) => setStayLoggedIn(e.target.checked)}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded cursor-pointer"
                    />
                    <label htmlFor="keepSession" className="ml-3 select-none text-sm sm:text-base text-gray-500 font-semibold">
                        Mantener sesión iniciada
                    </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full bg-red-900 text-white text-lg sm:text-xl py-3 sm:py-4 rounded font-semibold transition
                                  ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-red-950 hover:scale-[1.02] cursor-pointer"}`}
                    >
                      {loading ? "Validando..." : "Iniciar sesión"}
                    </button>
                </form>

                <p className="text-center text-lg text-gray-600 mt-6">
                    ¿Olvido su contraseña?
                </p>

                <button className="w-full bg-red-900 text-white text-lg sm:text-xl py-3 sm:py-4 mt-3 rounded font-semibold transition hover:bg-red-950 hover:scale-[1.02] cursor-pointer"

                >
                    Consultar Estado
                </button>
                <button 
                onClick={() => navigate("/register")}
                className="w-full bg-red-900 text-white text-lg sm:text-xl py-3 sm:py-4 mt-4 rounded font-semibold transition hover:bg-red-950 hover:scale-[1.02] cursor-pointer"
                >
                    Crear cuenta de casillero
                </button>

                <p className="mt-8 text-center text-gray-600 text-sm">
                Copyright © Wolfbox Software 2025
                </p>
            </div>
        </div>
    );
}
