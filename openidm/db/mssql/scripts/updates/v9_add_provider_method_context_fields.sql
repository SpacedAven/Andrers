ALTER TABLE [openidm].[auditauthentication] ADD COLUMN provider NVARCHAR(255) NULL;
ALTER TABLE [openidm].[auditauthentication] ADD COLUMN method NVARCHAR(15) NULL;
ALTER TABLE [openidm].[auditactivity] ADD COLUMN provider NVARCHAR(255) NULL;
ALTER TABLE [openidm].[auditactivity] ADD COLUMN context NVARCHAR(25) NULL;
