import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { cerrarSesionSegura } from "../api/authSession";

const INACTIVITY_LIMIT_MS = 45 * 60 * 1000;

const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/confirmacion",
  "/consulta-hawb",
  "/password-reset",
]);

const hasActiveSession = () =>
  Boolean(
    localStorage.getItem("usuario") ||
      sessionStorage.getItem("usuario") ||
      localStorage.getItem("cliente") ||
      sessionStorage.getItem("cliente")
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

    const expireSession = async () => {
      if (isPublicPath || !hasActiveSession()) return;

      await cerrarSesionSegura();
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
