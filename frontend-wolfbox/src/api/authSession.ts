const DEFAULT_API_URL = "https://api.wolfbox.app/api";
const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

let accessToken: string | null = null;
let refreshEnCurso: Promise<string | null> | null = null;

export const obtenerAccessToken = () => accessToken;

export const establecerAccessToken = (token: string | null) => {
  accessToken = token;
};

export const limpiarSesionLocal = () => {
  accessToken = null;
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("cliente");
  sessionStorage.removeItem("cliente");
};

const guardarIdentidadRenovada = (usuario: any) => {
  const storage =
    localStorage.getItem("usuario") || localStorage.getItem("cliente")
      ? localStorage
      : sessionStorage;

  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("cliente");
  sessionStorage.removeItem("cliente");

  storage.setItem(usuario.tipo === "cliente" ? "cliente" : "usuario", JSON.stringify(usuario));
};

export const renovarAccessToken = async () => {
  if (refreshEnCurso) return refreshEnCurso;

  refreshEnCurso = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        limpiarSesionLocal();
        return null;
      }

      const data = await response.json();
      accessToken = data.token;
      guardarIdentidadRenovada(data.usuario);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshEnCurso = null;
    }
  })();

  return refreshEnCurso;
};

export const cerrarSesionSegura = async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    limpiarSesionLocal();
  }
};
