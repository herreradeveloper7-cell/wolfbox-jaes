# Bitacora de auditoria

La tabla `dbo.auditoria_eventos` es append-only para la identidad de runtime.
La aplicacion registra mutaciones con actor, accion, recurso, request ID, IP,
resultado y snapshots saneados. Nunca deben almacenarse contrasenas, tokens,
cookies, claves, cadenas de conexion ni contenido binario.

## Acceso y retencion

- Runtime: solo `INSERT`.
- Lectura e investigacion: identidad administrativa separada.
- `UPDATE` y `DELETE`: denegados al runtime.
- Retencion recomendada: 365 dias. La depuracion debe ejecutarse como una
  migracion/tarea administrativa aprobada, nunca desde la aplicacion.
- Los eventos fallidos de escritura se identifican en Railway con el prefijo
  `[audit:<request-id>]` y deben generar investigacion operativa.

## Permisos de staging

Ejecutar despues de desplegar y validar la escritura de eventos:

```sql
DENY SELECT, UPDATE, DELETE ON OBJECT::dbo.auditoria_eventos TO [wolfbox_staging_app];
GRANT INSERT ON OBJECT::dbo.auditoria_eventos TO [wolfbox_staging_app];
```

La identidad administrativa `jaesadmin` conserva la lectura para auditorias e
investigaciones. Produccion debe usar su propio usuario runtime en el mismo
patron, sin reutilizar el nombre de staging.
