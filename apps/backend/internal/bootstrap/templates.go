package bootstrap

import (
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/templates"
)

// TemplateComponents holds all initialized template system components.
type TemplateComponents struct {
	TemplateService   *templates.TemplateService
	TemplateValidator *templates.TemplateValidator
	TemplateInstaller *templates.TemplateInstaller
	TemplateExporter  *templates.TemplateExporter
	TemplateImporter  *templates.TemplateImporter
}

// InitializeTemplateSystem creates and initializes the service template system.
// This includes:
// - Template service (loads built-in templates and manages custom templates)
// - Template validator (validates template structure and dependencies)
// - Template installer (orchestrates template installation)
// - Template exporter (exports running instances as templates)
// - Template importer (imports and validates custom templates)
func InitializeTemplateSystem(
	systemDB *ent.Client,
	eventBus events.EventBus,
	instanceManager *lifecycle.InstanceManager,
	dependencyManager *dependencies.DependencyManager,
	logger *zap.Logger,
) (*TemplateComponents, error) {

	logger.Info("Initializing service template system")

	// 1. Template Service - loads built-in templates and manages custom templates
	serviceTemplateService, err := templates.NewTemplateService(templates.TemplateServiceConfig{
		InstanceManager:   instanceManager,
		DependencyManager: dependencyManager,
		EventBus:          eventBus,
		Logger:            logger,
	})
	if err != nil {
		return nil, err
	}
	logger.Info("Service template service initialized")

	// 2. Template Validator - validates template structure and dependencies
	templateValidator := templates.NewTemplateValidator(templates.TemplateValidatorConfig{
		Logger: logger,
	})
	logger.Info("Template validator initialized")

	// 3. Template Installer - orchestrates template installation with dependency ordering
	templateInstaller, err := templates.NewTemplateInstaller(templates.TemplateInstallerConfig{
		TemplateService:   serviceTemplateService,
		InstanceManager:   instanceManager,
		DependencyManager: dependencyManager,
		EventBus:          eventBus,
		Logger:            logger,
	})
	if err != nil {
		return nil, err
	}
	logger.Info("Template installer initialized")

	// 4. Template Exporter - exports running instances as reusable templates
	templateExporter, err := templates.NewTemplateExporter(templates.TemplateExporterConfig{
		Store:  systemDB,
		Logger: logger,
	})
	if err != nil {
		return nil, err
	}
	logger.Info("Template exporter initialized")

	// 5. Template Importer - imports and validates custom templates
	templateImporter, err := templates.NewTemplateImporter(templates.TemplateImporterConfig{
		Store:     systemDB,
		Validator: templateValidator,
		Logger:    logger,
	})
	if err != nil {
		return nil, err
	}
	logger.Info("Template importer initialized")
	logger.Info("Service template system initialized successfully")

	return &TemplateComponents{
		TemplateService:   serviceTemplateService,
		TemplateValidator: templateValidator,
		TemplateInstaller: templateInstaller,
		TemplateExporter:  templateExporter,
		TemplateImporter:  templateImporter,
	}, nil
}
