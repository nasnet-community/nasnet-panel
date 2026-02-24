package resolver

// This file contains common helper functions used across multiple resolvers.

import (
	"context"

	"backend/graph/model"
	"backend/internal/common/isolation"
	"backend/internal/errors"
	"backend/internal/templates"
)

// ptrString returns nil if string is empty, otherwise returns pointer to the string.
// This is a utility function for converting non-pointer strings to optional pointer fields in GraphQL types.
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

// Context key constants for extracting authenticated user information
const (
	contextKeyUserID    = "user_id"
	contextKeySessionID = "session_id"
	contextKeyUserIP    = "user_ip"
	contextKeyUserAgent = "user_agent"
)

// getUserIDFromContext extracts and validates the user ID from the request context.
// Returns an error if the user ID is not present or empty (indicating unauthenticated request).
func getUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(contextKeyUserID).(string)
	if !ok || userID == "" {
		return "", errors.NewValidationError("userID", userID, "user not authenticated")
	}
	return userID, nil
}

// getSessionIDFromContext extracts and validates the session ID from the request context.
// Returns an error if the session ID is not present or empty.
func getSessionIDFromContext(ctx context.Context) (string, error) {
	sessionID, ok := ctx.Value(contextKeySessionID).(string)
	if !ok || sessionID == "" {
		return "", errors.NewValidationError("sessionID", sessionID, "session ID not found in context")
	}
	return sessionID, nil
}

// getClientInfoFromContext extracts client information (IP address and user agent) from the request context.
// Returns empty strings if values are not present (non-fatal, as these are optional).
func getClientInfoFromContext(ctx context.Context) (ip, ua string) {
	ip, _ = ctx.Value(contextKeyUserIP).(string)    //nolint:errcheck // type assertion from context value
	ua, _ = ctx.Value(contextKeyUserAgent).(string) //nolint:errcheck // type assertion from context value
	return
}
