SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.usuarios', 'mfa_habilitado') IS NULL
BEGIN
  ALTER TABLE dbo.usuarios
    ADD mfa_habilitado BIT NOT NULL
      CONSTRAINT DF_usuarios_mfa_habilitado DEFAULT (0) WITH VALUES;
END;

IF COL_LENGTH('dbo.usuarios', 'mfa_secreto_cifrado') IS NULL
BEGIN
  ALTER TABLE dbo.usuarios
    ADD mfa_secreto_cifrado NVARCHAR(500) NULL;
END;

IF COL_LENGTH('dbo.usuarios', 'mfa_confirmado_en') IS NULL
BEGIN
  ALTER TABLE dbo.usuarios
    ADD mfa_confirmado_en DATETIME2 NULL;
END;

IF COL_LENGTH('dbo.usuarios', 'mfa_codigos_recuperacion_hash') IS NULL
BEGIN
  ALTER TABLE dbo.usuarios
    ADD mfa_codigos_recuperacion_hash NVARCHAR(MAX) NULL;
END;

IF NOT EXISTS (
  SELECT 1
  FROM sys.check_constraints
  WHERE name = N'CK_usuarios_mfa_consistente'
    AND parent_object_id = OBJECT_ID(N'dbo.usuarios')
)
BEGIN
  ALTER TABLE dbo.usuarios WITH CHECK
    ADD CONSTRAINT CK_usuarios_mfa_consistente CHECK (
      mfa_habilitado = 0
      OR (
        mfa_secreto_cifrado IS NOT NULL
        AND mfa_confirmado_en IS NOT NULL
      )
    );
END;

COMMIT TRANSACTION;

SELECT
  COUNT(*) AS usuarios_internos,
  SUM(CASE WHEN tipo_usuario = 'admin' THEN 1 ELSE 0 END) AS administradores,
  SUM(CASE WHEN mfa_habilitado = 1 THEN 1 ELSE 0 END) AS usuarios_con_mfa
FROM dbo.usuarios;
