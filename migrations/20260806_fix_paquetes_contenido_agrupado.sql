SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.paquetes', N'contenido') IS NULL
BEGIN
  THROW 51000, 'No existe la columna dbo.paquetes.contenido.', 1;
END;

DECLARE @tipo_actual SYSNAME;
DECLARE @longitud_actual SMALLINT;
DECLARE @permite_null BIT;

SELECT
  @tipo_actual = tipos.name,
  @longitud_actual = columnas.max_length,
  @permite_null = columnas.is_nullable
FROM sys.columns AS columnas
INNER JOIN sys.types AS tipos
  ON tipos.user_type_id = columnas.user_type_id
WHERE columnas.object_id = OBJECT_ID(N'dbo.paquetes')
  AND columnas.name = N'contenido';

IF @tipo_actual <> N'nvarchar' OR @longitud_actual <> -1
BEGIN
  DECLARE @sql NVARCHAR(MAX) = N'
    ALTER TABLE dbo.paquetes
    ALTER COLUMN contenido NVARCHAR(MAX) ' +
    CASE WHEN @permite_null = 1 THEN N'NULL;' ELSE N'NOT NULL;' END;

  EXEC sys.sp_executesql @sql;
END;

COMMIT TRANSACTION;

SELECT
  columnas.name AS columna,
  tipos.name AS tipo,
  CASE
    WHEN columnas.max_length = -1 THEN N'MAX'
    ELSE CONVERT(NVARCHAR(20), columnas.max_length / 2)
  END AS longitud,
  columnas.is_nullable
FROM sys.columns AS columnas
INNER JOIN sys.types AS tipos
  ON tipos.user_type_id = columnas.user_type_id
WHERE columnas.object_id = OBJECT_ID(N'dbo.paquetes')
  AND columnas.name = N'contenido';
