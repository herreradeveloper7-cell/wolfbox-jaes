SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.clientes', 'estado') IS NULL
BEGIN
  EXEC(N'
    ALTER TABLE dbo.clientes
      ADD estado NVARCHAR(20) NOT NULL
        CONSTRAINT DF_clientes_estado DEFAULT N''activo'' WITH VALUES;
  ');
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = N'CK_clientes_estado'
    AND parent_object_id = OBJECT_ID(N'dbo.clientes')
)
BEGIN
  EXEC(N'
    ALTER TABLE dbo.clientes WITH CHECK
      ADD CONSTRAINT CK_clientes_estado
      CHECK (estado IN (N''activo'', N''inactivo'', N''inhabilitado''));
  ');
END;

COMMIT TRANSACTION;

EXEC(N'
  SELECT estado, COUNT(*) AS cantidad
  FROM dbo.clientes
  GROUP BY estado;
');
