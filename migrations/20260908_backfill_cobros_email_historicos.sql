SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.solicitudes', N'cobro_email_enviado_en') IS NULL
BEGIN
  ALTER TABLE dbo.solicitudes
    ADD cobro_email_enviado_en DATETIME2 NULL;
END;

DECLARE @fecha_corte DATETIME2 = CONVERT(
  DATETIME2,
  N'2026-09-08T15:47:43',
  126
);

UPDATE dbo.solicitudes
SET cobro_email_enviado_en = COALESCE(
  TRY_CONVERT(DATETIME2, fecha),
  @fecha_corte
)
WHERE cobro_email_enviado_en IS NULL
  AND TRY_CONVERT(DATETIME2, fecha) <= @fecha_corte;

COMMIT TRANSACTION;
