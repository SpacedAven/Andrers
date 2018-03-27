IF NOT EXISTS (SELECT name FROM sysobjects where name='clusteredrecontargetids' AND xtype='U')
BEGIN
CREATE  TABLE  [openidm].[clusteredrecontargetids]
(
  objectid NVARCHAR(38) NOT NULL ,
  rev NVARCHAR(38) NOT NULL ,
  reconid NVARCHAR(255) NOT NULL ,
  targetids NTEXT NOT NULL ,
  PRIMARY KEY CLUSTERED (objectid)
);
CREATE INDEX idx_clusteredrecontargetids_reconid ON [openidm].[clusteredrecontargetids] (reconid ASC);
END
