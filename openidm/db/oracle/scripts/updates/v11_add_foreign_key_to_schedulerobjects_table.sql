PROMPT Creating Foreign Key Constraint fk_schedulerobjects_objectypes on table schedulerobjects...
ALTER TABLE schedulerobjects
  ADD CONSTRAINT fk_schedulerobjects_objectypes FOREIGN KEY
  (
    objecttypes_id
  )
REFERENCES objecttypes
  (
    id
  )
ON DELETE CASCADE
ENABLE
;