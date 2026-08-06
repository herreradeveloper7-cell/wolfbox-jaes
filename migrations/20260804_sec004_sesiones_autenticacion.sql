SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.sesiones_autenticacion', N'U') IS NULL
BEGIN
  EXEC(N'
    CREATE TABLE dbo.sesiones_autenticacion (
      id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_sesiones_autenticacion PRIMARY KEY,
      tipo_cuenta NVARCHAR(20) NOT NULL,
      cuenta_id INT NOT NULL,
      refresh_token_hash CHAR(64) NOT NULL,
      expira_en DATETIME2 NOT NULL,
      revocada_en DATETIME2 NULL,
      motivo_revocacion NVARCHAR(100) NULL,
      creada_en DATETIME2 NOT NULL CONSTRAINT DF_sesiones_creada DEFAULT SYSUTCDATETIME(),
      ultima_actividad_en DATETIME2 NOT NULL CONSTRAINT DF_sesiones_actividad DEFAULT SYSUTCDATETIME(),
      ip_creacion NVARCHAR(64) NULL,
      user_agent NVARCHAR(500) NULL,
      CONSTRAINT CK_sesiones_tipo_cuenta CHECK (tipo_cuenta IN (N''usuario'', N''cliente''))
    );

    CREATE UNIQUE INDEX UX_sesiones_refresh_hash
      ON dbo.sesiones_autenticacion(refresh_token_hash);

    CREATE INDEX IX_sesiones_cuenta
      ON dbo.sesiones_autenticacion(tipo_cuenta, cuenta_id, revocada_en, expira_en);
  ');
END;

COMMIT TRANSACTION;

EXEC(N'
  SELECT COUNT(*) AS sesiones_actuales
  FROM dbo.sesiones_autenticacion;
');
