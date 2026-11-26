-- BIG LWA durable account-write fallback.
-- Run once after creating the D1 database:
--   wrangler d1 create biglwa-account-sync
--   wrangler d1 execute biglwa-account-sync --remote --file=account-sync-schema.sql
-- Then bind it in wrangler.toml as BIGLWA_ACCOUNT_DB using the generated id.
-- No provider tokens, passwords, or service-account keys are stored here.

CREATE TABLE IF NOT EXISTS account_sync_state (
  uid TEXT NOT NULL,
  scope TEXT NOT NULL,
  doc_path TEXT NOT NULL,
  revision INTEGER NOT NULL,
  edit_id TEXT,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (uid, scope, doc_path)
);

CREATE TABLE IF NOT EXISTS account_sync_mirror (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  scope TEXT NOT NULL,
  doc_path TEXT NOT NULL,
  patch_json TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_at INTEGER NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS account_sync_mirror_pending
  ON account_sync_mirror (done, next_at, id);
CREATE INDEX IF NOT EXISTS account_sync_mirror_owner
  ON account_sync_mirror (uid, done, next_at);
