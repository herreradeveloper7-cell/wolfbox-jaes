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

if (typeof window !== "undefined") {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string") {
      return nativeFetch(apiUrl(input), {
        ...init,
        headers: withAuthHeaders(init?.headers),
      });
    }

    if (input instanceof Request) {
      const nextRequest = new Request(apiUrl(input.url), input);

      return nativeFetch(nextRequest, {
        ...init,
        headers: withAuthHeaders(init?.headers || nextRequest.headers),
      });
    }

    return nativeFetch(input, {
      ...init,
      headers: withAuthHeaders(init?.headers),
    });
  };

  const nativeOpen = window.open.bind(window);

  window.open = (url?: string | URL, target?: string, features?: string) => {
    const nextUrl =
      typeof url === "string" ? apiUrl(url) : url instanceof URL ? apiUrl(url.href) : url;

    return nativeOpen(nextUrl, target, features);
  };
}
