import { obtenerRequisitosPassword } from "../utils/passwordPolicy";

export default function PasswordRequirements({ password }: { password: string }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-slate-50/80 px-3 py-2.5">
      <p className="mb-1.5 text-xs font-bold text-slate-600">La contraseña debe cumplir:</p>
      <ul className="space-y-1" aria-live="polite">
        {obtenerRequisitosPassword(password).map((requisito) => (
          <li
            key={requisito.texto}
            className={`flex items-center gap-2 text-xs font-semibold ${
              requisito.cumple
                ? "text-emerald-700"
                : password
                  ? "text-red-600"
                  : "text-slate-500"
            }`}
          >
            <span aria-hidden="true">{requisito.cumple ? "✓" : "○"}</span>
            {requisito.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
