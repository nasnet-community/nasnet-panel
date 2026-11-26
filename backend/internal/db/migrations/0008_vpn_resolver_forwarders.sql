INSERT OR IGNORE INTO dns_servers (name, type, dns_servers, doh_servers, verify_doh_cert, comment)
SELECT 'VPN-Backup1', 'forwarder', '9.9.9.9', '', 0, '' WHERE EXISTS (SELECT 1 FROM dns_servers WHERE name = 'VPN');

INSERT OR IGNORE INTO dns_servers (name, type, dns_servers, doh_servers, verify_doh_cert, comment)
SELECT 'VPN-Backup2', 'forwarder', '8.8.8.8', '', 0, '' WHERE EXISTS (SELECT 1 FROM dns_servers WHERE name = 'VPN');

UPDATE dns_servers SET dns_servers = dns_servers || ',9.9.9.9,8.8.8.8'
WHERE name = 'General' AND type = 'forwarder' AND dns_servers NOT LIKE '%9.9.9.9%'
  AND EXISTS (SELECT 1 FROM dns_servers WHERE name = 'VPN');

UPDATE dns_servers SET dns_servers = (SELECT dns_servers FROM dns_servers WHERE name = 'VPN') || ',9.9.9.9,8.8.8.8'
WHERE type = 'global' AND EXISTS (SELECT 1 FROM dns_servers WHERE name = 'VPN');

UPDATE dns_servers SET name = 'VPN-Primary' WHERE name = 'VPN' AND type = 'forwarder';
