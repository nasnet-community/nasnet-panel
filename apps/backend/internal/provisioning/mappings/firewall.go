package mappings

import "backend/internal/translator"

func registerFirewallAddressListMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "list", MikroTikField: "list", Path: "/ip/firewall/address-list", Type: translator.FieldTypeString},
		{GraphQLField: "address", MikroTikField: "address", Path: "/ip/firewall/address-list", Type: translator.FieldTypeString},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/firewall/address-list", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerFirewallMangleMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "chain", MikroTikField: "chain", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "action", MikroTikField: "action", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "newRoutingMark", MikroTikField: "new-routing-mark", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "srcAddress", MikroTikField: "src-address", Path: "/ip/firewall/mangle", Type: translator.FieldTypeIP},
		{GraphQLField: "dstAddress", MikroTikField: "dst-address", Path: "/ip/firewall/mangle", Type: translator.FieldTypeIP},
		{GraphQLField: "protocol", MikroTikField: "protocol", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "srcPort", MikroTikField: "src-port", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "dstPort", MikroTikField: "dst-port", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "inInterface", MikroTikField: "in-interface", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "connectionMark", MikroTikField: "connection-mark", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
		{GraphQLField: "passthrough", MikroTikField: "passthrough", Path: "/ip/firewall/mangle", Type: translator.FieldTypeBool},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/firewall/mangle", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerFirewallNATMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "chain", MikroTikField: "chain", Path: "/ip/firewall/nat", Type: translator.FieldTypeString},
		{GraphQLField: "action", MikroTikField: "action", Path: "/ip/firewall/nat", Type: translator.FieldTypeString},
		{GraphQLField: "outInterface", MikroTikField: "out-interface", Path: "/ip/firewall/nat", Type: translator.FieldTypeString},
		{GraphQLField: "srcAddress", MikroTikField: "src-address", Path: "/ip/firewall/nat", Type: translator.FieldTypeIP},
		{GraphQLField: "toAddresses", MikroTikField: "to-addresses", Path: "/ip/firewall/nat", Type: translator.FieldTypeIP},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/firewall/nat", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerFirewallFilterMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "chain", MikroTikField: "chain", Path: "/ip/firewall/filter", Type: translator.FieldTypeString},
		{GraphQLField: "action", MikroTikField: "action", Path: "/ip/firewall/filter", Type: translator.FieldTypeString},
		{GraphQLField: "protocol", MikroTikField: "protocol", Path: "/ip/firewall/filter", Type: translator.FieldTypeString},
		{GraphQLField: "dstPort", MikroTikField: "dst-port", Path: "/ip/firewall/filter", Type: translator.FieldTypeString},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/firewall/filter", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerFirewallRawMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "chain", MikroTikField: "chain", Path: "/ip/firewall/raw", Type: translator.FieldTypeString},
		{GraphQLField: "action", MikroTikField: "action", Path: "/ip/firewall/raw", Type: translator.FieldTypeString},
		{GraphQLField: "srcAddress", MikroTikField: "src-address", Path: "/ip/firewall/raw", Type: translator.FieldTypeIP},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/ip/firewall/raw", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
