package apperrors

import (
	"errors"
	"fmt"
	"strings"
)

// SuggestedFix generates a user-friendly suggested fix based on error type and context.
func SuggestedFix(err error) string {
	// Check for specific error types first (before GetRouterError which may fail for embedded types)
	// Use errors.As to handle wrapped errors
	var validationErr *ValidationError
	var protocolErr *ProtocolError
	var authErr *AuthError
	var networkErr *NetworkError
	var platformErr *PlatformError
	var resourceErr *ResourceError
	var internalErr *InternalError

	switch {
	case errors.As(err, &validationErr):
		return suggestedFixForValidation(validationErr)
	case errors.As(err, &protocolErr):
		return suggestedFixForProtocol(protocolErr)
	case errors.As(err, &authErr):
		return suggestedFixForAuth(authErr)
	case errors.As(err, &networkErr):
		return suggestedFixForNetwork(networkErr)
	case errors.As(err, &platformErr):
		return suggestedFixForPlatform(platformErr)
	case errors.As(err, &resourceErr):
		return suggestedFixForResource(resourceErr)
	case errors.As(err, &internalErr):
		return "An internal error occurred. Please try again later or contact support if the issue persists."
	}

	// Try to extract RouterError for code-based suggestions
	routerErr := GetRouterError(err)
	if routerErr == nil {
		return "An unexpected error occurred. Please try again or contact support."
	}

	// Fall back to code-based suggestions
	return suggestedFixForCode(routerErr.Code)
}

func suggestedFixForValidation(err *ValidationError) string {
	field := err.Field
	constraint := err.Constraint

	// Generate specific suggestions based on constraint
	switch {
	case strings.Contains(constraint, "required"):
		return fmt.Sprintf("The field '%s' is required. Please provide a value.", field)
	case strings.Contains(constraint, "min") && strings.Contains(constraint, "max"):
		return fmt.Sprintf("The value for '%s' is out of range. %s", field, constraint)
	case strings.Contains(constraint, "format"):
		return fmt.Sprintf("The value for '%s' has an invalid format. %s", field, constraint)
	case strings.Contains(constraint, "pattern"):
		return fmt.Sprintf("The value for '%s' does not match the required pattern. %s", field, constraint)
	default:
		return fmt.Sprintf("Please check the value for '%s'. %s", field, constraint)
	}
}

func suggestedFixForProtocol(err *ProtocolError) string {
	switch err.Code {
	case CodeConnectionFailed:
		return fmt.Sprintf("Could not connect to router via %s. Verify the router is online and the port is open.", err.Protocol)
	case CodeConnectionTimeout:
		return fmt.Sprintf("Connection timed out via %s. Check network connectivity and firewall rules.", err.Protocol)
	case CodeAuthenticationFailed:
		return "Authentication failed. Please verify your username and password are correct."
	case CodeAllProtocolsFailed:
		return "All connection protocols failed. Verify the router is accessible and credentials are correct."
	case CodeProtocolError:
		return fmt.Sprintf("Protocol error on %s. The router may be overloaded or the service may be unavailable.", err.Protocol)
	case CodeCommandFailed:
		return "Command execution failed. Check if you have sufficient permissions on the router."
	default:
		return fmt.Sprintf("A protocol error occurred (%s). Please try reconnecting.", err.Protocol)
	}
}

func suggestedFixForAuth(err *AuthError) string {
	switch err.Code {
	case CodeAuthFailed:
		return "Authentication failed. Please check your credentials and try again."
	case CodeInsufficientPermissions:
		if err.RequiredPermission != "" && err.CurrentPermission != "" {
			return fmt.Sprintf("Insufficient permissions. This action requires '%s' level access, but you have '%s'.",
				err.RequiredPermission, err.CurrentPermission)
		}
		return "You don't have permission to perform this action. Contact your administrator."
	case CodeSessionExpired:
		return "Your session has expired. Please log in again."
	case CodeInvalidCredentials:
		return "Invalid username or password. Please check your credentials."
	case CodeAccessDenied:
		return "Access denied. You are not authorized to perform this action."
	default:
		return "An authentication error occurred. Please try logging in again."
	}
}

func suggestedFixForNetwork(err *NetworkError) string {
	switch err.Code {
	case CodeHostUnreachable:
		return fmt.Sprintf("Cannot reach host '%s'. Verify the IP address is correct and the device is powered on.", err.Host)
	case CodeDNSResolutionFailed:
		return fmt.Sprintf("Could not resolve hostname '%s'. Check the hostname or use an IP address instead.", err.Host)
	case CodeNetworkTimeout:
		return fmt.Sprintf("Network timeout connecting to '%s'. Check your network connection and firewall settings.", err.Host)
	case CodePortClosed:
		if err.Port > 0 {
			return fmt.Sprintf("Port %d is closed on '%s'. Ensure the service is running and the port is not blocked.", err.Port, err.Host)
		}
		return fmt.Sprintf("The required port is closed on '%s'. Ensure the service is running.", err.Host)
	default:
		return fmt.Sprintf("Network error connecting to '%s'. Check connectivity and try again.", err.Host)
	}
}

func suggestedFixForPlatform(err *PlatformError) string {
	switch err.Code {
	case CodePlatformNotSupported:
		return fmt.Sprintf("Platform '%s' is not supported. NasNetConnect supports MikroTik, OpenWrt, and VyOS.", err.Platform)
	case CodeCapabilityNotAvailable:
		if err.Version != "" {
			return fmt.Sprintf("This feature is not available on %s version %s. Consider upgrading the firmware.", err.Platform, err.Version)
		}
		return "This feature is not available on the current platform or version."
	case CodeVersionTooOld:
		return fmt.Sprintf("The %s version is too old for this feature. Please upgrade to a newer version.", err.Platform)
	case CodePackageMissing:
		return "A required package is missing on the router. Please install the necessary package."
	default:
		return fmt.Sprintf("A platform compatibility issue occurred with %s.", err.Platform)
	}
}

func suggestedFixForResource(err *ResourceError) string {
	switch err.Code {
	case CodeResourceNotFound:
		return fmt.Sprintf("The %s '%s' was not found. It may have been deleted or never existed.", err.ResourceType, err.ResourceID)
	case CodeResourceLocked:
		return fmt.Sprintf("The %s '%s' is currently locked. Wait for the current operation to complete.", err.ResourceType, err.ResourceID)
	case CodeInvalidStateTransition:
		if err.CurrentState != "" {
			return fmt.Sprintf("Cannot perform this action on %s '%s' in state '%s'.", err.ResourceType, err.ResourceID, err.CurrentState)
		}
		return fmt.Sprintf("The %s '%s' is not in a valid state for this action.", err.ResourceType, err.ResourceID)
	case CodeDependencyNotReady:
		return fmt.Sprintf("A required dependency for %s '%s' is not ready. Please ensure all prerequisites are met.", err.ResourceType, err.ResourceID)
	case CodeResourceBusy:
		return fmt.Sprintf("The %s '%s' is currently busy. Please try again later.", err.ResourceType, err.ResourceID)
	default:
		return fmt.Sprintf("A resource error occurred with %s '%s'.", err.ResourceType, err.ResourceID)
	}
}

func suggestedFixForCode(code string) string {
	// Map error codes to generic suggestions
	suggestions := map[string]string{
		// Platform (P1xx)
		CodePlatformNotSupported:   "This platform is not supported. Check the documentation for supported platforms.",
		CodeCapabilityNotAvailable: "This capability is not available. Check router version and installed packages.",
		CodeVersionTooOld:          "Please upgrade the router firmware to use this feature.",
		CodePackageMissing:         "Install the required package on the router.",

		// Protocol (R2xx)
		CodeConnectionFailed:     "Check that the router is online and accessible.",
		CodeConnectionTimeout:    "The connection timed out. Check network connectivity.",
		CodeProtocolError:        "A protocol error occurred. Try reconnecting.",
		CodeAllProtocolsFailed:   "All connection methods failed. Verify router accessibility and credentials.",
		CodeAuthenticationFailed: "Check your username and password.",
		CodeCommandFailed:        "Command execution failed. Check permissions.",

		// Network (N3xx)
		CodeHostUnreachable:     "The host is unreachable. Check the IP address and network path.",
		CodeDNSResolutionFailed: "DNS resolution failed. Use an IP address or check DNS settings.",
		CodeNetworkTimeout:      "Network operation timed out. Check connectivity.",
		CodePortClosed:          "The required port is closed. Check firewall and service status.",

		// Validation (V4xx)
		CodeValidationFailed:       "Please check the input values and try again.",
		CodeSchemaValidationFailed: "The data does not match the expected format.",
		CodeReferenceNotFound:      "A referenced resource was not found.",
		CodeCircularDependency:     "A circular dependency was detected. Review the configuration.",
		CodeConflictDetected:       "A conflict was detected. Resolve the conflict and try again.",
		CodeInvalidFormat:          "The value format is invalid. Check the expected format.",
		CodeOutOfRange:             "The value is out of the allowed range.",

		// Auth (A5xx)
		CodeAuthFailed:              "Authentication failed. Check your credentials.",
		CodeInsufficientPermissions: "You don't have permission for this action.",
		CodeSessionExpired:          "Your session has expired. Please log in again.",
		CodeInvalidCredentials:      "Invalid credentials. Check username and password.",
		CodeAccessDenied:            "Access denied. Contact your administrator.",

		// Resource (S6xx)
		CodeResourceNotFound:       "The resource was not found.",
		CodeResourceLocked:         "The resource is locked. Try again later.",
		CodeInvalidStateTransition: "Invalid operation for the current state.",
		CodeDependencyNotReady:     "A dependency is not ready. Check prerequisites.",
		CodeResourceBusy:           "The resource is busy. Try again later.",
	}

	if suggestion, ok := suggestions[code]; ok {
		return suggestion
	}

	return "An error occurred. Please try again or contact support."
}

// DocsURL generates a documentation URL based on error code.
func DocsURL(code string) string {
	baseURL := "https://docs.nasnet.io/errors"

	// Extract category prefix
	if len(code) < 1 {
		return baseURL
	}

	categoryPrefix := code[0:1]
	categoryPaths := map[string]string{
		"P": "platform",
		"R": "protocol",
		"N": "network",
		"V": "validation",
		"A": "auth",
		"S": "resource",
		"I": "internal",
	}

	if category, ok := categoryPaths[categoryPrefix]; ok {
		return fmt.Sprintf("%s/%s#%s", baseURL, category, strings.ToLower(code))
	}

	return baseURL
}

// TroubleshootingSteps returns a list of troubleshooting steps for an error.
func TroubleshootingSteps(err error) []string {
	routerErr := GetRouterError(err)
	if routerErr == nil {
		return []string{"Check the error message for details", "Try the operation again", "Contact support if the issue persists"}
	}

	switch routerErr.Category {
	case CategoryProtocol:
		return protocolTroubleshootingSteps(routerErr)
	case CategoryNetwork:
		return networkTroubleshootingSteps(routerErr)
	case CategoryAuth:
		return authTroubleshootingSteps(routerErr)
	case CategoryPlatform:
		return platformTroubleshootingSteps(routerErr)
	case CategoryValidation:
		return []string{"Review the error message for specific field issues", "Check the API documentation for valid values", "Ensure all required fields are provided"}
	case CategoryResource:
		return []string{"Refresh the page to get the latest state", "Check if the resource still exists", "Wait and retry if the resource is busy"}
	case CategoryInternal:
		return []string{"Try the operation again", "Clear browser cache and reload", "Contact support with the request ID"}
	default:
		return []string{"Review the error details", "Try the operation again"}
	}
}

func protocolTroubleshootingSteps(err *RouterError) []string {
	steps := []string{
		"Verify the router is powered on and accessible",
		"Check that the correct IP address/hostname is configured",
		"Verify credentials are correct",
	}

	switch err.Code {
	case CodeConnectionTimeout, CodeConnectionFailed:
		steps = append(steps,
			"Check firewall rules on router and network",
			"Verify the API/SSH service is enabled on the router",
			"Try pinging the router from the NasNet container")
	case CodeAuthenticationFailed:
		steps = append(steps,
			"Verify the username exists on the router",
			"Check if the password has special characters that need escaping",
			"Ensure the user has API access permissions")
	case CodeAllProtocolsFailed:
		steps = append(steps,
			"Check which protocols are enabled on the router",
			"Verify each protocol's port is accessible",
			"Review router logs for connection attempts")
	}

	steps = append(steps, "Check the NasNet documentation for protocol-specific guidance")
	return steps
}

func networkTroubleshootingSteps(err *RouterError) []string {
	return []string{
		"Verify network connectivity from the NasNet container",
		"Check if the target IP is correct and reachable",
		"Review firewall rules between NasNet and the router",
		"Test with ping and traceroute to identify network issues",
		"Verify DNS resolution if using hostnames",
		"Check for IP conflicts or routing issues",
	}
}

func authTroubleshootingSteps(err *RouterError) []string {
	switch err.Code {
	case CodeSessionExpired:
		return []string{"Log in again", "Check if the session timeout setting is appropriate", "Enable 'Remember me' for longer sessions"}
	case CodeInsufficientPermissions:
		return []string{"Contact your administrator to request access", "Verify your user role has the required permissions", "Check if the resource has access restrictions"}
	default:
		return []string{"Verify your username and password", "Check if your account is locked", "Reset your password if needed", "Contact support if the issue persists"}
	}
}

func platformTroubleshootingSteps(err *RouterError) []string {
	return []string{
		"Check the RouterOS/firmware version",
		"Verify the feature is available for your platform",
		"Update to the latest firmware if possible",
		"Check if required packages are installed",
		"Review platform compatibility documentation",
	}
}

// HTTPStatusCode maps a RouterError to the appropriate HTTP status code.
// This is useful for REST API error responses.
func HTTPStatusCode(err error) int {
	routerErr := GetRouterError(err)
	if routerErr == nil {
		return 500 // Internal Server Error
	}

	switch routerErr.Category {
	case CategoryValidation:
		return 400 // Bad Request
	case CategoryAuth:
		// Map specific auth errors to appropriate codes
		switch routerErr.Code {
		case CodeSessionExpired, CodeInvalidCredentials, CodeAuthFailed:
			return 401 // Unauthorized
		case CodeInsufficientPermissions, CodeAccessDenied:
			return 403 // Forbidden
		default:
			return 401
		}
	case CategoryResource:
		switch routerErr.Code {
		case CodeResourceNotFound:
			return 404 // Not Found
		case CodeResourceLocked, CodeResourceBusy:
			return 409 // Conflict
		case CodeInvalidStateTransition:
			return 422 // Unprocessable Entity
		default:
			return 400
		}
	case CategoryNetwork, CategoryProtocol:
		return 503 // Service Unavailable
	case CategoryPlatform:
		return 400 // Bad Request (platform not supported)
	case CategoryInternal:
		return 500 // Internal Server Error
	default:
		return 500
	}
}
