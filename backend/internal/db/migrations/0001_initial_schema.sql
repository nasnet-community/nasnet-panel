CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wans (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    type           TEXT NOT NULL UNIQUE CHECK (type IN ('domestic', 'foreign')),
    interface_type TEXT NOT NULL CHECK (interface_type IN ('ether', 'wifi')),
    interface      TEXT NOT NULL,
    updated_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wireguard_interfaces (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    comment     TEXT NOT NULL DEFAULT '',
    type        TEXT NOT NULL CHECK (type IN ('client', 'server')),
    private_key TEXT NOT NULL,
    address     TEXT NOT NULL DEFAULT '',
    enabled     INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wireguard_peers (
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    interface_id         INTEGER NOT NULL REFERENCES wireguard_interfaces (id) ON DELETE CASCADE,
    name                 TEXT NOT NULL DEFAULT '',
    comment              TEXT NOT NULL DEFAULT '',
    public_key           TEXT NOT NULL,
    private_key          TEXT NOT NULL DEFAULT '',
    preshared_key        TEXT NOT NULL DEFAULT '',
    endpoint_address     TEXT NOT NULL DEFAULT '',
    endpoint_port        INTEGER NOT NULL DEFAULT 0,
    allowed_address      TEXT NOT NULL DEFAULT '',
    persistent_keepalive INTEGER NOT NULL DEFAULT 0,
    enabled              INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    UNIQUE (interface_id, public_key)
);

CREATE TABLE IF NOT EXISTS l2tp_clients (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL UNIQUE,
    comment      TEXT NOT NULL DEFAULT '',
    connect_to   TEXT NOT NULL,
    user         TEXT NOT NULL,
    password     TEXT NOT NULL,
    ipsec_secret TEXT NOT NULL DEFAULT '',
    enabled      INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sstp_clients (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    comment    TEXT NOT NULL DEFAULT '',
    connect_to TEXT NOT NULL,
    port       INTEGER NOT NULL DEFAULT 443,
    user       TEXT NOT NULL,
    password   TEXT NOT NULL,
    enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wifis (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL UNIQUE,
    default_name TEXT NOT NULL DEFAULT '',
    ssid         TEXT NOT NULL DEFAULT '',
    password     TEXT NOT NULL DEFAULT '',
    enabled      INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    mode         TEXT NOT NULL CHECK (mode IN ('ap', 'station', 'station-bridge', 'station-pseudobridge')),
    is_virtual   INTEGER NOT NULL DEFAULT 0 CHECK (is_virtual IN (0, 1)),
    master       TEXT NOT NULL DEFAULT '',
    bridge       TEXT NOT NULL DEFAULT '',
    auth_types   TEXT NOT NULL DEFAULT '',
    updated_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bridge_ports (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    bridge     TEXT NOT NULL,
    interface  TEXT NOT NULL UNIQUE,
    comment    TEXT NOT NULL DEFAULT '',
    enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ovpn_servers (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    name                        TEXT NOT NULL UNIQUE,
    certificate_timestamp       INTEGER NOT NULL DEFAULT 0,
    protocol                    TEXT NOT NULL CHECK (protocol IN ('tcp', 'udp')),
    port                        INTEGER NOT NULL DEFAULT 0,
    client_certificate_password TEXT NOT NULL DEFAULT '',
    enabled                     INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at                  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vpn_users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    profile    TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vpn_servers (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    type                      TEXT NOT NULL UNIQUE CHECK (type IN ('sstp', 'l2tp', 'ikev2')),
    enabled                   INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    port                      INTEGER NOT NULL DEFAULT 0,
    default_profile           TEXT NOT NULL DEFAULT '',
    authentication            TEXT NOT NULL DEFAULT '',
    certificate_timestamp     INTEGER NOT NULL DEFAULT 0,
    verify_client_certificate INTEGER NOT NULL DEFAULT 0 CHECK (verify_client_certificate IN (0, 1)),
    ciphers                   TEXT NOT NULL DEFAULT '',
    use_ipsec                 INTEGER NOT NULL DEFAULT 0 CHECK (use_ipsec IN (0, 1)),
    ipsec_secret              TEXT NOT NULL DEFAULT '',
    updated_at                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dns_servers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL UNIQUE,
    type            TEXT NOT NULL CHECK (type IN ('global', 'forwarder')),
    dns_servers     TEXT NOT NULL DEFAULT '',
    doh_servers     TEXT NOT NULL DEFAULT '',
    verify_doh_cert INTEGER NOT NULL DEFAULT 0 CHECK (verify_doh_cert IN (0, 1)),
    comment         TEXT NOT NULL DEFAULT '',
    updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dns_static_entries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    router_id  TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    address    TEXT NOT NULL,
    type       TEXT NOT NULL DEFAULT 'A',
    ttl        TEXT NOT NULL DEFAULT '1d',
    comment    TEXT NOT NULL DEFAULT '',
    enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
