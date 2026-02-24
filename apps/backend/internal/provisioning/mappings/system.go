package mappings

import "backend/internal/translator"

func registerSystemIdentityMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/system/identity", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerSystemScriptMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/system/script", Type: translator.FieldTypeString},
		{GraphQLField: "source", MikroTikField: "source", Path: "/system/script", Type: translator.FieldTypeString},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerSystemSchedulerMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "name", MikroTikField: "name", Path: "/system/scheduler", Type: translator.FieldTypeString},
		{GraphQLField: "onEvent", MikroTikField: "on-event", Path: "/system/scheduler", Type: translator.FieldTypeString},
		{GraphQLField: "startTime", MikroTikField: "start-time", Path: "/system/scheduler", Type: translator.FieldTypeString},
		{GraphQLField: "interval", MikroTikField: "interval", Path: "/system/scheduler", Type: translator.FieldTypeDuration},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}

func registerSystemNTPClientMappings(registry *translator.FieldMappingRegistry) {
	mappings := []*translator.FieldMapping{
		{GraphQLField: "enabled", MikroTikField: "enabled", Path: "/system/ntp/client", Type: translator.FieldTypeBool},
		{GraphQLField: "servers", MikroTikField: "servers", Path: "/system/ntp/client", Type: translator.FieldTypeList},
	}
	for _, m := range mappings {
		registry.Register(m)
	}
}
