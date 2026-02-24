package mappings

import "backend/internal/translator"

func registerPPPProfileMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ppp/profile", Type: translator.FieldTypeString},
		{GraphQLField: "localAddress", MikroTikField: "local-address", Path: "/ppp/profile", Type: translator.FieldTypeString},
		{GraphQLField: "remoteAddress", MikroTikField: "remote-address", Path: "/ppp/profile", Type: translator.FieldTypeString},
		{GraphQLField: "dnsServer", MikroTikField: "dns-server", Path: "/ppp/profile", Type: translator.FieldTypeString},
		{GraphQLField: "useEncryption", MikroTikField: "use-encryption", Path: "/ppp/profile", Type: translator.FieldTypeString},
		{GraphQLField: "bridge", MikroTikField: "bridge", Path: "/ppp/profile", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerPPPSecretMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/ppp/secret", Type: translator.FieldTypeString},
		{GraphQLField: "password", MikroTikField: "password", Path: "/ppp/secret", Type: translator.FieldTypeString},
		{GraphQLField: "profile", MikroTikField: "profile", Path: "/ppp/secret", Type: translator.FieldTypeString},
		{GraphQLField: "service", MikroTikField: "service", Path: "/ppp/secret", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
