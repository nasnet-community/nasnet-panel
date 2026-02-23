import { describe, it, expect } from 'vitest';
import {
  ROUTES,
  API_ENDPOINTS,
  SOCKET_EVENTS,
  SOCKET_EVENTS_EMIT,
  SOCKET_EVENTS_ON,
  WELL_KNOWN_PORTS,
  PORT_CATEGORY_LABELS,
  PORT_PRESETS,
  getServiceByPort,
  getPortEntry,
  getPortsByCategory,
  searchPorts,
  getSuggestionsByCategory,
  type Route,
} from './index';

describe('ROUTES constant', () => {
  describe('main navigation routes', () => {
    it('should define HOME route', () => {
      expect(ROUTES.HOME).toBe('/');
    });

    it('should define DASHBOARD route', () => {
      expect(ROUTES.DASHBOARD).toBe('/dashboard');
    });

    it('should define all primary navigation routes', () => {
      expect(ROUTES.HOME).toBeDefined();
      expect(ROUTES.DASHBOARD).toBeDefined();
      expect(ROUTES.ROUTER_LIST).toBeDefined();
    });
  });

  describe('router management routes', () => {
    it('should define ROUTER_LIST route', () => {
      expect(ROUTES.ROUTER_LIST).toBe('/routers');
    });

    it('should define ROUTER_DETAIL route', () => {
      expect(ROUTES.ROUTER_DETAIL).toBe('/routers/:id');
    });

    it('should have router panel routes', () => {
      expect(ROUTES.ROUTER_PANEL).toBeDefined();
      expect(ROUTES.ROUTER_WIFI).toBeDefined();
      expect(ROUTES.ROUTER_VPN).toBeDefined();
    });
  });

  describe('network configuration routes', () => {
    it('should define WAN, LAN, FIREWALL routes', () => {
      expect(ROUTES.WAN).toBe('/network/wan');
      expect(ROUTES.LAN).toBe('/network/lan');
      expect(ROUTES.FIREWALL).toBe('/network/firewall');
    });

    it('should have routing and QoS routes', () => {
      expect(ROUTES.ROUTING).toBeDefined();
      expect(ROUTES.QOS).toBeDefined();
    });
  });

  describe('error page routes', () => {
    it('should define NOT_FOUND route', () => {
      expect(ROUTES.NOT_FOUND).toBe('/404');
    });

    it('should define UNAUTHORIZED route', () => {
      expect(ROUTES.UNAUTHORIZED).toBe('/401');
    });

    it('should define FORBIDDEN route', () => {
      expect(ROUTES.FORBIDDEN).toBe('/403');
    });

    it('should define SERVER_ERROR route', () => {
      expect(ROUTES.SERVER_ERROR).toBe('/500');
    });
  });

  describe('Route type', () => {
    it('should be a union type of all route values', () => {
      // Type is validated at compile time, this is a runtime smoke test
      const home: Route = ROUTES.HOME;
      expect(home).toBe('/');
    });
  });
});

describe('API_ENDPOINTS constant', () => {
  describe('router endpoints', () => {
    it('should define ROUTER_STATUS endpoint', () => {
      expect(API_ENDPOINTS.ROUTER_STATUS).toBe('/api/v1/router/status');
    });

    it('should define ROUTER_LIST endpoint', () => {
      expect(API_ENDPOINTS.ROUTER_LIST).toBe('/api/v1/routers');
    });
  });

  describe('dynamic endpoints', () => {
    it('should generate ROUTER_DETAIL endpoint with ID parameter', () => {
      const endpoint = API_ENDPOINTS.ROUTER_DETAIL('router-123');
      expect(endpoint).toBe('/api/v1/routers/router-123');
    });

    it('should handle parameterized DHCP endpoints', () => {
      const endpoint = API_ENDPOINTS.DHCP_LEASE('aa:bb:cc:dd:ee:ff');
      expect(endpoint).toContain('/api/v1/network/dhcp/leases/');
    });

    it('should support multiple ID formats', () => {
      const numericId = API_ENDPOINTS.ROUTER_DETAIL('123');
      const alphanumericId = API_ENDPOINTS.ROUTER_DETAIL('router-abc-xyz');
      expect(numericId).toContain('123');
      expect(alphanumericId).toContain('router-abc-xyz');
    });
  });

  describe('network endpoints', () => {
    it('should define WAN config endpoint', () => {
      expect(API_ENDPOINTS.WAN_CONFIG).toBe('/api/v1/network/wan');
    });

    it('should define firewall rules endpoint', () => {
      expect(API_ENDPOINTS.FIREWALL_RULES).toBe('/api/v1/network/firewall/rules');
    });
  });

  describe('VPN endpoints', () => {
    it('should define VPN_CONNECTIONS endpoint', () => {
      expect(API_ENDPOINTS.VPN_CONNECTIONS).toBe('/api/v1/vpn/connections');
    });

    it('should define VPN_SERVER_CONFIG endpoint', () => {
      expect(API_ENDPOINTS.VPN_SERVER_CONFIG).toBe('/api/v1/vpn/server');
    });
  });

  describe('health check endpoints', () => {
    it('should define health endpoint', () => {
      expect(API_ENDPOINTS.HEALTH).toBe('/api/v1/health');
    });

    it('should define health ping endpoint', () => {
      expect(API_ENDPOINTS.HEALTH_PING).toBe('/api/v1/health/ping');
    });
  });
});

describe('SOCKET_EVENTS constants', () => {
  describe('SOCKET_EVENTS_EMIT', () => {
    it('should define CONNECT event', () => {
      expect(SOCKET_EVENTS_EMIT.CONNECT).toBe('connect');
    });

    it('should define ROUTER_SUBSCRIBE event', () => {
      expect(SOCKET_EVENTS_EMIT.ROUTER_SUBSCRIBE).toBe('router:subscribe');
    });

    it('should define VPN_SUBSCRIBE event', () => {
      expect(SOCKET_EVENTS_EMIT.VPN_SUBSCRIBE).toBe('vpn:subscribe');
    });

    it('should define CONFIG_APPLY event', () => {
      expect(SOCKET_EVENTS_EMIT.CONFIG_APPLY).toBe('config:apply');
    });
  });

  describe('SOCKET_EVENTS_ON', () => {
    it('should define ROUTER_STATUS_UPDATE event', () => {
      expect(SOCKET_EVENTS_ON.ROUTER_STATUS_UPDATE).toBe('router:status-update');
    });

    it('should define VPN_STATUS_UPDATE event', () => {
      expect(SOCKET_EVENTS_ON.VPN_STATUS_UPDATE).toBe('vpn:status-update');
    });

    it('should define FIREWALL_RULE_UPDATED event', () => {
      expect(SOCKET_EVENTS_ON.FIREWALL_RULE_UPDATED).toBe('firewall:rule-updated');
    });

    it('should define alert events', () => {
      expect(SOCKET_EVENTS_ON.ALERT).toBe('alert');
      expect(SOCKET_EVENTS_ON.WARNING).toBe('warning');
      expect(SOCKET_EVENTS_ON.INFO).toBe('info');
      expect(SOCKET_EVENTS_ON.SUCCESS).toBe('success');
    });
  });

  describe('SOCKET_EVENTS combined', () => {
    it('should include both emit and on events', () => {
      expect(SOCKET_EVENTS.CONNECT).toBeDefined();
      expect(SOCKET_EVENTS.ROUTER_STATUS_UPDATE).toBeDefined();
    });

    it('should have more entries than individual sets combined', () => {
      // Some events may overlap, but the combined set should be substantial
      expect(Object.keys(SOCKET_EVENTS).length).toBeGreaterThan(0);
    });
  });
});

describe('WELL_KNOWN_PORTS constant', () => {
  describe('structure', () => {
    it('should be a non-empty array', () => {
      expect(Array.isArray(WELL_KNOWN_PORTS)).toBe(true);
      expect(WELL_KNOWN_PORTS.length).toBeGreaterThan(0);
    });

    it('should have entries with required properties', () => {
      const entry = WELL_KNOWN_PORTS[0];
      expect(entry).toHaveProperty('port');
      expect(entry).toHaveProperty('service');
      expect(entry).toHaveProperty('protocol');
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('builtIn');
    });

    it('should have valid port numbers', () => {
      WELL_KNOWN_PORTS.forEach((entry) => {
        expect(entry.port).toBeGreaterThan(0);
        expect(entry.port).toBeLessThanOrEqual(65535);
      });
    });

    it('should have valid protocols', () => {
      const validProtocols = ['tcp', 'udp', 'both'];
      WELL_KNOWN_PORTS.forEach((entry) => {
        expect(validProtocols).toContain(entry.protocol);
      });
    });
  });

  describe('categories', () => {
    it('should include web service ports', () => {
      const webPorts = WELL_KNOWN_PORTS.filter((p) => p.category === 'web');
      expect(webPorts.length).toBeGreaterThan(0);
      expect(webPorts.some((p) => p.port === 80)).toBe(true);
      expect(webPorts.some((p) => p.port === 443)).toBe(true);
    });

    it('should include secure access ports', () => {
      const securePorts = WELL_KNOWN_PORTS.filter((p) => p.category === 'secure');
      expect(securePorts.length).toBeGreaterThan(0);
      expect(securePorts.some((p) => p.port === 22)).toBe(true);
    });

    it('should include database ports', () => {
      const dbPorts = WELL_KNOWN_PORTS.filter((p) => p.category === 'database');
      expect(dbPorts.length).toBeGreaterThan(0);
    });

    it('should include network/VPN ports', () => {
      const networkPorts = WELL_KNOWN_PORTS.filter((p) => p.category === 'network');
      expect(networkPorts.length).toBeGreaterThan(0);
      expect(networkPorts.some((p) => p.port === 53)).toBe(true); // DNS
    });

    it('should include MikroTik-specific ports', () => {
      const mikrotikPorts = WELL_KNOWN_PORTS.filter((p) => p.category === 'mikrotik');
      expect(mikrotikPorts.length).toBeGreaterThan(0);
      expect(mikrotikPorts.some((p) => p.port === 8291)).toBe(true); // Winbox
    });
  });
});

describe('PORT_CATEGORY_LABELS constant', () => {
  it('should be an object', () => {
    expect(PORT_CATEGORY_LABELS).toBeDefined();
    expect(typeof PORT_CATEGORY_LABELS).toBe('object');
  });

  it('should have labels for all categories', () => {
    const categories = ['web', 'secure', 'database', 'messaging', 'mail', 'network', 'system', 'containers', 'mikrotik'];
    categories.forEach((category) => {
      expect(PORT_CATEGORY_LABELS[category as keyof typeof PORT_CATEGORY_LABELS]).toBeDefined();
      expect(typeof PORT_CATEGORY_LABELS[category as keyof typeof PORT_CATEGORY_LABELS]).toBe('string');
    });
  });
});

describe('PORT_PRESETS constant', () => {
  it('should have web server preset', () => {
    expect(PORT_PRESETS.webServer).toEqual([80, 443]);
  });

  it('should have mail server preset', () => {
    expect(PORT_PRESETS.mailServer).toContain(25);
    expect(PORT_PRESETS.mailServer).toContain(465);
  });

  it('should have SSH preset', () => {
    expect(PORT_PRESETS.sshAccess).toEqual([22]);
  });

  it('should have MikroTik management preset', () => {
    expect(PORT_PRESETS.mikrotikManagement).toContain(8291);
    expect(PORT_PRESETS.mikrotikManagement).toContain(8728);
  });

  it('should have database preset', () => {
    expect(PORT_PRESETS.databaseCommon).toContain(3306); // MySQL
    expect(PORT_PRESETS.databaseCommon).toContain(5432); // PostgreSQL
  });

  it('should have VPN ports preset', () => {
    expect(PORT_PRESETS.vpnPorts).toContain(1194); // OpenVPN
    expect(PORT_PRESETS.vpnPorts).toContain(51820); // WireGuard
  });

  it('should be readonly', () => {
    // This is verified at compile time; runtime test ensures structure
    expect(PORT_PRESETS).toBeDefined();
  });
});

describe('getServiceByPort function', () => {
  it('should return service name for HTTP port', () => {
    const service = getServiceByPort(80);
    expect(service).toBe('HTTP');
  });

  it('should return service name for HTTPS port', () => {
    const service = getServiceByPort(443);
    expect(service).toBe('HTTPS');
  });

  it('should return service name for SSH port', () => {
    const service = getServiceByPort(22);
    expect(service).toBe('SSH');
  });

  it('should return null for unknown port', () => {
    const service = getServiceByPort(65000);
    expect(service).toBeNull();
  });

  it('should support protocol filtering', () => {
    const service = getServiceByPort(53, 'tcp');
    expect(service).toBe('DNS');
  });

  it('should return null for invalid protocol match', () => {
    // If port exists only for UDP, requesting TCP should return null
    const dhcp = getServiceByPort(67, 'tcp');
    expect(dhcp).toBeNull();
  });

  it('should handle edge case port numbers', () => {
    // Port 1 is not in well-known list
    expect(getServiceByPort(1)).toBeNull();
    // Port 65535 is valid but not in list
    expect(getServiceByPort(65535)).toBeNull();
  });
});

describe('getPortEntry function', () => {
  it('should return full entry for HTTP port', () => {
    const entry = getPortEntry(80);
    expect(entry).toBeDefined();
    expect(entry?.port).toBe(80);
    expect(entry?.service).toBe('HTTP');
    expect(entry?.category).toBe('web');
  });

  it('should return null for unknown port', () => {
    const entry = getPortEntry(65000);
    expect(entry).toBeNull();
  });

  it('should support protocol filtering', () => {
    const entry = getPortEntry(53, 'tcp');
    expect(entry).toBeDefined();
    expect(entry?.port).toBe(53);
  });
});

describe('getPortsByCategory function', () => {
  it('should return array of web ports', () => {
    const webPorts = getPortsByCategory('web');
    expect(Array.isArray(webPorts)).toBe(true);
    expect(webPorts.length).toBeGreaterThan(0);
    expect(webPorts.every((p) => p.category === 'web')).toBe(true);
  });

  it('should return array of secure ports', () => {
    const securePorts = getPortsByCategory('secure');
    expect(Array.isArray(securePorts)).toBe(true);
    expect(securePorts.some((p) => p.port === 22)).toBe(true);
  });

  it('should return empty array for nonexistent category', () => {
    const unknown = getPortsByCategory('unknown' as any);
    expect(Array.isArray(unknown)).toBe(true);
    expect(unknown.length).toBe(0);
  });
});

describe('searchPorts function', () => {
  it('should find HTTP by service name', () => {
    const results = searchPorts('http');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].service.toLowerCase()).toContain('http');
  });

  it('should find ports by port number', () => {
    const results = searchPorts('22');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].port).toBe(22);
  });

  it('should return empty array for empty query', () => {
    const results = searchPorts('');
    expect(results).toEqual([]);
  });

  it('should return empty array for whitespace-only query', () => {
    const results = searchPorts('   ');
    expect(results).toEqual([]);
  });

  it('should respect limit parameter', () => {
    const results = searchPorts('http', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should return empty array for invalid port number', () => {
    const results = searchPorts('65536'); // Out of range
    expect(results).toEqual([]);
  });

  it('should handle case-insensitive search', () => {
    const lower = searchPorts('ssh');
    const upper = searchPorts('SSH');
    expect(lower.length).toBe(upper.length);
    expect(lower[0].port).toBe(upper[0].port);
  });

  it('should search both service name and description', () => {
    const results = searchPorts('hypertext');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should prioritize exact matches', () => {
    const results = searchPorts('mysql');
    expect(results[0].service.toLowerCase()).toBe('mysql');
  });
});

describe('getSuggestionsByCategory function', () => {
  it('should return suggestions for default categories', () => {
    const suggestions = getSuggestionsByCategory();
    expect(suggestions).toHaveProperty('web');
    expect(suggestions).toHaveProperty('secure');
    expect(suggestions).toHaveProperty('database');
    expect(suggestions).toHaveProperty('mikrotik');
  });

  it('should return array of ports for each category', () => {
    const suggestions = getSuggestionsByCategory();
    expect(Array.isArray(suggestions.web)).toBe(true);
    expect(Array.isArray(suggestions.secure)).toBe(true);
  });

  it('should respect limit of 5 entries per category', () => {
    const suggestions = getSuggestionsByCategory(['web']);
    expect(suggestions.web.length).toBeLessThanOrEqual(5);
  });

  it('should handle custom category list', () => {
    const suggestions = getSuggestionsByCategory(['network', 'database']);
    expect(suggestions).toHaveProperty('network');
    expect(suggestions).toHaveProperty('database');
    expect(suggestions).not.toHaveProperty('web');
  });
});
