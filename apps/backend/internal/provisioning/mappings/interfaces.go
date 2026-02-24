package mappings

import "backend/internal/translator"

func registerWireGuardMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/wireguard", Type: translator.FieldTypeString},
		{GraphQLField: "privateKey", MikroTikField: "private-key", Path: "/interface/wireguard", Type: translator.FieldTypeString},
		{GraphQLField: "listenPort", MikroTikField: "listen-port", Path: "/interface/wireguard", Type: translator.FieldTypeInt},
		{GraphQLField: "mtu", MikroTikField: "mtu", Path: "/interface/wireguard", Type: translator.FieldTypeInt},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/interface/wireguard", Type: translator.FieldTypeString},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/interface/wireguard", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

//nolint:dupl // Same registration pattern as ip.go functions, different fields and paths
func registerWireGuardPeersMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/interface/wireguard/peers", Type: translator.FieldTypeString},
		{GraphQLField: "publicKey", MikroTikField: "public-key", Path: "/interface/wireguard/peers", Type: translator.FieldTypeString},
		{GraphQLField: "endpointAddress", MikroTikField: "endpoint-address", Path: "/interface/wireguard/peers", Type: translator.FieldTypeString},
		{GraphQLField: "endpointPort", MikroTikField: "endpoint-port", Path: "/interface/wireguard/peers", Type: translator.FieldTypeInt},
		{GraphQLField: "allowedAddress", MikroTikField: "allowed-address", Path: "/interface/wireguard/peers", Type: translator.FieldTypeList},
		{GraphQLField: "presharedKey", MikroTikField: "preshared-key", Path: "/interface/wireguard/peers", Type: translator.FieldTypeString},
		{GraphQLField: "persistentKeepalive", MikroTikField: "persistent-keepalive", Path: "/interface/wireguard/peers", Type: translator.FieldTypeDuration},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/interface/wireguard/peers", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerBridgeMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/bridge", Type: translator.FieldTypeString},
		{GraphQLField: "comment", MikroTikField: "comment", Path: "/interface/bridge", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerBridgePortMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "bridge", MikroTikField: "bridge", Path: "/interface/bridge/port", Type: translator.FieldTypeString},
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/interface/bridge/port", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerPPPoEClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/pppoe-client", Type: translator.FieldTypeString},
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/interface/pppoe-client", Type: translator.FieldTypeString},
		{GraphQLField: "user", MikroTikField: "user", Path: "/interface/pppoe-client", Type: translator.FieldTypeString},
		{GraphQLField: "password", MikroTikField: "password", Path: "/interface/pppoe-client", Type: translator.FieldTypeString},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/interface/pppoe-client", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerL2TPClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/l2tp-client", Type: translator.FieldTypeString},
		{GraphQLField: "connectTo", MikroTikField: "connect-to", Path: "/interface/l2tp-client", Type: translator.FieldTypeString},
		{GraphQLField: "user", MikroTikField: "user", Path: "/interface/l2tp-client", Type: translator.FieldTypeString},
		{GraphQLField: "password", MikroTikField: "password", Path: "/interface/l2tp-client", Type: translator.FieldTypeString},
		{GraphQLField: "disabled", MikroTikField: "disabled", Path: "/interface/l2tp-client", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerSSTPClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/sstp-client", Type: translator.FieldTypeString},
		{GraphQLField: "connectTo", MikroTikField: "connect-to", Path: "/interface/sstp-client", Type: translator.FieldTypeString},
		{GraphQLField: "user", MikroTikField: "user", Path: "/interface/sstp-client", Type: translator.FieldTypeString},
		{GraphQLField: "password", MikroTikField: "password", Path: "/interface/sstp-client", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerPPTPClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/pptp-client", Type: translator.FieldTypeString},
		{GraphQLField: "connectTo", MikroTikField: "connect-to", Path: "/interface/pptp-client", Type: translator.FieldTypeString},
		{GraphQLField: "user", MikroTikField: "user", Path: "/interface/pptp-client", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerOpenVPNClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/ovpn-client", Type: translator.FieldTypeString},
		{GraphQLField: "connectTo", MikroTikField: "connect-to", Path: "/interface/ovpn-client", Type: translator.FieldTypeString},
		{GraphQLField: "user", MikroTikField: "user", Path: "/interface/ovpn-client", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerVLANMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/vlan", Type: translator.FieldTypeString},
		{GraphQLField: "vlanId", MikroTikField: "vlan-id", Path: "/interface/vlan", Type: translator.FieldTypeInt},
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/interface/vlan", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPIPMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/ipip", Type: translator.FieldTypeString},
		{GraphQLField: "localAddress", MikroTikField: "local-address", Path: "/interface/ipip", Type: translator.FieldTypeIP},
		{GraphQLField: "remoteAddress", MikroTikField: "remote-address", Path: "/interface/ipip", Type: translator.FieldTypeIP},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerEoIPMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "tunnelId", MikroTikField: "tunnel-id", Path: "/interface/eoip", Type: translator.FieldTypeInt},
		{GraphQLField: "remoteAddress", MikroTikField: "remote-address", Path: "/interface/eoip", Type: translator.FieldTypeIP},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerGREMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "remoteAddress", MikroTikField: "remote-address", Path: "/interface/gre", Type: translator.FieldTypeIP},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerVXLANMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "vni", MikroTikField: "vni", Path: "/interface/vxlan", Type: translator.FieldTypeInt},
		{GraphQLField: "port", MikroTikField: "port", Path: "/interface/vxlan", Type: translator.FieldTypeInt},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerInterfaceListMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/list", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerInterfaceListMemberMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "list", MikroTikField: "list", Path: "/interface/list/member", Type: translator.FieldTypeString},
		{GraphQLField: "interface", MikroTikField: "interface", Path: "/interface/list/member", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerLTEAPNMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/interface/lte/apn", Type: translator.FieldTypeString},
		{GraphQLField: "apn", MikroTikField: "apn", Path: "/interface/lte/apn", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
