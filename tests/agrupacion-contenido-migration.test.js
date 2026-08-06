import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("la migracion de agrupacion amplia paquetes.contenido sin truncarlo", () => {
  const sql = readFileSync(
    new URL("../migrations/20260806_fix_paquetes_contenido_agrupado.sql", import.meta.url),
    "utf8"
  );

  assert.match(sql, /ALTER\s+COLUMN\s+contenido\s+NVARCHAR\(MAX\)/i);
  assert.match(sql, /COL_LENGTH\(N'dbo\.paquetes',\s*N'contenido'\)/i);
  assert.doesNotMatch(sql, /LEFT\s*\(|SUBSTRING\s*\(/i);
});

test("la agrupacion envia al padre el contenido completo como NVARCHAR MAX", () => {
  const fuente = readFileSync(
    new URL("../controllers/solicitudes.controller.js", import.meta.url),
    "utf8"
  );

  assert.match(fuente, /hijos\.map\(p=>p\.contenido\)\.filter\(Boolean\)\.join\(", "\)/);
  assert.match(fuente, /input\("contenido",\s*sql\.NVarChar\(sql\.MAX\),\s*contenido\)/);
});
