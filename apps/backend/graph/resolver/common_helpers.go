package resolver

// This file contains common helper functions used across multiple resolvers.

import (
	"context"
	"fmt"

	"backend/graph/model"
	"backend/internal/common/isolation"
	"backend/internal/templates"

	"backend/internal/router"
)

// ptrString returns nil if string is empty, otherwise returns pointer.
func ptrString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// convertIsolationSeverity converts internal isolation.Severity to GraphQL IsolationSeverity enum.
func convertIsolationSeverity(severity isolation.Severity) model.IsolationSeverity {
	switch severity {
	case isolation.SeverityError:
		return model.IsolationSeverityError
	case isolation.SeverityWarning:
		return model.IsolationSeverityWarning
	default:
		return model.IsolationSeverityWarning
	}
}

// getRouterPortTyped returns a typed RouterPort for the given router ID.
// This is a helper method for resolvers that need router port access.
// Note: This is a placeholder implementation that needs actual connection manager integration.
func (r *Resolver) getRouterPortTyped(ctx context.Context, routerID string) (router.RouterPort, error) {
	// TODO: Implement proper router port retrieval through connection manager
	// For now, return an error indicating the feature needs implementation
	return nil, fmt.Errorf("router port access not yet implemented - needs connection manager integration")
}

// convertTemplateToGraphQL converts internal ServiceTemplate to GraphQL model.
func convertTemplateToGraphQL(tmpl *templates.ServiceTemplate) *model.ServiceTemplate {
	if tmpl == nil {
		return nil
	}

	// Note: The GraphQL ServiceTemplate model may have different fields than the internal type.
	// This is a simplified conversion that maps the core fields.
	author := tmpl.Author
	return &model.ServiceTemplate{
		ID:          tmpl.ID,
		Name:        tmpl.Name,
		Description: tmpl.Description,
		Version:     tmpl.Version,
		Author:      &author,
		CreatedAt:   tmpl.CreatedAt,
		UpdatedAt:   tmpl.UpdatedAt,
		// Services field mapping would go here if the GraphQL model has it
	}
}

// getRouterPortTyped is also available on mutationResolver for convenience
func (r *mutationResolver) getRouterPortTyped(ctx context.Context, routerID string) (router.RouterPort, error) {
	return r.Resolver.getRouterPortTyped(ctx, routerID)
}

// getRouterPortTyped is also available on queryResolver for convenience
func (r *queryResolver) getRouterPortTyped(ctx context.Context, routerID string) (router.RouterPort, error) {
	return r.Resolver.getRouterPortTyped(ctx, routerID)
}
