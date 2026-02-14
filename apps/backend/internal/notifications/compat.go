package notifications

import (
	"backend/generated/ent"

	"go.uber.org/zap"

	"backend/internal/notifications/templates"
)

// Type aliases for backward compatibility.
// Canonical types now live in backend/internal/notifications/templates.

type TemplateData = templates.TemplateData
type TemplateCache = templates.TemplateCache
type ChannelLimits = templates.ChannelLimits

// TemplateService is an alias for the templates.Service type.
type TemplateService = templates.Service

// TemplateServiceConfig holds configuration for creating a TemplateService.
// This wrapper preserves the original API.
type TemplateServiceConfig struct {
	DB     *ent.Client
	Logger *zap.SugaredLogger
}

// NewTemplateService creates a new template service using the original API.
func NewTemplateService(cfg TemplateServiceConfig) *templates.Service {
	return templates.NewService(templates.ServiceConfig{
		DB:     cfg.DB,
		Logger: cfg.Logger,
	})
}

// Function aliases for backward compatibility.
var BuildTemplateData = templates.BuildTemplateData
var BuildSampleTemplateData = templates.BuildSampleTemplateData
var NewTemplateCache = templates.NewTemplateCache
var ValidateTemplateComplete = templates.ValidateComplete
