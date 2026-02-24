package templates

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"

	"backend/generated/ent"
	"backend/generated/ent/servicetemplate"

	"github.com/oklog/ulid/v2"
	"go.uber.org/zap"
)

// TemplateImporter imports and validates custom templates
type TemplateImporter struct {
	store     *ent.Client
	validator *TemplateValidator
	logger    *zap.Logger
}

// TemplateImporterConfig holds configuration for the template importer
type TemplateImporterConfig struct {
	Store     *ent.Client
	Validator *TemplateValidator
	Logger    *zap.Logger
}

// ImportTemplateRequest contains parameters for importing a template
type ImportTemplateRequest struct {
	RouterID     string
	TemplateJSON string // JSON string of template
	Overwrite    bool   // If true, overwrites existing template with same ID
}

// ImportFromFileRequest contains parameters for importing from a file
type ImportFromFileRequest struct {
	RouterID  string
	FilePath  string
	Overwrite bool
}

// NewTemplateImporter creates a new template importer
func NewTemplateImporter(cfg TemplateImporterConfig) (*TemplateImporter, error) {
	if cfg.Store == nil {
		return nil, fmt.Errorf("ent store is required")
	}
	if cfg.Validator == nil {
		return nil, fmt.Errorf("template validator is required")
	}

	logger := cfg.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &TemplateImporter{
		store:     cfg.Store,
		validator: cfg.Validator,
		logger:    logger,
	}, nil
}

// ImportTemplate imports a template from JSON and saves it to the database
// It validates the template structure and dependencies before saving
func (ti *TemplateImporter) ImportTemplate(ctx context.Context, req ImportTemplateRequest) (*ServiceTemplate, error) {
	if ti == nil {
		return nil, fmt.Errorf("template importer is nil")
	}

	// Parse JSON
	var template ServiceTemplate
	if err := json.Unmarshal([]byte(req.TemplateJSON), &template); err != nil {
		return nil, fmt.Errorf("failed to parse template JSON: %w", err)
	}

	// Validate template structure
	if err := ti.validator.ValidateTemplate(&template); err != nil {
		return nil, fmt.Errorf("template validation failed: %w", err)
	}

	// Validate no circular dependencies
	if err := ti.validator.ValidateDependencies(&template); err != nil {
		return nil, fmt.Errorf("dependency validation failed: %w", err)
	}

	// Validate variable references
	if err := ti.validator.ValidateVariableReferences(&template); err != nil {
		return nil, fmt.Errorf("variable reference validation failed: %w", err)
	}

	// Check version compatibility
	if template.Version == "" {
		return nil, fmt.Errorf("template version is required for import")
	}

	// Check if template already exists
	exists, err := ti.store.ServiceTemplate.Query().
		Where(
			servicetemplate.IDEQ(template.ID),
			servicetemplate.RouterIDEQ(req.RouterID),
		).
		Exist(ctx)

	if err != nil {
		ti.logger.Warn("failed to check template existence", zap.Error(err))
		exists = false
	}

	if exists && !req.Overwrite {
		return nil, fmt.Errorf("template with ID %s already exists (use overwrite=true to replace)", template.ID)
	}

	// Save to database
	if err := ti.saveTemplate(ctx, &template, req.RouterID, req.Overwrite); err != nil {
		return nil, fmt.Errorf("failed to save template: %w", err)
	}

	ti.logger.Info("template imported successfully",
		zap.String("template_id", template.ID),
		zap.String("template_name", template.Name),
		zap.String("router_id", req.RouterID),
		zap.Bool("overwrite", req.Overwrite),
	)

	return &template, nil
}

// ImportFromFile imports a template from a JSON file
func (ti *TemplateImporter) ImportFromFile(ctx context.Context, req ImportFromFileRequest) (*ServiceTemplate, error) {
	if ti == nil {
		return nil, fmt.Errorf("template importer is nil")
	}

	// Read file
	file, err := os.Open(req.FilePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Read contents
	data, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Import template
	return ti.ImportTemplate(ctx, ImportTemplateRequest{
		RouterID:     req.RouterID,
		TemplateJSON: string(data),
		Overwrite:    req.Overwrite,
	})
}

// saveTemplate saves a template to the database
func (ti *TemplateImporter) saveTemplate(ctx context.Context, template *ServiceTemplate, routerID string, overwrite bool) error {
	if ti == nil {
		return fmt.Errorf("template importer is nil")
	}
	if template == nil {
		return fmt.Errorf("template is nil")
	}
	if routerID == "" {
		return fmt.Errorf("router ID is required")
	}

	// Convert template to ENT format
	// Convert services to []map[string]interface{} for ENT JSON field
	servicesData := make([]map[string]interface{}, len(template.Services))
	for i, svc := range template.Services {
		svcJSON, _ := json.Marshal(svc)               //nolint:errcheck,errchkjson // marshal of known types
		_ = json.Unmarshal(svcJSON, &servicesData[i]) //nolint:errcheck // unmarshal of known types
	}

	configVarsData := make([]map[string]interface{}, len(template.ConfigVariables))
	for i, v := range template.ConfigVariables {
		vJSON, _ := json.Marshal(v)                   //nolint:errcheck,errchkjson // marshal of known types
		_ = json.Unmarshal(vJSON, &configVarsData[i]) //nolint:errcheck // unmarshal of known types
	}

	suggestedRoutingData := make([]map[string]interface{}, len(template.SuggestedRouting))
	for i, r := range template.SuggestedRouting {
		rJSON, _ := json.Marshal(r)                         //nolint:errcheck,errchkjson // marshal of known types
		_ = json.Unmarshal(rJSON, &suggestedRoutingData[i]) //nolint:errcheck // unmarshal of known types
	}

	resourcesData := make(map[string]interface{})
	if resJSON, err := json.Marshal(template.EstimatedResources); err == nil {
		_ = json.Unmarshal(resJSON, &resourcesData) //nolint:errcheck // best-effort conversion to ENT format
	}

	// Generate new ID if template doesn't have one
	templateID := template.ID
	if templateID == "" {
		templateID = ulid.Make().String()
	}

	// Convert category and scope to ENT enum types
	category := servicetemplate.Category(template.Category)
	scope := servicetemplate.Scope(template.Scope)

	if overwrite {
		// Delete existing template if it exists
		_, err := ti.store.ServiceTemplate.Delete().
			Where(servicetemplate.IDEQ(templateID)).
			Exec(ctx)

		if err != nil {
			ti.logger.Warn("failed to delete existing template (may not exist)", zap.Error(err))
		}
	}

	// Create new template record
	_, err := ti.store.ServiceTemplate.Create().
		SetID(templateID).
		SetName(template.Name).
		SetDescription(template.Description).
		SetCategory(category).
		SetScope(scope).
		SetVersion(template.Version).
		SetAuthor(template.Author).
		SetTags(template.Tags).
		SetServices(servicesData).
		SetConfigVariables(configVarsData).
		SetSuggestedRouting(suggestedRoutingData).
		SetEstimatedResources(resourcesData).
		SetPrerequisites(template.Prerequisites).
		SetDocumentation(template.Documentation).
		SetExamples(template.Examples).
		SetRouterID(routerID).
		Save(ctx)

	if err != nil {
		return fmt.Errorf("failed to create template record: %w", err)
	}

	ti.logger.Debug("template saved to database",
		zap.String("template_id", templateID),
		zap.String("router_id", routerID),
	)

	return nil
}

// ExportTemplateToJSON exports a template to JSON string
func (ti *TemplateImporter) ExportTemplateToJSON(template *ServiceTemplate) (string, error) {
	if ti == nil {
		return "", fmt.Errorf("template importer is nil")
	}
	if template == nil {
		return "", fmt.Errorf("template is nil")
	}

	// Pretty-print JSON for human readability
	data, err := json.MarshalIndent(template, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal template: %w", err)
	}

	return string(data), nil
}

// ExportTemplateToFile exports a template to a JSON file
func (ti *TemplateImporter) ExportTemplateToFile(template *ServiceTemplate, filePath string) error {
	if ti == nil {
		return fmt.Errorf("template importer is nil")
	}
	if template == nil {
		return fmt.Errorf("template is nil")
	}
	if filePath == "" {
		return fmt.Errorf("file path is required")
	}

	// Generate JSON
	jsonStr, err := ti.ExportTemplateToJSON(template)
	if err != nil {
		return err
	}

	// Write to file
	if err := os.WriteFile(filePath, []byte(jsonStr), 0o644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	ti.logger.Info("template exported to file",
		zap.String("template_id", template.ID),
		zap.String("file_path", filePath),
	)

	return nil
}

// ListCustomTemplates returns all user-created templates for a router
func (ti *TemplateImporter) ListCustomTemplates(ctx context.Context, routerID string) ([]*ServiceTemplate, error) {
	if ti == nil {
		return nil, fmt.Errorf("template importer is nil")
	}
	if routerID == "" {
		return nil, fmt.Errorf("router ID is required")
	}

	// Query templates from database
	entTemplates, err := ti.store.ServiceTemplate.Query().
		Where(
			servicetemplate.RouterIDEQ(routerID),
		).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to query templates: %w", err)
	}

	// Convert ENT templates to ServiceTemplate
	templates := make([]*ServiceTemplate, 0, len(entTemplates))
	for _, entTemplate := range entTemplates {
		template, err := ti.convertFromENT(entTemplate)
		if err != nil {
			ti.logger.Warn("failed to convert template, skipping",
				zap.Error(err),
				zap.String("template_id", entTemplate.ID),
			)
			continue
		}
		templates = append(templates, template)
	}

	return templates, nil
}

// DeleteCustomTemplate deletes a user-created template
func (ti *TemplateImporter) DeleteCustomTemplate(ctx context.Context, routerID, templateID string) error {
	if ti == nil {
		return fmt.Errorf("template importer is nil")
	}
	if routerID == "" {
		return fmt.Errorf("router ID is required")
	}
	if templateID == "" {
		return fmt.Errorf("template ID is required")
	}

	// Delete template
	deleted, err := ti.store.ServiceTemplate.Delete().
		Where(
			servicetemplate.IDEQ(templateID),
			servicetemplate.RouterIDEQ(routerID),
		).
		Exec(ctx)

	if err != nil {
		return fmt.Errorf("failed to delete template: %w", err)
	}

	if deleted == 0 {
		return fmt.Errorf("template not found or doesn't belong to this router")
	}

	ti.logger.Info("custom template deleted",
		zap.String("template_id", templateID),
		zap.String("router_id", routerID),
	)

	return nil
}

// convertFromENT converts an ENT ServiceTemplate to internal ServiceTemplate type
func (ti *TemplateImporter) convertFromENT(entTemplate *ent.ServiceTemplate) (*ServiceTemplate, error) {
	if ti == nil {
		return nil, fmt.Errorf("template importer is nil")
	}
	if entTemplate == nil {
		return nil, fmt.Errorf("ent template is nil")
	}

	// Convert []map[string]interface{} back to typed structs
	var services []ServiceSpec
	if svcJSON, err := json.Marshal(entTemplate.Services); err == nil {
		if err := json.Unmarshal(svcJSON, &services); err != nil {
			return nil, fmt.Errorf("failed to unmarshal services: %w", err)
		}
	}

	var configVariables []TemplateVariable
	if varJSON, err := json.Marshal(entTemplate.ConfigVariables); err == nil {
		if err := json.Unmarshal(varJSON, &configVariables); err != nil {
			return nil, fmt.Errorf("failed to unmarshal config variables: %w", err)
		}
	}

	var suggestedRouting []SuggestedRoutingRule
	if routeJSON, err := json.Marshal(entTemplate.SuggestedRouting); err == nil {
		if err := json.Unmarshal(routeJSON, &suggestedRouting); err != nil {
			return nil, fmt.Errorf("failed to unmarshal suggested routing: %w", err)
		}
	}

	var estimatedResources ResourceEstimate
	if resJSON, err := json.Marshal(entTemplate.EstimatedResources); err == nil {
		if err := json.Unmarshal(resJSON, &estimatedResources); err != nil {
			return nil, fmt.Errorf("failed to unmarshal estimated resources: %w", err)
		}
	}

	return &ServiceTemplate{
		ID:                 entTemplate.ID,
		Name:               entTemplate.Name,
		Description:        entTemplate.Description,
		Category:           TemplateCategory(entTemplate.Category),
		Scope:              TemplateScope(entTemplate.Scope),
		Version:            entTemplate.Version,
		Author:             entTemplate.Author,
		Tags:               entTemplate.Tags,
		Services:           services,
		ConfigVariables:    configVariables,
		SuggestedRouting:   suggestedRouting,
		EstimatedResources: estimatedResources,
		Prerequisites:      entTemplate.Prerequisites,
		Documentation:      entTemplate.Documentation,
		Examples:           entTemplate.Examples,
	}, nil
}
