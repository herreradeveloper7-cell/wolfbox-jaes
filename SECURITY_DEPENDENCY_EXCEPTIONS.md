# Excepciones temporales de dependencias

## React Router — GHSA-qwww-vcr4-c8h2

- **Estado:** excepción temporal revisada el 4 de agosto de 2026.
- **Dependencia:** `react-router-dom` / `react-router` 7.18.2.
- **Severidad publicada:** alta.
- **Superficie afectada:** modo RSC y ejecución de acciones de servidor de React Router.
- **Uso en Wolfbox:** la aplicación es una SPA de Vite que utiliza `BrowserRouter`, `Routes` y llamadas directas a la API. No utiliza RSC, framework mode, loaders/actions de servidor ni el servidor RSC de React Router.
- **Explotabilidad actual:** no aplicable al flujo desplegado de Wolfbox según el uso anterior.
- **Limitación:** el advisory declara corregido `>=8.3.0`, pero esa versión todavía no está publicada en npm. No se instalarán versiones experimentales o inexistentes.
- **Compensación:** todas las mutaciones continúan protegidas y autorizadas en la API Node.js; el frontend no ejecuta acciones privilegiadas por sí mismo.
- **Seguimiento:** revisar en cada actualización de dependencias y retirar esta excepción cuando exista una versión estable corregida y compatible.

Esta excepción no autoriza habilitar RSC o acciones de servidor sin una nueva revisión de seguridad.
