SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.auditoria_eventos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.auditoria_eventos (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_auditoria_eventos PRIMARY KEY,
    request_id NVARCHAR(100) NOT NULL,
    actor_tipo NVARCHAR(30) NOT NULL,
    actor_id INT NULL,
    actor_rol NVARCHAR(50) NULL,
    accion NVARCHAR(80) NOT NULL,
    recurso NVARCHAR(80) NOT NULL,
    recurso_id NVARCHAR(150) NULL,
    metodo NVARCHAR(10) NOT NULL,
    ruta NVARCHAR(500) NOT NULL,
    datos_antes NVARCHAR(MAX) NULL,
    datos_despues NVARCHAR(MAX) NULL,
    cambios_solicitados NVARCHAR(MAX) NULL,
    resultado NVARCHAR(20) NOT NULL,
    status_http INT NOT NULL,
    codigo_error NVARCHAR(100) NULL,
    ip NVARCHAR(64) NULL,
    user_agent NVARCHAR(500) NULL,
    fecha_evento DATETIME2(3) NOT NULL CONSTRAINT DF_auditoria_eventos_fecha DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_auditoria_eventos_resultado CHECK (resultado IN (N'exito', N'fallo')),
    CONSTRAINT CK_auditoria_eventos_json_antes CHECK (datos_antes IS NULL OR ISJSON(datos_antes) = 1),
    CONSTRAINT CK_auditoria_eventos_json_despues CHECK (datos_despues IS NULL OR ISJSON(datos_despues) = 1),
    CONSTRAINT CK_auditoria_eventos_json_cambios CHECK (cambios_solicitados IS NULL OR ISJSON(cambios_solicitados) = 1)
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_eventos_fecha' AND object_id = OBJECT_ID(N'dbo.auditoria_eventos'))
  CREATE INDEX IX_auditoria_eventos_fecha ON dbo.auditoria_eventos(fecha_evento DESC, id DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_eventos_actor' AND object_id = OBJECT_ID(N'dbo.auditoria_eventos'))
  CREATE INDEX IX_auditoria_eventos_actor ON dbo.auditoria_eventos(actor_tipo, actor_id, fecha_evento DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_eventos_recurso' AND object_id = OBJECT_ID(N'dbo.auditoria_eventos'))
  CREATE INDEX IX_auditoria_eventos_recurso ON dbo.auditoria_eventos(recurso, recurso_id, fecha_evento DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_auditoria_eventos_request' AND object_id = OBJECT_ID(N'dbo.auditoria_eventos'))
  CREATE INDEX IX_auditoria_eventos_request ON dbo.auditoria_eventos(request_id);

COMMIT TRANSACTION;
