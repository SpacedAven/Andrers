-- DROP TABLE clusteredrecontargetids CASCADE CONSTRAINTS;


PROMPT Creating Table clusteredrecontargetids ...
CREATE TABLE clusteredrecontargetids (
  objectid VARCHAR2(38 CHAR) NOT NULL,
  rev VARCHAR2(38 CHAR) NOT NULL,
  reconid VARCHAR2(255 CHAR) NOT NULL,
  targetids CLOB NOT NULL
);
PROMPT Creating Primary Key Constraint PRIMARY_11 on table clusteredrecontargetids ...
ALTER TABLE clusteredrecontargetids
ADD CONSTRAINT PRIMARY_11 PRIMARY KEY
(
  objectid
)
ENABLE
;

PROMPT Creating Index idx_clusteredrecontids_rid on clusteredrecontargetids...
CREATE INDEX idx_clusteredrecontids_rid ON clusteredrecontargetids
(
  reconid
)
;
