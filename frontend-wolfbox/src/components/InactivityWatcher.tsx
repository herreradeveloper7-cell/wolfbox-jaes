import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const INACTIVITY_LIMIT_MS = 45 * 60 * 1000;

const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/confirmacion",
  "/consulta-hawb",
  "/password-reset",
]);

const clearStoredSession = () => {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("authToken");
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("usuario");
  localStorage.removeItem("cliente");
  sessionStorage.removeItem("cliente");
};

const hasActiveSession = () =>
  Boolean(
    localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken")
  );

export default function InactivityWatcher() {
  const location = useLocation();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const isPublicPath = publicPaths.has(location.pathname);

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const expireSession = () => {
      if (isPublicPath || !hasActiveSession()) return;

      clearStoredSession();
      window.dispatchEvent(new Event("wolfbox:session-expired"));
    };

    const resetTimer = () => {
      clearTimer();

      if (isPublicPath || !hasActiveSession()) return;

      timerRef.current = window.setTimeout(expireSession, INACTIVITY_LIMIT_MS);
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
      "wheel",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, resetTimer, { passive: true })
    );

    resetTimer();

    return () => {
      clearTimer();
      events.forEach((eventName) =>
        window.removeEventListener(eventName, resetTimer)
      );
    };
  }, [location.pathname]);

  return null;
}
