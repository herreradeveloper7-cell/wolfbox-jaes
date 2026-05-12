import axios from "axios";

const DEFAULT_API_URL = "https://api.wolfbox.app/api";

export const API_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

const stripApiPrefix = (url: string) =>
  url.replace(/^\/api(?=\/|$)/, "") || "/";

const getAuthToken = () => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
};

const AUTH_ERROR_MESSAGES = [
  "Token de autenticacion requerido",
  "Token invalido o expirado",
];

const clearStoredSession = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("cliente");
  sessionStorage.removeItem("cliente");
};

const isAuthEndpoint = (url?: string) => Boolean(url?.includes("/auth/login"));

const isAuthErrorPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return false;

  const message = "message" in payload ? String(payload.message) : "";
  const mensaje = "mensaje" in payload ? String(payload.mensaje) : "";

  return AUTH_ERROR_MESSAGES.includes(message) || AUTH_ERROR_MESSAGES.includes(mensaje);
};

const notifySessionExpired = () => {
  clearStoredSession();
  window.dispatchEvent(new Event("wolfbox:session-expired"));
};

const withAuthHeaders = (headers?: HeadersInit) => {
  const nextHeaders = new Headers(headers);
  const token = getAuthToken();

  if (token && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
};

export const apiUrl = (url: string) => {
  if (url.startsWith("/api")) {
    return `${API_URL}${stripApiPrefix(url)}`;
  }

  if (typeof window !== "undefined") {
    const parsedUrl = new URL(url, window.location.origin);

    if (parsedUrl.origin === window.location.origin && parsedUrl.pathname.startsWith("/api")) {
      return `${API_URL}${stripApiPrefix(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`)}`;
    }
  }

  return url;
};

axios.defaults.baseURL = API_URL;

axios.interceptors.request.use((config) => {
  if (typeof config.url === "string") {
    if (config.url.startsWith("/api")) {
      config.url = stripApiPrefix(config.url);
    }
  }

  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url;
    const payload = error?.response?.data;

    if (status === 401 && !isAuthEndpoint(url) && isAuthErrorPayload(payload)) {
      notifySessionExpired();
    }

    return Promise.reject(error);
  }
);

if (typeof window !== "undefined") {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    let response: Response;

    if (typeof input === "string") {
      response = await nativeFetch(apiUrl(input), {
        ...init,
        headers: withAuthHeaders(init?.headers),
      });
    } else if (input instanceof Request) {
      const nextRequest = new Request(apiUrl(input.url), input);

      response = await nativeFetch(nextRequest, {
        ...init,
        headers: withAuthHeaders(init?.headers || nextRequest.headers),
      });
    } else {
      response = await nativeFetch(input, {
        ...init,
        headers: withAuthHeaders(init?.headers),
      });
    }

    const requestUrl = typeof input === "string" ? apiUrl(input) : input instanceof Request ? apiUrl(input.url) : "";

    if (response.status === 401 && !isAuthEndpoint(requestUrl)) {
      try {
        const payload = await response.clone().json();
        if (isAuthErrorPayload(payload)) {
          notifySessionExpired();
        }
      } catch {
        // Ignore non-JSON 401 responses.
      }
    }

    return response;
  };

  const nativeOpen = window.open.bind(window);

  window.open = (url?: string | URL, target?: string, features?: string) => {
    const nextUrl =
      typeof url === "string" ? apiUrl(url) : url instanceof URL ? apiUrl(url.href) : url;

    return nativeOpen(nextUrl, target, features);
  };
}
