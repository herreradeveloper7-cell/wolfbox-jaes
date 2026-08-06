SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.password_reset_tokens', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.password_reset_tokens (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tipo_cuenta NVARCHAR(30) NOT NULL,
    cuenta_id INT NOT NULL,
    email NVARCHAR(180) NOT NULL,
    token_hash NVARCHAR(128) NOT NULL,
    expira_en DATETIME2 NOT NULL,
    usado BIT NOT NULL CONSTRAINT DF_password_reset_usado DEFAULT 0,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_password_reset_fecha DEFAULT SYSUTCDATETIME(),
    fecha_uso DATETIME2 NULL
  );
END;

IF OBJECT_ID(N'dbo.plantillas_comunicacion', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.plantillas_comunicacion (
    id INT IDENTITY(1,1) PRIMARY KEY,
    clave_evento NVARCHAR(120) NULL,
    nombre NVARCHAR(150) NOT NULL,
    email_remitente NVARCHAR(180) NOT NULL,
    asunto NVARCHAR(250) NOT NULL,
    cuerpo NVARCHAR(MAX) NOT NULL,
    activo BIT NOT NULL CONSTRAINT DF_plantillas_activo DEFAULT 1,
    creado_por NVARCHAR(150) NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_plantillas_fecha DEFAULT SYSUTCDATETIME(),
    fecha_actualizacion DATETIME2 NULL
  );
END;
IF COL_LENGTH(N'dbo.plantillas_comunicacion', N'clave_evento') IS NULL
  ALTER TABLE dbo.plantillas_comunicacion ADD clave_evento NVARCHAR(120) NULL;

IF OBJECT_ID(N'dbo.email_logs', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.email_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    plantilla_id INT NULL,
    evento NVARCHAR(120) NULL,
    destinatario NVARCHAR(180) NOT NULL,
    asunto NVARCHAR(250) NOT NULL,
    proveedor NVARCHAR(80) NOT NULL CONSTRAINT DF_email_logs_proveedor DEFAULT N'brevo',
    estado NVARCHAR(30) NOT NULL,
    message_id NVARCHAR(180) NULL,
    error NVARCHAR(MAX) NULL,
    fecha_envio DATETIME2 NOT NULL CONSTRAINT DF_email_logs_fecha DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID(N'dbo.notificaciones', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.notificaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo NVARCHAR(60) NOT NULL CONSTRAINT DF_notificaciones_tipo DEFAULT N'info',
    titulo NVARCHAR(180) NOT NULL,
    mensaje NVARCHAR(600) NOT NULL,
    entidad_tipo NVARCHAR(80) NULL,
    entidad_id INT NULL,
    url NVARCHAR(250) NULL,
    leida BIT NOT NULL CONSTRAINT DF_notificaciones_leida DEFAULT 0,
    archivada BIT NOT NULL CONSTRAINT DF_notificaciones_archivada DEFAULT 0,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_notificaciones_fecha DEFAULT SYSUTCDATETIME(),
    fecha_lectura DATETIME2 NULL
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_notificaciones_usuario_fecha' AND object_id = OBJECT_ID(N'dbo.notificaciones'))
  CREATE INDEX IX_notificaciones_usuario_fecha ON dbo.notificaciones(usuario_id, archivada, fecha_creacion DESC);

IF OBJECT_ID(N'dbo.servicio_tarifas_rangos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.servicio_tarifas_rangos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    servicio_id INT NOT NULL,
    peso_desde DECIMAL(10,2) NOT NULL,
    peso_hasta DECIMAL(10,2) NOT NULL,
    valor_usd DECIMAL(10,2) NOT NULL,
    orden INT NOT NULL CONSTRAINT DF_servicio_tarifas_rangos_orden DEFAULT 0,
    CONSTRAINT FK_servicio_tarifas_rangos_servicio FOREIGN KEY (servicio_id) REFERENCES dbo.servicios(id) ON DELETE CASCADE,
    CONSTRAINT CK_servicio_tarifas_rangos_pesos CHECK (peso_desde >= 0 AND peso_hasta > peso_desde),
    CONSTRAINT CK_servicio_tarifas_rangos_valor CHECK (valor_usd > 0)
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_servicio_tarifas_rangos_servicio' AND object_id = OBJECT_ID(N'dbo.servicio_tarifas_rangos'))
  CREATE INDEX IX_servicio_tarifas_rangos_servicio ON dbo.servicio_tarifas_rangos(servicio_id, orden, peso_desde);
IF COL_LENGTH(N'dbo.solicitudes', N'flete_usd') IS NULL
  ALTER TABLE dbo.solicitudes ADD flete_usd DECIMAL(10,2) NULL;
IF COL_LENGTH(N'dbo.solicitudes', N'seguro_usd') IS NULL
  ALTER TABLE dbo.solicitudes ADD seguro_usd DECIMAL(10,2) NULL;

IF OBJECT_ID(N'dbo.despachos', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.despachos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(40) NOT NULL,
    nombre NVARCHAR(120) NULL,
    observaciones NVARCHAR(500) NULL,
    oficina_id INT NULL,
    oficina NVARCHAR(120) NULL,
    transportadora_id INT NULL,
    transportadora_nombre NVARCHAR(150) NULL,
    fecha_operativa NVARCHAR(30) NULL,
    estado NVARCHAR(20) NOT NULL CONSTRAINT DF_despachos_estado DEFAULT N'abierto',
    creado_por NVARCHAR(120) NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_despachos_fecha DEFAULT SYSUTCDATETIME(),
    fecha_cierre DATETIME2 NULL,
    actualizado_en DATETIME2 NULL
  );
END;
IF COL_LENGTH(N'dbo.despachos', N'oficina') IS NULL ALTER TABLE dbo.despachos ADD oficina NVARCHAR(120) NULL;
IF COL_LENGTH(N'dbo.despachos', N'oficina_id') IS NULL ALTER TABLE dbo.despachos ADD oficina_id INT NULL;
IF COL_LENGTH(N'dbo.despachos', N'transportadora_id') IS NULL ALTER TABLE dbo.despachos ADD transportadora_id INT NULL;
IF COL_LENGTH(N'dbo.despachos', N'transportadora_nombre') IS NULL ALTER TABLE dbo.despachos ADD transportadora_nombre NVARCHAR(150) NULL;
IF COL_LENGTH(N'dbo.despachos', N'fecha_operativa') IS NULL ALTER TABLE dbo.despachos ADD fecha_operativa NVARCHAR(30) NULL;

IF OBJECT_ID(N'dbo.despacho_paquetes', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.despacho_paquetes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    despacho_id INT NOT NULL,
    paquete_id INT NOT NULL,
    hawb NVARCHAR(50) NOT NULL,
    agregado_por NVARCHAR(120) NULL,
    fecha_agregado DATETIME2 NOT NULL CONSTRAINT DF_despacho_paquetes_fecha DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_despacho_paquetes_despachos FOREIGN KEY (despacho_id) REFERENCES dbo.despachos(id) ON DELETE CASCADE
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_despacho_paquetes_hawb' AND object_id = OBJECT_ID(N'dbo.despacho_paquetes'))
  CREATE UNIQUE INDEX UX_despacho_paquetes_hawb ON dbo.despacho_paquetes(hawb);

IF OBJECT_ID(N'dbo.prealertas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.prealertas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL,
    tracking NVARCHAR(100) NOT NULL,
    peso_lbs DECIMAL(10,2) NOT NULL,
    contenido NVARCHAR(255) NOT NULL,
    valor_declarado DECIMAL(12,2) NOT NULL,
    valor_asegurado DECIMAL(12,2) NOT NULL,
    observaciones NVARCHAR(500) NULL,
    estado NVARCHAR(50) NOT NULL CONSTRAINT DF_prealertas_estado DEFAULT N'Prealertado',
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_prealertas_fecha DEFAULT SYSUTCDATETIME()
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_prealertas_cliente_fecha' AND object_id = OBJECT_ID(N'dbo.prealertas'))
  CREATE INDEX IX_prealertas_cliente_fecha ON dbo.prealertas(cliente_id, fecha_creacion DESC);

IF OBJECT_ID(N'dbo.promociones_tiendas', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.promociones_tiendas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tienda NVARCHAR(120) NOT NULL,
    titulo NVARCHAR(180) NOT NULL,
    descripcion NVARCHAR(600) NOT NULL,
    categoria NVARCHAR(100) NULL,
    evento NVARCHAR(100) NULL,
    url_destino NVARCHAR(1000) NOT NULL,
    imagen_blob NVARCHAR(500) NULL,
    imagen_url NVARCHAR(1000) NULL,
    fecha_inicio DATETIME2 NOT NULL,
    fecha_fin DATETIME2 NOT NULL,
    publicada BIT NOT NULL CONSTRAINT DF_promociones_publicada DEFAULT 0,
    destacada BIT NOT NULL CONSTRAINT DF_promociones_destacada DEFAULT 0,
    orden INT NOT NULL CONSTRAINT DF_promociones_orden DEFAULT 0,
    creado_por INT NULL,
    fecha_creacion DATETIME2 NOT NULL CONSTRAINT DF_promociones_fecha DEFAULT SYSUTCDATETIME(),
    fecha_actualizacion DATETIME2 NOT NULL CONSTRAINT DF_promociones_actualizacion DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CK_promociones_fechas CHECK (fecha_fin > fecha_inicio)
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_promociones_vigencia' AND object_id = OBJECT_ID(N'dbo.promociones_tiendas'))
  CREATE INDEX IX_promociones_vigencia ON dbo.promociones_tiendas(publicada, fecha_inicio, fecha_fin, destacada, orden);

COMMIT TRANSACTION;
