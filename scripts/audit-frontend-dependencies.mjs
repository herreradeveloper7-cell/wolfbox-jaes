import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "frontend-wolfbox");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(pnpmCommand, ["audit", "--json"], {
  cwd: frontend,
  encoding: "utf8",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout || "{}");
} catch {
  console.error(result.stdout || result.stderr || "No fue posible leer pnpm audit.");
  process.exit(1);
}

const excepciones = new Set([
  "GHSA-qwww-vcr4-c8h2",
]);
const advisories = Object.values(report.advisories || {});
const noAceptadas = advisories.filter(
  (advisory) => !excepciones.has(advisory.github_advisory_id)
);

if (noAceptadas.length > 0) {
  for (const advisory of noAceptadas) {
    console.error(
      `[${advisory.severity}] ${advisory.module_name}: ${advisory.title} (${advisory.github_advisory_id})`
    );
  }
  process.exit(1);
}

for (const advisory of advisories) {
  console.warn(
    `Excepción documentada: ${advisory.module_name} (${advisory.github_advisory_id})`
  );
}

console.log("Auditoría frontend sin vulnerabilidades no documentadas.");
