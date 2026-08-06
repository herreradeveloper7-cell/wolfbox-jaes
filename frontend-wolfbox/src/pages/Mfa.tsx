import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { establecerAccessToken } from "../api/authSession";

type Setup = { secreto: string; uri: string };

export default function MfaPage() {
  const navigate = useNavigate();
  const desafio = sessionStorage.getItem("mfaChallenge") || "";
  const modo = sessionStorage.getItem("mfaMode") || "login";
  const mantener = sessionStorage.getItem("mfaPersist") === "1";
  const [setup, setSetup] = useState<Setup | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(modo === "setup");
  const [recuperacion, setRecuperacion] = useState<string[]>([]);

  useEffect(() => {
    if (!desafio) { navigate("/login", { replace: true }); return; }
    if (modo !== "setup") return;
    fetch("/api/auth/mfa/setup", { headers: { Authorization: `Bearer ${desafio}` } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "No fue posible preparar MFA.");
        setSetup(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [desafio, modo, navigate]);

  const guardarSesion = (data: any) => {
    const storage = mantener ? localStorage : sessionStorage;
    establecerAccessToken(data.token);
    storage.setItem("usuario", JSON.stringify(data.usuario));
    sessionStorage.removeItem("mfaChallenge");
    sessionStorage.removeItem("mfaMode");
    sessionStorage.removeItem("mfaPersist");
  };

  const confirmar = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setCargando(true);
    try {
      const endpoint = modo === "setup" ? "/api/auth/mfa/setup/confirm" : "/api/auth/mfa/verify";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${desafio}` },
        credentials: "include",
        body: JSON.stringify({ codigo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || "Código incorrecto.");
      guardarSesion(data);
      if (data.codigos_recuperacion?.length) setRecuperacion(data.codigos_recuperacion);
      else navigate("/dashboardUsuario", { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : "No fue posible verificar el código."); }
    finally { setCargando(false); }
  };

  if (recuperacion.length) return (
    <main className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <section className="max-w-lg rounded-2xl bg-white p-7 shadow-xl">
        <h1 className="text-2xl font-black text-slate-800">Guarda tus códigos de recuperación</h1>
        <p className="mt-2 text-sm text-slate-600">Cada código funciona una sola vez. Guárdalos fuera del sistema; no volverán a mostrarse.</p>
        <div className="my-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-4 font-mono font-bold">{recuperacion.map((c) => <span key={c}>{c}</span>)}</div>
        <button onClick={() => navigate("/dashboardUsuario", { replace: true })} className="w-full rounded-xl bg-red-900 px-4 py-3 font-bold text-white">Ya los guardé</button>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl">
        <h1 className="text-2xl font-black text-slate-800">{modo === "setup" ? "Protege tu cuenta" : "Verificación en dos pasos"}</h1>
        <p className="mt-2 text-sm text-slate-600">{modo === "setup" ? "Escanea el código con Microsoft Authenticator, Google Authenticator o una aplicación TOTP." : "Ingresa el código de seis dígitos o un código de recuperación."}</p>
        {cargando && !setup ? <p className="mt-6">Preparando configuración…</p> : null}
        {modo === "setup" && setup ? <div className="my-5 text-center"><QRCodeSVG value={setup.uri} size={190} className="mx-auto" /><p className="mt-3 break-all font-mono text-xs text-slate-500">Clave manual: {setup.secreto}</p></div> : null}
        <form onSubmit={confirmar} className="mt-5 space-y-4">
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required autoComplete="one-time-code" placeholder="Código de autenticación" className="w-full rounded-xl border px-4 py-3 text-center font-mono text-lg tracking-widest" />
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <button disabled={cargando} className="w-full rounded-xl bg-red-900 px-4 py-3 font-bold text-white disabled:bg-slate-300">Verificar y continuar</button>
        </form>
      </section>
    </main>
  );
}
