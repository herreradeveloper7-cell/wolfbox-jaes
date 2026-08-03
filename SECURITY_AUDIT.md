# Auditoría de seguridad — Wolfbox JAES

**Fecha:** 31 de julio de 2026  
**Alcance:** frontend React/Vite/TypeScript, API Node/Express, acceso a Azure SQL, archivos, dependencias y configuración observable de Vercel/Railway.  
**Método:** revisión estática del repositorio y del historial Git, inventario manual de rutas, revisión de controles de acceso y ejecución no destructiva de pruebas, lint, build y auditorías de dependencias. No se realizaron pruebas intrusivas contra producción ni cambios de código/configuración.

## 1. Resumen ejecutivo

El sistema **no está listo para considerarse seguro en producción** sin corregir primero los hallazgos críticos y altos. La aplicación cuenta con buenas bases: consultas SQL mayoritariamente parametrizadas, TLS validado hacia Azure SQL, Helmet, CORS por lista explícita, contraseñas con bcrypt, validación Zod en gran parte de las rutas, controles de propiedad para solicitudes/destinatarios y transacciones en operaciones sensibles como digitación de paquetes.

La calificación global es **D (riesgo alto)**. El principal riesgo confirmado es que credenciales de Azure SQL estuvieron versionadas en el historial Git. También existe una consulta pública de HAWB que entrega datos operativos y de clientes sin autenticación; los clientes inhabilitados no son bloqueados al iniciar sesión; los JWT pueden conservar permisos por 30 días sin revocación; no hay límite global para endpoints costosos; y hay dependencias con vulnerabilidades altas conocidas.

| Severidad | Cantidad |
|---|---:|
| Crítica | 1 |
| Alta | 8 |
| Media | 10 |
| Baja | 5 |
| Informativa/positiva | 6 |

**Decisión recomendada:** bloquear una promoción a producción hasta cerrar SEC-001, SEC-002, SEC-003, SEC-004 y SEC-005, y verificar externamente Azure, Railway y Vercel.

## 2. Metodología, alcance y limitaciones

Se revisaron `index.js`, `env.js`, `config/`, `middleware/`, `routes/`, `controllers/`, `validators/`, `utils/`, `tests/`, el frontend completo, manifiestos/lockfiles, configuración de Vercel y el historial Git relacionado con archivos de entorno. Se buscaron rutas públicas, IDOR/BOLA, SQL dinámico, secretos, exposición de errores, cargas/descargas, almacenamiento de sesión, controles de abuso y operaciones DDL en ejecución.

No fue posible verificar desde el repositorio: reglas reales del firewall y auditoría de Azure SQL, identidad/privilegios efectivos del usuario SQL, Private Endpoint, backups/PITR, variables y permisos de Railway/Vercel, protección de ramas, WAF/CDN, MFA de operadores, alertas, rotación efectiva de secretos o estado real de producción. Esos puntos se marcan como controles manuales obligatorios.

Comandos ejecutados:

- `pnpm test`: **61/61 pruebas aprobadas**.
- `pnpm run build` en frontend: **aprobado**, con advertencia por chunks mayores a 500 kB.
- `pnpm run lint` en frontend: **falló**, 235 problemas (223 errores y 12 advertencias).
- `pnpm audit --json` backend: **7 avisos** (2 altos, 2 moderados, 3 bajos).
- `pnpm audit --json` frontend: **29 avisos** (11 altos, 15 moderados, 3 bajos).
- El motor local fue Node 24.12.0, mientras el proyecto exige Node 22.x; los resultados deben repetirse en CI con Node 22.

## 3. Hallazgos

| ID | Sev. | Ubicación/evidencia | Descripción e impacto | Escenario de explotación | Recomendación | Esfuerzo |
|---|---|---|---|---|---|---|
| SEC-001 | **Crítica** | Historial Git de `.env`, commits `d2ccc4b6` y `63933ac3`; `.gitignore` actual | Credenciales de Azure SQL reales estuvieron versionadas. Ignorar el archivo hoy no elimina copias históricas, forks, clones o cachés. Compromete confidencialidad, integridad y disponibilidad de todos los datos accesibles por esa cuenta. | Alguien con acceso al repositorio o a un clon antiguo recupera servidor, usuario y contraseña y accede desde una IP permitida o desde infraestructura comprometida. | Rotar inmediatamente contraseña/usuario SQL; revisar logs; reducir privilegios; revocar otras claves históricas; limpiar historial con procedimiento coordinado; habilitar secret scanning y protección de push. | M (urgente) |
| SEC-002 | **Alta** | `routes/paquetes.routes.js:28`; `controllers/paquetes.controller.js:1274-1410` | `GET /api/paquetes/tracking/hawb/:hawb` es público. Devuelve tracking, contenido, peso, tienda, nombre/empresa del cliente, código de referencia, estado, ubicación temporal y paquetes relacionados. | Un atacante prueba/obtiene HAWB de etiquetas o correos y recopila información logística y personal sin cuenta. La ausencia de rate limit facilita enumeración. | Definir explícitamente el dato público mínimo; usar identificador no enumerable o prueba adicional; eliminar nombre/código/tracking/contenido si no son imprescindibles; limitar tasa y monitorizar. | M |
| SEC-003 | **Alta** | `controllers/auth.controller.js:219-244`; `controllers/clientes.controller.js:316-349` | Ambos flujos de login de cliente validan contraseña pero no su estado. Una cuenta suspendida/inhabilitada conserva acceso. | Un cliente bloqueado vuelve a iniciar sesión y consulta o modifica recursos propios, crea prealertas/solicitudes o sube comprobantes. | Aplicar una única política de autenticación de clientes que exija estado activo en ambos endpoints; probar estados y retirar el login duplicado. | S |
| SEC-004 | **Alta** | `utils/auth.helpers.js:1`; `middleware/auth.middleware.js:30,57-70`; frontend `src/api/http.ts:15`; `src/pages/Login.tsx:55` | JWT con vigencia de hasta 30 días se almacena en `localStorage`; permisos/rol viajan embebidos y no se revalidan ni existe revocación. Un XSS, extensión maliciosa o equipo compartido permite secuestrar una sesión durable; cambios de rol o contraseña no invalidan tokens existentes. | Se roba `authToken` del navegador y se reutiliza durante semanas; un usuario conserva permisos eliminados hasta que expire el token. | Access tokens cortos, refresh token rotatorio en cookie `HttpOnly/Secure/SameSite`, versión de sesión/usuario, revocación al cambiar contraseña/estado/permisos y revalidación server-side para acciones críticas. | L |
| SEC-005 | **Alta** | `pnpm audit` en raíz y frontend; `package.json` y lockfiles | Dependencias instaladas contienen vulnerabilidades altas: Multer DoS, PostCSS path traversal, Axios/form-data, brace-expansion y React Router, entre otras. Algunas son de build/SSR o rutas no usadas, pero no hay evaluación documentada por alcance. | Payloads complejos o cargas abortadas agotan recursos; herramientas de desarrollo procesan rutas maliciosas; bibliotecas cliente vulnerables amplían superficie XSS/DoS/proxy. | Actualizar por lotes controlados a versiones corregidas, evaluar cada advisory según uso real, regenerar un único lockfile y añadir SCA obligatorio en CI. | M |
| SEC-006 | **Alta** | `index.js:118-132`; rutas PDF/reportes/búsquedas/catálogos; `index.js:106` | Solo `/api/auth` tiene rate limit y usa memoria local. No hay límites por usuario/IP para registro público, validación de cliente, recuperación, tracking público, PDF, reportes, búsquedas ni `/health/db`. En múltiples réplicas el contador no se comparte. | Automatización de registros, enumeración, envío de correos de recuperación, generación masiva de PDF o consultas DB causan abuso/costo/DoS. | Límites diferenciados por endpoint y usuario/IP en Redis/servicio distribuido, cuotas para exportaciones/PDF/email, timeouts, concurrencia y alertas. Mantener límites defensivos también tras autenticación. | M |
| SEC-007 | **Alta** | `routes/solicitudes.routes.js:40-64`; `routes/conciliacion.routes.js:27-43`; Multer 2.1.1 | Se confía en `file.mimetype`, no en firma/magic bytes; un flujo conserva `originalname`; no hay antivirus/CDR. La versión de Multer tiene advisories DoS. | Archivo camuflado como JPEG/PDF se almacena y luego se sirve; cargas abortadas o campos anidados consumen disco/memoria. | Actualizar Multer; validar firma y parseabilidad; renombrar siempre con UUID/extensión controlada; AV/CDR; almacenar fuera del web root; límites de campos/partes; borrar temporales ante aborto/error. | M |
| SEC-008 | **Alta** | `controllers/auth.controller.js:16`; `controllers/despachos.controller.js:22-57`; `controllers/prealertas.controller.js:3`; `controllers/catalogos/servicios.controller.js:12-31`; otros `asegurarTabla*` | La aplicación crea/altera tablas durante requests. Esto implica que la identidad SQL de runtime probablemente tiene DDL, amplificando cualquier compromiso y generando carreras/esquema no reproducible. | Una vulnerabilidad futura con ejecución SQL hereda permisos para alterar el esquema o destruir controles; dos réplicas ejecutan cambios simultáneos. | Migraciones versionadas y ejecutadas por identidad separada; usuario runtime con mínimo privilegio CRUD/EXECUTE; retirar DDL de controladores. | L |
| SEC-009 | **Alta** | Cambios de usuarios, tarifas, TRM, autorizaciones, pagos, estados y anulaciones; solo `console.*`/notificaciones | No existe un registro de auditoría central, inmutable y consistente con actor, acción, recurso, antes/después, IP, request ID y resultado. Las notificaciones funcionales no sustituyen auditoría. | Un administrador modifica tarifas o elimina una solicitud/estado y no puede atribuirse ni reconstruirse con certeza. | Tabla/servicio append-only de auditoría, eventos estructurados, protección contra alteración, retención, alertas y acceso segregado. | L |
| SEC-010 | **Media** | `validators/api.schemas.js:45-82`; `controllers/auth.controller.js:381` | Política de contraseña débil/inconsistente: creación usa solo cadena no vacía y reset exige 6 caracteres. No se observa detección de contraseñas comprometidas ni MFA para administradores. | Password spraying o reutilización compromete cuentas privilegiadas. | Longitud mínima moderna (p. ej. 12), permitir gestores/frases, bloquear contraseñas comprometidas, rate limit específico y MFA obligatorio para administradores. | M |
| SEC-011 | **Media** | `controllers/auth.controller.js:390-445` | Confirmación de reset actualiza contraseña y marca token usado en operaciones separadas, sin transacción/bloqueo; no invalida sesiones existentes. | Requests concurrentes reutilizan el token o una sesión robada sigue activa tras recuperación. | Transacción serializable/actualización condicional atómica del token; invalidar sesiones; notificar cambio; pruebas de carrera. | M |
| SEC-012 | **Media** | `middleware/auth.middleware.js:57-70`; `utils/auth.helpers.js:13-18` | Autorización por permisos confía en claims emitidos al login. No hay control server-side actualizado para acciones sensibles ni separación fina dentro de varios módulos operativos. | Un token antiguo conserva `Casilleros`, `Configuración`, `Seguridad` o `Reportes`; usuarios internos ven todos los registros del módulo. | Resolver permisos vigentes en caché de corta duración/DB y diseñar matriz RBAC/ABAC por acción y ámbito (oficina/cliente/recurso). | L |
| SEC-013 | **Media** | `validators/api.schemas.js` (uso general de `.passthrough()`); `routes/auth.routes.js` sin `validar` | Muchos esquemas aceptan campos desconocidos y varias cadenas no tienen máximo; login/reset/registro interno no pasan por schemas uniformes. Aunque los controladores suelen desestructurar, aumenta riesgo de mass assignment futuro, payloads grandes y reglas inconsistentes. | Se envían propiedades inesperadas o strings enormes que alcanzan logs, correo o DB y provocan errores/abuso. | `.strict()` o stripping explícito, máximos por dominio, esquemas para todas las rutas, validación de headers/content-type y pruebas negativas. | M |
| SEC-014 | **Media** | `controllers/clientes.controller.js:150,305,364,569,667`; promociones/plantillas | Algunas respuestas 500 devuelven `error.message`, que puede revelar nombres de tablas/columnas, restricciones, proveedores o rutas. | Un atacante fuerza errores de SQL/storage/email y usa detalles internos para reconocimiento. | Manejador global de errores con códigos públicos; detalle solo en log estructurado y redacción de secretos/PII. | S |
| SEC-015 | **Media** | `frontend-wolfbox/vercel.json` | Vercel solo define rewrite SPA. No se declaran CSP, HSTS, Permissions-Policy, Referrer-Policy ni políticas explícitas de framing/cache para HTML. Helmet solo protege la API. | Un XSS o inclusión de recurso externo tiene mayor impacto; clickjacking o filtración de referrer depende de defaults del proveedor. | Añadir headers en Vercel, comenzando CSP en report-only y luego enforcement; `frame-ancestors`, HSTS, nosniff, referrer y permisos mínimos. | M |
| SEC-016 | **Media** | `index.js:96-103` | `/version` público expone SHA/versión, ID de deployment y nombre de entorno. Facilita fingerprinting y correlación de despliegues. | Atacante identifica commit/entorno vulnerable y cronometra ataques tras cambios. | Exponer solo un identificador opaco o restringir el detalle a observabilidad autenticada. | S |
| SEC-017 | **Media** | Repositorio sin workflows `.github`; lint actual fallido | No hay CI versionado que exija test, build, lint, SCA, secret scanning y análisis estático. El lint no podría actuar como puerta por 223 errores existentes. | Cambios inseguros llegan a staging/producción sin controles reproducibles. | Baseline y saneamiento de lint; pipeline con Node 22, lockfile congelado, tests, build, lint, SAST/SCA/secret scan y artefacto promovible. | M |
| SEC-018 | **Media** | Raíz y frontend contienen `package-lock.json` y `pnpm-lock.yaml`; Railway usa pnpm | Dos gestores/lockfiles permiten árboles distintos local/CI/Railway y ocultan qué auditoría representa el artefacto real. | Un desarrollador actualiza solo un lockfile; producción instala otra versión, incluida una vulnerable. | Estandarizar pnpm, eliminar lockfiles ajenos mediante cambio controlado y verificar `--frozen-lockfile` en CI. | S |
| SEC-019 | **Media** | Configuración externa no versionada; Azure SQL/Railway/Vercel | Backup, PITR, restauraciones probadas, retención, geo-redundancia, alertas, MFA y separación real staging/prod no son demostrables. La ausencia de evidencia es un riesgo de recuperación y gobierno. | Borrado lógico, ransomware o despliegue defectuoso no puede restaurarse dentro del RPO/RTO esperado. | Ejecutar checklist manual de sección 8, documentar RPO/RTO y realizar simulacro de restauración. | M |
| SEC-020 | **Baja** | `middleware/auth.middleware.js:30,113` | JWT no fija explícitamente algoritmo permitido, issuer ni audience. La biblioteca rechaza ataques clásicos conocidos, pero falta acotar el contexto criptográfico. | Token válido para otro consumidor/entorno se acepta si comparte secreto y estructura. | Fijar `algorithms`, `issuer`, `audience`, `subject/jti`; secretos distintos por entorno y rotación con `kid`. | S |
| SEC-021 | **Baja** | `index.js:70-87`; múltiples `console.error` | Logs no tienen request/correlation ID, formato JSON, actor consistente ni redacción central. Complica detección e investigación. | Actividad distribuida entre réplicas no puede correlacionarse y PII puede terminar en logs de errores. | Logger estructurado, request ID, redacción, niveles/retención y exportación a SIEM/Application Insights. | M |
| SEC-022 | **Baja** | `index.js` termina en `app.listen` | No hay handlers observables de SIGTERM/SIGINT para dejar de aceptar tráfico, drenar servidor y cerrar pool SQL. | Railway reemplaza contenedor durante una transacción/carga y genera errores o trabajo parcial. | Apagado ordenado con timeout, readiness separado de liveness y cierre de recursos. | S |
| SEC-023 | **Baja** | `index.js:106-116` | `/health/db` es público y realiza consulta real, revela latencia y puede amplificar carga; se solapa con SEC-006. | Sondeo frecuente mantiene/consume conexiones y permite inferir degradación de DB. | Readiness interno/restringido; cache/timeout; health público superficial sin latencia ni dependencia profunda. | S |
| SEC-024 | **Baja** | Build frontend | Bundle principal minificado ~1.56 MB y ExcelJS ~940 kB; no es una vulnerabilidad directa, pero aumenta superficie cliente y tiempo de análisis/carga. | Clientes lentos permanecen más tiempo en estados parciales y se distribuye código no necesario a todas las sesiones. | Code splitting por rol/ruta, carga diferida de PDF/Excel y budgets de bundle en CI. | M |

### Controles positivos observados

- SQL se construye mayoritariamente con parámetros `mssql`; los fragmentos dinámicos revisados proceden de listas/constantes controladas. No se confirmó una inyección SQL explotable.
- Azure SQL usa `encrypt: true` y `trustServerCertificate: false`.
- Helmet está activo, `x-powered-by` deshabilitado y CORS compara orígenes exactos configurados.
- Bcrypt se usa para hashing/verificación; reset almacena hash SHA-256 del token, con expiración y uso único previsto.
- Solicitudes y destinatarios aplican comprobaciones de propiedad para clientes; los clientes se restringen a su código de casillero.
- La digitación de paquetes comprueba tracking duplicado dentro de transacción con bloqueo y elimina la prealerta coincidente dentro de la misma transacción; existen pruebas para el duplicado.

## 4. Hallazgos críticos y acciones inmediatas

### SEC-001 — secretos históricos

Tratar las credenciales históricas como comprometidas, aunque el repositorio sea privado. Orden seguro: inventariar accesos y dependencias; crear credencial nueva de mínimo privilegio; desplegarla; verificar; revocar la anterior; investigar conexiones; después reescribir historial y exigir reclonado. La limpieza del historial **no reemplaza** la rotación.

### Bloqueadores altos de producción

1. Proteger/minimizar el tracking público (SEC-002).
2. Bloquear clientes no activos en ambos logins (SEC-003).
3. Diseñar revocación y reducir vida de sesión (SEC-004).
4. Corregir dependencias altas, empezando Multer/runtime (SEC-005/007).
5. Aplicar límites distribuidos a rutas públicas y costosas (SEC-006).
6. Separar identidad de migraciones y runtime SQL (SEC-008).
7. Auditar cambios críticos de negocio (SEC-009).

## 5. Matriz OWASP Top 10 (2021)

| Categoría | Estado | Evidencia principal |
|---|---|---|
| A01 Broken Access Control | **Alto** | Tracking público; login de clientes inhabilitados; permisos JWT obsoletos. |
| A02 Cryptographic Failures | **Crítico** | Credenciales SQL en historial; JWT largo en Web Storage. TLS a DB es correcto. |
| A03 Injection | **Bajo/medio** | Parametrización SQL sólida; falta endurecer longitudes/errores y validar archivos/contenido. |
| A04 Insecure Design | **Alto** | Sin revocación, rate limits integrales, auditoría ni separación de migraciones. |
| A05 Security Misconfiguration | **Alto** | Headers frontend incompletos, endpoint de versión/DB público, configuración cloud no demostrada. |
| A06 Vulnerable and Outdated Components | **Alto** | 2 altas backend y 11 altas frontend reportadas por pnpm audit. |
| A07 Identification and Authentication Failures | **Alto** | Estado de cliente ignorado, política débil, sin MFA, sesiones largas/no revocables. |
| A08 Software and Data Integrity Failures | **Medio** | Sin CI/SCA/secret gate, lockfiles duplicados, DDL desde runtime. |
| A09 Security Logging and Monitoring Failures | **Alto** | Sin audit trail ni logging correlacionado/alertas demostrables. |
| A10 SSRF | **Sin evidencia explotable** | No se encontró fetch genérico controlado por usuario; revisar integraciones futuras y URLs de storage/email. |

## 6. Inventario de endpoints y autorización

Se identificaron aproximadamente **82 endpoints de API**, además de cuatro endpoints base/health. La tabla agrupa su política observable; debe convertirse en contrato OpenAPI y prueba automatizada por endpoint.

| Módulo/base | Acceso observado | Riesgo/notas |
|---|---|---|
| `/`, `/health` | Público | Respuesta mínima aceptable. |
| `/version`, `/health/db` | Público | Fingerprinting/consulta DB; restringir detalle. |
| `/api/auth/login`, reset request/confirm | Público + limiter compartido | Falta esquema uniforme; separar límites por operación/identidad. |
| `/api/auth/registro` | Admin | Correcto en ruta; validar payload/política. |
| `/api/clientes/validar`, `/`, `/login` | Público + limiters locales | Registro/login público intencional; estado no validado. |
| `/api/clientes/*` restantes | JWT + rol/permiso/propiedad | Perfil propio protegido; operaciones administrativas por Casilleros/Reportes. |
| `/api/paquetes/tracking/hawb/:hawb` | **Público** | Devuelve más datos de los necesarios (SEC-002). |
| `/api/paquetes/tracking/mio/:hawb` | Cliente + filtro de propiedad en controlador | Correcto; comparte controlador con modo público. |
| `/api/paquetes/*` restantes | Admin/usuario y permisos | Operación interna; reportes por permiso. |
| `/api/solicitudes/crear,listar,detalle,pdf,pdf-data,cargos,comprobante` | JWT; cliente propio o Casilleros | Buen guard de propiedad. Verificar cada nueva ruta con pruebas. |
| Mutaciones internas de solicitudes/agrupar/etiqueta/cargos | Permiso Casilleros | Permiso funcional, no ámbito por oficina. |
| `/api/destinatarios/*` | JWT + Casilleros o cliente propio | Control de propiedad explícito. |
| `/api/prealertas/*` | JWT; cliente propio/admin; usuario con Casilleros para consulta/creación | Usuario interno no modifica/elimina; revisar si es intención. |
| `/api/guias`, `/api/dashboard`, `/api/notificaciones` | Admin/usuario | Sin clientes; autorización amplia entre usuarios internos. |
| `/api/usuarios/*` | Seguridad o rol operativo según ruta | Búsqueda/select accesible a operación; revisar minimización de campos. |
| `/api/servicios`, `/api/trm`, `/api/config` | JWT; lectura amplia y mutación por Configuración/admin | Fuente server-side de tarifas; cambios requieren auditoría. |
| `/api/cargos`, `/api/agrupaciones`, `/api/conciliacion`, `/api/despachos` | Admin/usuario con rol/permiso | No hay scope por oficina; cargas requieren endurecimiento. |
| `/api/transportadoras`, `/api/plantillas-comunicacion` | Configuración | Plantillas HTML/email son contenido sensible; registrar cambios. |
| `/api/promociones/activas` | Cualquier autenticado; CRUD admin | Carga en memoria con límites; validar contenido real. |
| `/api/oficinas`, países, regiones, ciudades | Público | Catálogos públicos razonables; rate limit/cache recomendado. |

Casos IDOR probados/revisados positivamente: perfil de cliente, paquetes por referencia, solicitudes por ID/PDF/comprobante, destinatarios y prealertas. Caso de exposición directa confirmado: HAWB público. No se ejecutó fuzzing dinámico; debe añadirse una matriz con dos usuarios del mismo rol intentando acceder mutuamente a cada recurso.

## 7. Archivos, secretos, dependencias y datos

### Secretos

El `.env` actual está ignorado y `.env.example` no contiene secretos. `frontend-wolfbox/.env.production` versionado contiene únicamente una URL pública de API, apropiada para una variable `VITE_*`. Sin embargo, el historial conserva credenciales SQL reales (SEC-001). La clave JWT y Brevo locales no se imprimieron ni compararon contra servicios externos; deben rotarse si alguna vez estuvieron compartidas fuera del gestor de secretos.

### Archivos

Los comprobantes aceptan tamaños máximos de 8 MB y tipos MIME acotados; promociones 2 MB. Esto es positivo, pero MIME proviene del cliente. Azure Blob con SAS temporal es preferible al disco efímero, siempre que el contenedor sea privado, el SAS tenga solo lectura, TTL corto y no se registren URLs completas. Verificar que `uploads/` no pueda servirse estáticamente por proxy y añadirlo a `.gitignore` aunque hoy no haya archivos rastreados.

### Dependencias

Los conteos de `pnpm audit` reflejan el lockfile instalado el 31-07-2026. No todos los avisos frontend son explotables en el navegador (varios afectan tooling, SSR o adaptadores Node), pero las altas deben cerrarse o aceptarse formalmente con evidencia. Prioridad: Multer, Axios/form-data, React Router, PostCSS y árboles de ExcelJS/brace-expansion.

## 8. Verificaciones manuales de infraestructura

### Azure SQL

- Confirmar que la credencial histórica fue rotada y revisar auditoría de inicio de sesión desde su primera exposición.
- Usuario runtime sin `db_owner`, `db_ddladmin`, `ALTER`, `CREATE TABLE` ni acceso a `master`; identidad de migración separada.
- Preferir Managed Identity/Entra ID; secretos en Key Vault con rotación.
- Firewall con IPs exactas vigentes; retirar IPs residenciales/antiguas y duplicadas. Preferir Private Endpoint cuando sea viable.
- Defender for SQL, auditing y diagnostic settings hacia Log Analytics/Storage inmutable; alertas de anomalía.
- TLS mínimo 1.2, cifrado en reposo, TDE; clasificación y enmascaramiento donde aplique.
- PITR/retención, geo-backup según RPO/RTO y restauración probada trimestralmente.

### Railway

- Variables separadas por environment, sin referencias compartidas staging/prod; acceso por mínimo privilegio y MFA/SSO.
- Confirmar branch deploy (`feature/developer` solo staging), aprobación para producción y rollback probado.
- Health/readiness, límites CPU/memoria, al menos dos réplicas si el SLA lo exige y store distribuido para rate limiting.
- Logs con retención, redacción, alertas y sin secretos/SAS/tokens. Rotar variables sensibles tras SEC-001.
- Fijar builder/runtime, Node 22 y pnpm; promover la misma imagen, no reconstruir con dependencias distintas.

### Vercel

- Dominios y aliases separados por entorno; variables `VITE_*` solo públicas.
- Headers de SEC-015, deployment protection para previews y acceso restringido a logs/proyecto.
- Protección de rama de producción, previews sin indexación, TLS/HSTS y CSP monitorizada.
- Verificar que source maps no sean públicos y que no se desplieguen `.env`, mapas internos ni archivos de desarrollo.

### Gobierno y recuperación

- MFA para GitHub/Azure/Railway/Vercel/Brevo; inventario de propietarios y cuentas de emergencia.
- Branch protection, revisiones obligatorias, commits firmados opcionales y CODEOWNERS para auth/infra/migraciones.
- RPO/RTO aprobados; runbook de incidente, rotación, restauración y comunicación; simulacro documentado.

## 9. Plan de remediación por fases

### Fase 0 — 0 a 24 horas

1. Rotar credenciales SQL históricas y revisar actividad.
2. Restringir o minimizar endpoint público HAWB y aplicarle rate limit.
3. Confirmar firewall/variables y separar staging/producción.
4. Bloquear login de clientes no activos.

### Fase 1 — 2 a 7 días

1. Actualizar dependencias altas, especialmente Multer, y endurecer archivos.
2. Rate limiting distribuido y cuotas en rutas públicas/costosas.
3. Errores públicos uniformes y logging estructurado con request ID.
4. Política de contraseñas, reset atómico e invalidación de sesiones.
5. CI mínimo con test/build/lint/SCA/secret scan; normalizar lockfiles.

### Fase 2 — 2 a 4 semanas

1. Sesiones con access/refresh rotatorio y revocación; MFA admin.
2. Migraciones versionadas y usuario SQL de mínimo privilegio.
3. Audit trail de negocio y matriz RBAC/ABAC por oficina/recurso.
4. CSP/headers frontend y revisión completa de contenido activo/email.
5. Backups, restauración y observabilidad verificadas.

### Fase 3 — 1 a 3 meses

1. Threat model y clasificación de datos.
2. DAST autenticado, pentest independiente y pruebas BOLA por rol.
3. Private networking/Managed Identity donde sea viable.
4. Programa periódico de parches, tabletop de incidentes y métricas de seguridad.

## 10. Pruebas recomendadas y veredicto

Añadir pruebas automatizadas para:

- Cada endpoint con: sin token, token inválido/expirado, rol equivocado, permiso retirado y acceso cruzado entre dos clientes/dos usuarios internos.
- Cliente activo/inactivo/inhabilitado en ambos logins; invalidación tras cambio de contraseña/estado/permisos.
- HAWB inexistente, ajeno, padre/hijo y enumeración/rate limit; verificar minimización de respuesta pública.
- Reset concurrente, expirado, usado, alterado y reutilizado; sesión anterior revocada.
- Upload con magic bytes inválidos, polyglot, nombre traversal/Unicode, campos anidados, archivo abortado, exceso de tamaño/partes y malware de prueba EICAR en entorno aislado.
- SQL injection en todos los filtros y IDs, cadenas máximas/Unicode, JSON desconocido, números extremos y contaminación de prototipo.
- CORS preflight con orígenes permitidos/no permitidos, `Origin: null`, subdominios engañosos y headers no esperados.
- Rate limit en múltiples réplicas, carga de PDF/reportes/email/health DB, timeouts y circuit breakers.
- Headers CSP/HSTS/referrer/frame; verificación de ausencia de source maps/secretos en artefactos.
- Restauración real de Azure SQL y rollback de Railway/Vercel con medición de RPO/RTO.

### Veredicto final

**No aprobar producción todavía.** La arquitectura es recuperable y tiene controles técnicos valiosos, pero la exposición histórica de credenciales y los fallos altos de acceso/sesión/abuso impiden una aprobación responsable. Tras cerrar los bloqueadores, repetir auditoría estática, SCA con Node 22, pruebas dinámicas autenticadas y verificación manual cloud antes de emitir aceptación de riesgo.

---

**Nota de integridad:** esta fase fue exclusivamente de diagnóstico. No se modificó código, base de datos, variables, infraestructura ni dependencias; solo se creó este documento.
