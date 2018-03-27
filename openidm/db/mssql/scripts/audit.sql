-- -----------------------------------------------------
-- Table `openidm`.`auditrecon`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='auditrecon' AND xtype='U')
BEGIN
CREATE  TABLE  [openidm].[auditrecon]
(
  objectid NVARCHAR(56) NOT NULL ,
  transactionid NVARCHAR(255) NOT NULL ,
  activitydate NVARCHAR(29) NOT NULL ,
  eventname NVARCHAR(50) NULL ,
  userid NVARCHAR(255) NULL ,
  trackingids NTEXT ,
  activity NVARCHAR(24) NULL ,
  exceptiondetail NTEXT NULL ,
  linkqualifier NVARCHAR(255) NULL ,
  mapping NVARCHAR(511) NULL ,
  message NTEXT NULL ,
  messagedetail NTEXT NULL ,
  situation NVARCHAR(24) NULL ,
  sourceobjectid NVARCHAR(511) NULL ,
  status NVARCHAR(20) NULL ,
  targetobjectid NVARCHAR(511) NULL ,
  reconciling NVARCHAR(12) NULL ,
  ambiguoustargetobjectids NTEXT NULL ,
  reconaction NVARCHAR(36) NULL ,
  entrytype NVARCHAR(7) NULL ,
  reconid NVARCHAR(56) NULL ,
  PRIMARY KEY CLUSTERED (objectid)
);
CREATE INDEX idx_auditrecon_reconid ON [openidm].[auditrecon] (reconid ASC);
CREATE INDEX idx_auditrecon_entrytype ON [openidm].[auditrecon] (entrytype ASC);
EXEC sp_addextendedproperty 'MS_Description', 'Date format: 2011-09-09T14:58:17.654+02:00', 'SCHEMA', openidm, 'TABLE', auditrecon, 'COLUMN', activitydate;
END


-- -----------------------------------------------------
-- Table `openidm`.`auditsync`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='auditsync' AND xtype='U')
BEGIN
CREATE  TABLE  [openidm].[auditsync]
(
  objectid NVARCHAR(56) NOT NULL ,
  transactionid NVARCHAR(255) NOT NULL ,
  activitydate NVARCHAR(29) NOT NULL ,
  eventname NVARCHAR(50) NULL ,
  userid NVARCHAR(255) NULL ,
  trackingids NTEXT ,
  activity NVARCHAR(24) NULL ,
  exceptiondetail NTEXT NULL ,
  linkqualifier NVARCHAR(255) NULL ,
  mapping NVARCHAR(511) NULL ,
  message NTEXT NULL ,
  messagedetail NTEXT NULL ,
  situation NVARCHAR(24) NULL ,
  sourceobjectid NVARCHAR(511) NULL ,
  status NVARCHAR(20) NULL ,
  targetobjectid NVARCHAR(511) NULL ,
  PRIMARY KEY CLUSTERED (objectid)
);
EXEC sp_addextendedproperty 'MS_Description', 'Date format: 2011-09-09T14:58:17.654+02:00', 'SCHEMA', openidm, 'TABLE', auditsync, 'COLUMN', activitydate;
END

-- -----------------------------------------------------
-- Table `openidm`.`auditconfig`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='auditconfig' and xtype='U')
  BEGIN
    CREATE  TABLE [openidm].[auditconfig]
    (
      objectid NVARCHAR(56) NOT NULL,
      activitydate NVARCHAR(29) NOT NULL,
      eventname NVARCHAR(255) NULL,
      transactionid NVARCHAR(255) NOT NULL,
      userid NVARCHAR(255) NULL,
      trackingids NTEXT,
      runas NVARCHAR(255) NULL,
      configobjectid NVARCHAR(255) NULL ,
      operation NVARCHAR(255) NULL ,
      beforeObject NTEXT,
      afterObject NTEXT,
      changedfields NTEXT NULL,
      rev NVARCHAR(255) NULL,
      PRIMARY KEY CLUSTERED (objectid),
    );
    EXEC sp_addextendedproperty 'MS_Description', 'Date format: 2011-09-09T14:58:17.654+02:00', 'SCHEMA', openidm, 'TABLE', auditconfig, 'COLUMN', activitydate;
  END


-- -----------------------------------------------------
-- Table `openidm`.`auditactivity`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='auditactivity' and xtype='U')
BEGIN
CREATE  TABLE [openidm].[auditactivity]
(
  objectid NVARCHAR(56) NOT NULL,
  activitydate NVARCHAR(29) NOT NULL,
  eventname NVARCHAR(255) NULL,
  transactionid NVARCHAR(255) NOT NULL,
  userid NVARCHAR(255) NULL,
  trackingids NTEXT,
  runas NVARCHAR(255) NULL,
  activityobjectid NVARCHAR(255) NULL ,
  operation NVARCHAR(255) NULL ,
  subjectbefore NTEXT,
  subjectafter NTEXT,
  changedfields NTEXT NULL,
  subjectrev NVARCHAR(255) NULL,
  passwordchanged NVARCHAR(5) NULL,
  message NTEXT,
  provider NVARCHAR(255) NULL,
  context NVARCHAR(25) NULL,
  status NVARCHAR(20),
  PRIMARY KEY CLUSTERED (objectid),
);
EXEC sp_addextendedproperty 'MS_Description', 'Date format: 2011-09-09T14:58:17.654+02:00', 'SCHEMA', openidm, 'TABLE', auditactivity, 'COLUMN', activitydate;
END

-- -----------------------------------------------------
-- Table `openidm`.`auditaccess`
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='auditaccess' and xtype='U')
BEGIN
CREATE  TABLE [openidm].[auditaccess] (
  objectid NVARCHAR(56) NOT NULL ,
  activitydate NVARCHAR(29) NOT NULL ,
  eventname NVARCHAR(255) NULL ,
  transactionid NVARCHAR(255) NOT NULL ,
  userid NVARCHAR(255) NULL,
  trackingids NTEXT,
  server_ip NVARCHAR(40) ,
  server_port NVARCHAR(5) ,
  client_ip NVARCHAR(40) ,
  client_port NVARCHAR(5) ,
  request_protocol NVARCHAR(255) NULL ,
  request_operation NVARCHAR(255) NULL ,
  request_detail NTEXT NULL ,
  http_request_secure NVARCHAR(255) NULL ,
  http_request_method NVARCHAR(255) NULL ,
  http_request_path NVARCHAR(255) NULL ,
  http_request_queryparameters NTEXT NULL ,
  http_request_headers NTEXT NULL ,
  http_request_cookies NTEXT NULL ,
  http_response_headers NTEXT NULL ,
  response_status NVARCHAR(255) NULL ,
  response_statuscode NVARCHAR(255) NULL ,
  response_elapsedtime NVARCHAR(255) NULL ,
  response_elapsedtimeunits NVARCHAR(255) NULL ,
  response_detail NTEXT NULL ,
  roles NTEXT NULL ,
  PRIMARY KEY CLUSTERED (objectid)
);
EXEC sp_addextendedproperty 'MS_Description', 'Date format: 2011-09-09T14:58:17.654+02:00', 'SCHEMA', openidm, 'TABLE', auditaccess, 'COLUMN', activitydate;
END

-- -----------------------------------------------------
-- Table openidm.auditauthentication
-- -----------------------------------------------------
IF NOT EXISTS (SELECT name FROM sysobjects where name='auditauthentication' and xtype='U')
BEGIN
CREATE TABLE [openidm].[auditauthentication] (
  objectid NVARCHAR(56) NOT NULL ,
  transactionid NVARCHAR(255) NOT NULL ,
  activitydate NVARCHAR(29) NOT NULL ,
  userid NVARCHAR(255) NULL ,
  eventname NVARCHAR(50) NULL ,
  provider NVARCHAR(255) NULL ,
  method NVARCHAR(15) NULL ,
  result NVARCHAR(255) NULL ,
  principals NTEXT NULL ,
  context NTEXT NULL ,
  entries NTEXT NULL ,
  trackingids NTEXT,
  PRIMARY KEY CLUSTERED (objectid)
);
EXEC sp_addextendedproperty 'MS_Description', 'Date format: 2011-09-09T14:58:17.654+02:00', 'SCHEMA', openidm, 'TABLE', auditauthentication, 'COLUMN', activitydate;
END