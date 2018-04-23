PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS FILE_SYSTEM (
  TEAM    TEXT PRIMARY KEY,
  JSON    TEXT    DEFAULT
                    '{
                  "name":"root",
                  "files":[],
                  "folders":[]
                    }',
  VERSION INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ENDPOINT (
  MAC_ID TEXT PRIMARY KEY NOT NULL,
  TEAM   TEXT             NOT NULL,
  FOREIGN KEY (TEAM) REFERENCES FILE_SYSTEM (TEAM)
);

COMMIT;