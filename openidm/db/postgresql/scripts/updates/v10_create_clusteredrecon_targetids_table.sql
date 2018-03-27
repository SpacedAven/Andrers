CREATE TABLE openidm.clusteredrecontargetids (
  objectid VARCHAR(38) NOT NULL,
  rev VARCHAR(38) NOT NULL,
  reconid VARCHAR(255) NOT NULL,
  targetids JSON NOT NULL,
  PRIMARY KEY (objectid)
);

CREATE INDEX idx_clusteredrecontargetids_reconid ON openidm.clusteredrecontargetids (reconid);
