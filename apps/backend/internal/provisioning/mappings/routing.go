package mappings

import "backend/internal/translator"

func registerRoutingTableMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/routing/table", Type: translator.FieldTypeString},
		{GraphQLField: "fib", MikroTikField: "fib", Path: "/routing/table", Type: translator.FieldTypeBool},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerRoutingRuleMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "srcAddress", MikroTikField: "src-address", Path: "/routing/rule", Type: translator.FieldTypeIP},
		{GraphQLField: "dstAddress", MikroTikField: "dst-address", Path: "/routing/rule", Type: translator.FieldTypeIP},
		{GraphQLField: "table", MikroTikField: "table", Path: "/routing/rule", Type: translator.FieldTypeString},
		{GraphQLField: "action", MikroTikField: "action", Path: "/routing/rule", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
