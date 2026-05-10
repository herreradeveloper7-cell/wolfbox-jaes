import axios from "axios";

const DEFAULT_API_URL = "https://api.wolfbox.app/api";

export const API_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

const stripApiPrefix = (url: string) =>
  url.replace(/^\/api(?=\/|$)/, "") || "/";

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

  return config;
});

if (typeof window !== "undefined") {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string") {
      return nativeFetch(apiUrl(input), init);
    }

    if (input instanceof Request) {
      return nativeFetch(new Request(apiUrl(input.url), input), init);
    }

    return nativeFetch(input, init);
  };

  const nativeOpen = window.open.bind(window);

  window.open = (url?: string | URL, target?: string, features?: string) => {
    const nextUrl =
      typeof url === "string" ? apiUrl(url) : url instanceof URL ? apiUrl(url.href) : url;

    return nativeOpen(nextUrl, target, features);
  };
}
