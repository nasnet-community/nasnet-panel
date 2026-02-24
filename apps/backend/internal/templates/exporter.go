package templates

import (
	"context"
	"fmt"
	"strings"

	"backend/generated/ent"
	"backend/generated/ent/servicedependency"
	"backend/generated/ent/serviceinstance"

	"go.uber.org/zap"
)

// TemplateExporter exports running service instances as reusable templates
type TemplateExporter struct {
	store  *ent.Client
	logger *zap.Logger
}

// TemplateExporterConfig holds configuration for the template exporter
type TemplateExporterConfig struct {
	Store  *ent.Client
	Logger *zap.Logger
}

// ExportTemplateRequest contains parameters for exporting a template
type ExportTemplateRequest struct {
	InstanceIDs  []string // One or more instances to export as template
	RouterID     string
	TemplateName string
	Description  string
	Category     string
	Author       string
	Tags         []string
}

// NewTemplateExporter creates a new template exporter
func NewTemplateExporter(cfg TemplateExporterConfig) (*TemplateExporter, error) {
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}

	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &TemplateExporter{
		store:  cfg.Store,
		logger: logger,
	}, nil
}

// ExportAsTemplate exports running instance(s) as a reusable template
// For single instance: creates a single-scope template
// For multiple instances: creates a multi-scope template with dependencies
func (te *TemplateExporter) ExportAsTemplate(ctx context.Context, req ExportTemplateRequest) (*ServiceTemplate, error) { //nolint:gocyclo,maintidx // template export logic
	if te == nil {
		return nil, fmt.Errorf("template exporter is nil")
	}
	if len(req.InstanceIDs) == 0 {
		return nil, fmt.Errorf("at least one instance ID is required")
	}

	// Get all instances
	instances, err := te.store.ServiceInstance.Query().
		Where(
			serviceinstance.IDIn(req.InstanceIDs...),
			serviceinstance.RouterID(req.RouterID),
		).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query instances: %w", err)
	}

	if len(instances) != len(req.InstanceIDs) {
		return nil, fmt.Errorf("some instances not found or don't belong to this router")
	}

	// Determine scope
	scope := ScopeSingle
	if len(instances) > 1 {
		scope = ScopeMultiple
	}

	// Build service specs from instances
	services := make([]ServiceSpec, 0, len(instances))
	configVariables := make([]TemplateVariable, 0)
	variableMap := make(map[string]bool) // Track unique variables

	for _, instance := range instances {
		// Extract config as overrides
		// Variables will be extracted from config values
		configOverrides := make(map[string]interface{})
		extractedVars := make(map[string]TemplateVariable)

		for key, value := range instance.Config {
			// Parameterize common config values as variables
			varName := te.generateVariableName(instance.FeatureID, key)

			// Add as variable if not already present
			if !variableMap[varName] {
				variable := TemplateVariable{
					Name:        varName,
					Type:        te.inferVariableType(value),
					Required:    false,
					Default:     value,
					Description: fmt.Sprintf("Configuration value for %s", key),
					Label:       te.humanizeKey(key),
				}

				extractedVars[varName] = variable
				variableMap[varName] = true
			}

			// Replace value with variable reference
			configOverrides[key] = fmt.Sprintf("{{%s}}", varName)
		}

		// Add extracted variables to template
		for _, variable := range extractedVars {
			configVariables = append(configVariables, variable)
		}

		// Determine if service requires bridge
		// This is a heuristic based on service type
		requiresBridge := te.requiresBridge(instance.FeatureID)

		// Build service spec
		serviceSpec := ServiceSpec{
			ServiceType:     instance.FeatureID,
			Name:            fmt.Sprintf("{{%s_NAME}}", strings.ToUpper(instance.FeatureID)),
			ConfigOverrides: configOverrides,
			MemoryLimitMB:   256, // Default, will be resolved from MEMORY_LIMIT variable
			CPUShares:       512,
			RequiresBridge:  requiresBridge,
			PortMappings:    te.extractPortMappings(instance),
		}

		services = append(services, serviceSpec)
	}

	// Add common variables (name, memory limit)
	for _, instance := range instances {
		nameVar := fmt.Sprintf("%s_NAME", strings.ToUpper(instance.FeatureID))
		if !variableMap[nameVar] {
			configVariables = append(configVariables, TemplateVariable{
				Name:              nameVar,
				Type:              VarTypeString,
				Required:          true,
				Default:           instance.InstanceName,
				Description:       fmt.Sprintf("Name for the %s instance", instance.FeatureID),
				Label:             "Service Name",
				ValidationPattern: "^[a-z0-9-]{3,32}$",
			})
			variableMap[nameVar] = true
		}
	}

	// Add memory limit variable
	if !variableMap["MEMORY_LIMIT"] {
		minVal := float64(64)
		maxVal := float64(1024)
		configVariables = append(configVariables, TemplateVariable{
			Name:        "MEMORY_LIMIT",
			Type:        VarTypeNumber,
			Required:    false,
			Default:     256,
			Description: "Memory limit in MB",
			Label:       "Memory Limit (MB)",
			MinValue:    &minVal,
			MaxValue:    &maxVal,
		})
	}

	// Extract dependency graph if multi-service
	suggestedRouting := []SuggestedRoutingRule{}
	if len(instances) > 1 { //nolint:nestif // template field validation
		// Query dependencies
		deps, err := te.store.ServiceDependency.Query().
			Where(
				servicedependency.FromInstanceIDIn(req.InstanceIDs...),
				servicedependency.ToInstanceIDIn(req.InstanceIDs...),
			).
			All(ctx)

		if err != nil {
			te.logger.Warn("failed to query dependencies for template export", zap.Error(err))
		} else {
			// Convert dependencies to suggested routing rules
			instanceNameMap := make(map[string]string)
			for _, inst := range instances {
				instanceNameMap[inst.ID] = inst.InstanceName
			}

			for _, dep := range deps {
				fromName := instanceNameMap[dep.FromInstanceID]
				toName := instanceNameMap[dep.ToInstanceID]

				if fromName != "" && toName != "" {
					suggestedRouting = append(suggestedRouting, SuggestedRoutingRule{
						DevicePattern: "*",
						TargetService: toName,
						Protocol:      "all",
						Description:   fmt.Sprintf("Route traffic through %s", toName),
					})
				}
			}
		}
	}

	// Calculate resource estimates
	totalMemory := 0
	totalCPU := 0
	totalPorts := 0
	totalVLANs := 0

	for _, instance := range instances {
		if instance.MemoryLimit != nil {
			totalMemory += int(*instance.MemoryLimit / (1024 * 1024)) // Convert bytes to MB
		}
		totalPorts += len(instance.Ports)
		if instance.VlanID != nil {
			totalVLANs++
		}
		totalCPU += 512 // Default CPU shares
	}

	estimatedResources := ResourceEstimate{
		TotalMemoryMB:  totalMemory,
		TotalCPUShares: totalCPU,
		DiskSpaceMB:    100 * len(instances), // Estimate 100MB per service
		NetworkPorts:   totalPorts,
		VLANsRequired:  totalVLANs,
	}

	// Parse category
	category := TemplateCategory(req.Category)
	if category == "" {
		category = CategoryNetworking // Default category
	}

	// Build template
	template := &ServiceTemplate{
		ID:                 generateTemplateID(req.TemplateName),
		Name:               req.TemplateName,
		Description:        req.Description,
		Category:           category,
		Scope:              scope,
		Version:            "1.0.0",
		Author:             req.Author,
		Tags:               req.Tags,
		Services:           services,
		ConfigVariables:    configVariables,
		SuggestedRouting:   suggestedRouting,
		EstimatedResources: estimatedResources,
		Prerequisites:      te.generatePrerequisites(instances, estimatedResources),
		Documentation:      te.generateDocumentation(instances, scope),
		Examples:           te.generateExamples(instances),
	}

	te.logger.Info("template exported successfully",
		zap.String("template_id", template.ID),
		zap.String("template_name", template.Name),
		zap.Int("services", len(services)),
		zap.Int("variables", len(configVariables)),
		zap.String("scope", string(scope)),
	)

	return template, nil
}

// Helper functions

func (te *TemplateExporter) generateVariableName(_ string, configKey string) string { //nolint:gocritic // paramTypeCombine produces less readable code
	// Convert config key to uppercase variable name
	// Example: "bind_port" -> "BIND_PORT"
	upper := strings.ToUpper(configKey)
	sanitized := strings.ReplaceAll(upper, "-", "_")
	return sanitized
}

func (te *TemplateExporter) humanizeKey(key string) string {
	if key == "" {
		return ""
	}

	// Convert snake_case to Title Case
	// Example: "bind_port" -> "Bind Port"
	words := strings.Split(key, "_")
	for i, word := range words {
		if word != "" {
			words[i] = strings.ToUpper(string(strings.ToLower(word)[0])) + strings.ToLower(word)[1:]
		}
	}
	return strings.Join(words, " ")
}

func (te *TemplateExporter) inferVariableType(value interface{}) VariableType {
	switch v := value.(type) {
	case bool:
		return VarTypeBoolean
	case int, int32, int64, float32, float64:
		return VarTypeNumber
	case string:
		// Check if it looks like a port
		if strings.Contains(strings.ToLower(v), "port") {
			return VarTypePort
		}
		return VarTypeString
	default:
		return VarTypeString
	}
}

func (te *TemplateExporter) requiresBridge(featureID string) bool {
	// Services that typically require network bridge
	bridgeServices := map[string]bool{
		"tor":     true,
		"xray":    true,
		"singbox": true,
		"mtproxy": true,
		"psiphon": true,
		"adguard": false,
	}

	required, ok := bridgeServices[featureID]
	if !ok {
		return false // Default to no bridge
	}
	return required
}

func (te *TemplateExporter) extractPortMappings(instance *ent.ServiceInstance) []Port {
	if instance == nil {
		return []Port{}
	}

	mappings := make([]Port, 0, len(instance.Ports))

	for i, portNum := range instance.Ports {
		mappings = append(mappings, Port{
			Internal: portNum,
			External: portNum,
			Protocol: "tcp",
			Purpose:  fmt.Sprintf("Service port %d", i+1),
		})
	}

	return mappings
}

func (te *TemplateExporter) generatePrerequisites(_ []*ent.ServiceInstance, resources ResourceEstimate) []string {
	if resources.TotalMemoryMB < 0 {
		return []string{"Invalid resource estimate"}
	}

	prereqs := []string{
		fmt.Sprintf("At least %dMB free memory", resources.TotalMemoryMB),
	}

	if resources.NetworkPorts > 0 {
		prereqs = append(prereqs, fmt.Sprintf("%d available network ports", resources.NetworkPorts))
	}

	if resources.VLANsRequired > 0 {
		prereqs = append(prereqs, fmt.Sprintf("%d available VLAN IDs", resources.VLANsRequired))
	}

	return prereqs
}

func (te *TemplateExporter) generateDocumentation(instances []*ent.ServiceInstance, scope TemplateScope) string {
	if len(instances) == 0 {
		return "No service instances provided for documentation"
	}

	var doc strings.Builder
	doc.WriteString("This template was exported from running service instances.\n\n")

	if scope == ScopeSingle {
		if len(instances) > 0 {
			fmt.Fprintf(&doc, "**Service:** %s\n\n", instances[0].FeatureID)
		}
	} else {
		doc.WriteString("**Services:**\n")
		for _, inst := range instances {
			fmt.Fprintf(&doc, "- %s (%s)\n", inst.InstanceName, inst.FeatureID)
		}
		doc.WriteString("\n")
	}

	doc.WriteString("**Setup:**\n")
	doc.WriteString("1. Customize configuration variables as needed\n")
	doc.WriteString("2. Deploy the template to your router\n")
	doc.WriteString("3. Services will be installed and configured automatically\n")

	return doc.String()
}

func (te *TemplateExporter) generateExamples(instances []*ent.ServiceInstance) []string {
	if len(instances) == 0 {
		return []string{}
	}

	examples := make([]string, 0, len(instances))

	for _, inst := range instances {
		if inst != nil {
			examples = append(examples, fmt.Sprintf("Deploy %s for %s", inst.FeatureID, inst.InstanceName))
		}
	}

	return examples
}

func generateTemplateID(name string) string {
	// Convert name to lowercase kebab-case
	lower := strings.ToLower(name)
	sanitized := strings.ReplaceAll(lower, " ", "-")
	sanitized = strings.ReplaceAll(sanitized, "_", "-")
	return sanitized
}
