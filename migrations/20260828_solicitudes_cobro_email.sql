SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.solicitudes', N'cobro_email_enviado_en') IS NULL
BEGIN
  ALTER TABLE dbo.solicitudes
    ADD cobro_email_enviado_en DATETIME2 NULL;
END;

COMMIT TRANSACTION;
