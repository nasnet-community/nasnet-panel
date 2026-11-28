CREATE TABLE dns_static_entries_new (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    address    TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'A',
    ttl        TEXT NOT NULL DEFAULT '1d',
    enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, address)
);

INSERT INTO dns_static_entries_new (name, address, type, ttl, enabled, updated_at)
SELECT name, address, type, ttl, enabled, updated_at
FROM dns_static_entries
WHERE id IN (SELECT MIN(id) FROM dns_static_entries GROUP BY name, address)
ORDER BY id;

DROP TABLE dns_static_entries;

ALTER TABLE dns_static_entries_new RENAME TO dns_static_entries;
