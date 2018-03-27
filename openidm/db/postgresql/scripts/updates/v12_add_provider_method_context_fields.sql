ALTER TABLE openidm.auditauthentication ADD COLUMN provider VARCHAR(255) DEFAULT NULL;
ALTER TABLE openidm.auditauthentication ADD COLUMN method VARCHAR(15) DEFAULT NULL;
ALTER TABLE openidm.auditactivity ADD COLUMN provider VARCHAR(255) DEFAULT NULL;
ALTER TABLE openidm.auditactivity ADD COLUMN context VARCHAR(25) DEFAULT NULL;
