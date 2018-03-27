-- Column lengths are stored as N+4 for legacy reasons
-- Much faster way of updating column length in postgres
-- Instant change vs full-rewrite with ALTER
UPDATE pg_attribute SET atttypmod = 259 WHERE attrelid = 'openidm.uinotification'::regclass AND attname = 'receiverId';
UPDATE pg_attribute SET atttypmod = 259 WHERE attrelid = 'openidm.uinotification'::regclass AND attname = 'requesterId';
