ALTER TABLE openidm.auditauthentication ADD COLUMN provider VARCHAR(255) NULL;
ALTER TABLE openidm.auditauthentication ADD COLUMN method VARCHAR(15) NULL;
ALTER TABLE openidm.auditactivity ADD COLUMN provider VARCHAR(255) NULL;
ALTER TABLE openidm.auditactivity ADD COLUMN context VARCHAR(25) NULL;
