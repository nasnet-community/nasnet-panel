package mappings

import "backend/internal/translator"

// RegisterProvisioningMappings registers all RouterOS path field mappings
// needed for the provisioning module (WAN links, VPN clients/servers, tunnels,
// multi-WAN, four-network architecture, system configuration).
func RegisterProvisioningMappings(registry *translator.FieldMappingRegistry) {
	registerInterfaceMappings(registry)
	registerIPMappings(registry)
	registerFirewallMappings(registry)
	registerRoutingMappings(registry)
	registerIPSecMappings(registry)
	registerSystemMappings(registry)
	registerPPPMappings(registry)
}

func registerInterfaceMappings(registry *translator.FieldMappingRegistry) {
	registerWireGuardMappings(registry)
	registerWireGuardPeersMappings(registry)
	registerBridgeMappings(registry)
	registerBridgePortMappings(registry)
	registerPPPoEClientMappings(registry)
	registerL2TPClientMappings(registry)
	registerSSTPClientMappings(registry)
	registerPPTPClientMappings(registry)
	registerOpenVPNClientMappings(registry)
	registerVLANMappings(registry)
	registerIPIPMappings(registry)
	registerEoIPMappings(registry)
	registerGREMappings(registry)
	registerVXLANMappings(registry)
	registerInterfaceListMappings(registry)
	registerInterfaceListMemberMappings(registry)
	registerLTEAPNMappings(registry)
}

func registerIPMappings(registry *translator.FieldMappingRegistry) {
	registerIPPoolMappings(registry)
	registerIPRouteMappings(registry)
	registerDHCPServerMappings(registry)
	registerDHCPServerNetworkMappings(registry)
	registerDHCPClientMappings(registry)
	registerDNSMappings(registry)
	registerDNSStaticMappings(registry)
	registerIPServiceMappings(registry)
	registerIPCloudMappings(registry)
	registerIPUPnPMappings(registry)
	registerIPSocksMappings(registry)
}

func registerFirewallMappings(registry *translator.FieldMappingRegistry) {
	registerFirewallAddressListMappings(registry)
	registerFirewallMangleMappings(registry)
	registerFirewallNATMappings(registry)
	registerFirewallFilterMappings(registry)
	registerFirewallRawMappings(registry)
}

func registerRoutingMappings(registry *translator.FieldMappingRegistry) {
	registerRoutingTableMappings(registry)
	registerRoutingRuleMappings(registry)
}

func registerIPSecMappings(registry *translator.FieldMappingRegistry) {
	registerIPSecProfileMappings(registry)
	registerIPSecPeerMappings(registry)
	registerIPSecProposalMappings(registry)
	registerIPSecIdentityMappings(registry)
	registerIPSecModeConfigMappings(registry)
	registerIPSecPolicyMappings(registry)
}

func registerSystemMappings(registry *translator.FieldMappingRegistry) {
	registerSystemIdentityMappings(registry)
	registerSystemScriptMappings(registry)
	registerSystemSchedulerMappings(registry)
	registerSystemNTPClientMappings(registry)
}

func registerPPPMappings(registry *translator.FieldMappingRegistry) {
	registerPPPProfileMappings(registry)
	registerPPPSecretMappings(registry)
}
