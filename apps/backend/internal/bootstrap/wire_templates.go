//go:build wireinject
// +build wireinject

package bootstrap

import (
	"github.com/google/wire"
	"go.uber.org/zap"

	"backend/generated/ent"
	"backend/internal/events"
	"backend/internal/orchestrator/dependencies"
	"backend/internal/orchestrator/lifecycle"
	"backend/internal/templates"
)

// provideTemplateService creates the template service for managing service templates.
func provideTemplateService(
	instanceManager *lifecycle.InstanceManager,
	dependencyManager *dependencies.DependencyManager,
	eventBus events.EventBus,
	logger *zap.Logger,
) (*templates.TemplateService, error) {
	return templates.NewTemplateService(templates.TemplateServiceConfig{
		InstanceManager:   instanceManager,
		DependencyManager: dependencyManager,
		EventBus:          eventBus,
		Logger:            logger,
	})
}

// provideTemplateValidator creates the template validator.
func provideTemplateValidator(
	logger *zap.Logger,
) *templates.TemplateValidator {
	return templates.NewTemplateValidator(templates.TemplateValidatorConfig{
		Logger: logger,
	})
}

// provideTemplateInstaller creates the template installer.
func provideTemplateInstaller(
	templateService *templates.TemplateService,
	instanceManager *lifecycle.InstanceManager,
	dependencyManager *dependencies.DependencyManager,
	eventBus events.EventBus,
	logger *zap.Logger,
) (*templates.TemplateInstaller, error) {
	return templates.NewTemplateInstaller(templates.TemplateInstallerConfig{
		TemplateService:   templateService,
		InstanceManager:   instanceManager,
		DependencyManager: dependencyManager,
		EventBus:          eventBus,
		Logger:            logger,
	})
}

// provideTemplateExporter creates the template exporter.
func provideTemplateExporter(
	systemDB *ent.Client,
	logger *zap.Logger,
) (*templates.TemplateExporter, error) {
	return templates.NewTemplateExporter(templates.TemplateExporterConfig{
		Store:  systemDB,
		Logger: logger,
	})
}

// provideTemplateImporter creates the template importer.
func provideTemplateImporter(
	systemDB *ent.Client,
	templateValidator *templates.TemplateValidator,
	logger *zap.Logger,
) (*templates.TemplateImporter, error) {
	return templates.NewTemplateImporter(templates.TemplateImporterConfig{
		Store:     systemDB,
		Validator: templateValidator,
		Logger:    logger,
	})
}

// TemplateProviders is a Wire provider set for all template system components.
var TemplateProviders = wire.NewSet(
	provideTemplateService,
	provideTemplateValidator,
	provideTemplateInstaller,
	provideTemplateExporter,
	provideTemplateImporter,
	wire.Struct(new(TemplateComponents), "*"),
)

// InjectTemplateSystem is a Wire injector that constructs the complete template system.
func InjectTemplateSystem(
	systemDB *ent.Client,
	eventBus events.EventBus,
	instanceManager *lifecycle.InstanceManager,
	dependencyManager *dependencies.DependencyManager,
	logger *zap.Logger,
) (*TemplateComponents, error) {
	wire.Build(TemplateProviders)
	return nil, nil
}
