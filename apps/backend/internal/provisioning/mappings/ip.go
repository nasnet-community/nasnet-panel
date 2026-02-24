package mappings

import "backend/internal/translator"

func registerIPPoolMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/pool", Type: translator.FieldTypeString},
		{GraphQLField: "ranges", MikroTikField: "ranges", Path: "/ip/pool", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

//nolint:dupl // Same registration pattern as interfaces.go functions, different fields and paths
func registerIPRouteMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "dstAddress", MikroTikField: "dst-address", Path: "/ip/route", Type: translator.FieldTypeIP},
		{GraphQLField: "gateway", MikroTikField: "gateway", Path: "/ip/route", Type: translator.FieldTypeString},
		{GraphQLField: "distance", MikroTikField: "distance", Path: "/ip/route", Type: translator.FieldTypeInt},
		{GraphQLField: "routingTable", MikroTikField: "routing-table", Path: "/ip/route", Type: translator.FieldTypeString},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/route", Type: translator.FieldTypeString},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/ip/route", Type: translator.FieldTypeBool},
		{GraphQLField: "type", MikroTikField: "type", Path: "/ip/route", Type: translator.FieldTypeString},
		{GraphQLField: "scope", MikroTikField: "scope", Path: "/ip/route", Type: translator.FieldTypeInt},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerDHCPServerMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/dhcp-server", Type: translator.FieldTypeString},
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/ip/dhcp-server", Type: translator.FieldTypeString},
		{GraphQLField: "addressPool", MikroTikField: "address-pool", Path: "/ip/dhcp-server", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerDHCPServerNetworkMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "address", MikroTikField: "address", Path: "/ip/dhcp-server/network", Type: translator.FieldTypeIP},
		{GraphQLField: "gateway", MikroTikField: "gateway", Path: "/ip/dhcp-server/network", Type: translator.FieldTypeIP},
		{GraphQLField: "dnsServer", MikroTikField: "dns-server", Path: "/ip/dhcp-server/network", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerDHCPClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/ip/dhcp-client", Type: translator.FieldTypeString},
		{GraphQLField: "addDefaultRoute", MikroTikField: "add-default-route", Path: "/ip/dhcp-client", Type: translator.FieldTypeBool},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/ip/dhcp-client", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerDNSMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "servers", MikroTikField: "servers", Path: "/ip/dns", Type: translator.FieldTypeList},
		{GraphQLField: "allowRemoteRequests", MikroTikField: "allow-remote-requests", Path: "/ip/dns", Type: translator.FieldTypeBool},
		{GraphQLField: "maxUdpPacketSize", MikroTikField: "max-udp-packet-size", Path: "/ip/dns", Type: translator.FieldTypeInt},
		{GraphQLField: "cacheSize", MikroTikField: "cache-size", Path: "/ip/dns", Type: translator.FieldTypeInt},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerDNSStaticMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/dns/static", Type: translator.FieldTypeString},
		{GraphQLField: "address", MikroTikField: "address", Path: "/ip/dns/static", Type: translator.FieldTypeIP},
		{GraphQLField: "type", MikroTikField: "type", Path: "/ip/dns/static", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPServiceMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/service", Type: translator.FieldTypeString},
		{GraphQLField: "port", MikroTikField: "port", Path: "/ip/service", Type: translator.FieldTypeInt},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/ip/service", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPCloudMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "ddnsEnabled", MikroTikField: "ddns-enabled", Path: "/ip/cloud", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPUPnPMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "enabled", MikroTikField: "enabled", Path: "/ip/upnp", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPSocksMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "enabled", MikroTikField: "enabled", Path: "/ip/socks", Type: translator.FieldTypeBool},
		{GraphQLField: "port", MikroTikField: "port", Path: "/ip/socks", Type: translator.FieldTypeInt},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
