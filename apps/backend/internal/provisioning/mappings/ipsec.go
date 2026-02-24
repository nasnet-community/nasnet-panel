package mappings

import "backend/internal/translator"

func registerIPSecProfileMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/ipsec/profile", Type: translator.FieldTypeString},
		{GraphQLField: "hashAlgorithm", MikroTikField: "hash-algorithm", Path: "/ip/ipsec/profile", Type: translator.FieldTypeString},
		{GraphQLField: "encAlgorithm", MikroTikField: "enc-algorithm", Path: "/ip/ipsec/profile", Type: translator.FieldTypeString},
		{GraphQLField: "dhGroup", MikroTikField: "dh-group", Path: "/ip/ipsec/profile", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPSecPeerMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/ipsec/peer", Type: translator.FieldTypeString},
		{GraphQLField: "address", MikroTikField: "address", Path: "/ip/ipsec/peer", Type: translator.FieldTypeString},
		{GraphQLField: "profile", MikroTikField: "profile", Path: "/ip/ipsec/peer", Type: translator.FieldTypeString},
		{GraphQLField: "exchangeMode", MikroTikField: "exchange-mode", Path: "/ip/ipsec/peer", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPSecProposalMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/ipsec/proposal", Type: translator.FieldTypeString},
		{GraphQLField: "authAlgorithms", MikroTikField: "auth-algorithms", Path: "/ip/ipsec/proposal", Type: translator.FieldTypeString},
		{GraphQLField: "encAlgorithms", MikroTikField: "enc-algorithms", Path: "/ip/ipsec/proposal", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPSecIdentityMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "peer", MikroTikField: "peer", Path: "/ip/ipsec/identity", Type: translator.FieldTypeString},
		{GraphQLField: "authMethod", MikroTikField: "auth-method", Path: "/ip/ipsec/identity", Type: translator.FieldTypeString},
		{GraphQLField: "secret", MikroTikField: "secret", Path: "/ip/ipsec/identity", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPSecModeConfigMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ip/ipsec/mode-config", Type: translator.FieldTypeString},
		{GraphQLField: "addressPool", MikroTikField: "address-pool", Path: "/ip/ipsec/mode-config", Type: translator.FieldTypeString},
		{GraphQLField: "splitInclude", MikroTikField: "split-include", Path: "/ip/ipsec/mode-config", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerIPSecPolicyMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "srcAddress", MikroTikField: "src-address", Path: "/ip/ipsec/policy", Type: translator.FieldTypeIP},
		{GraphQLField: "dstAddress", MikroTikField: "dst-address", Path: "/ip/ipsec/policy", Type: translator.FieldTypeIP},
		{GraphQLField: "proposal", MikroTikField: "proposal", Path: "/ip/ipsec/policy", Type: translator.FieldTypeString},
		{GraphQLField: "action", MikroTikField: "action", Path: "/ip/ipsec/policy", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
