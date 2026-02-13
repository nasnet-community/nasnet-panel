package notifications

import (
	"fmt"
	"regexp"
	"strings"
	"text/template"
)

// ChannelLimits defines the maximum length constraints for each notification channel.
type ChannelLimits struct {
	SubjectMaxLen int // 0 means no subject for this channel
	BodyMaxLen    int // 0 means unlimited
}

// getChannelLimits returns the length constraints for a notification channel.
func getChannelLimits(channel string) ChannelLimits {
	switch channel {
	case "email":
		return ChannelLimits{
			SubjectMaxLen: 200,
			BodyMaxLen:    0, // Unlimited for email body
		}
	case "pushover":
		return ChannelLimits{
			SubjectMaxLen: 250, // Pushover calls it "title"
			BodyMaxLen:    1024,
		}
	case "telegram":
		return ChannelLimits{
			SubjectMaxLen: 0, // No subject in Telegram
			BodyMaxLen:    4096,
		}
	case "webhook":
		return ChannelLimits{
			SubjectMaxLen: 0, // Depends on webhook endpoint
			BodyMaxLen:    0, // Unlimited
		}
	case "inapp":
		return ChannelLimits{
			SubjectMaxLen: 100,
			BodyMaxLen:    500,
		}
	default:
		// Conservative defaults for unknown channels
		return ChannelLimits{
			SubjectMaxLen: 100,
			BodyMaxLen:    1000,
		}
	}
}

// validateSyntax checks if a template string has valid Go template syntax.
func validateSyntax(tmplStr string, funcMap template.FuncMap) error {
	if tmplStr == "" {
		return nil // Empty templates are valid (e.g., channels without subjects)
	}

	_, err := template.New("validate").Funcs(funcMap).Option("missingkey=zero").Parse(tmplStr)
	if err != nil {
		return fmt.Errorf("template syntax error: %w", err)
	}

	return nil
}

// validateFunctions checks if a template uses any restricted functions.
// Returns a list of restricted function names found in the template.
func validateFunctions(tmplStr string) []string {
	if tmplStr == "" {
		return nil
	}

	restrictedFuncs := []string{
		"call",  // Arbitrary function calls
		"js",    // JavaScript encoding (not applicable in text templates)
		"html",  // HTML encoding in text templates (use html/template for email HTML)
		// "title" is deprecated but not restricted - we allow it for now
	}

	found := make([]string, 0)
	for _, funcName := range restrictedFuncs {
		// Look for function usage: {{funcName ...}} or {{... | funcName ...}}
		pattern := regexp.MustCompile(fmt.Sprintf(`\{\{[^}]*\b%s\b[^}]*\}\}`, regexp.QuoteMeta(funcName)))
		if pattern.MatchString(tmplStr) {
			found = append(found, funcName)
		}
	}

	return found
}

// validateLength checks if the rendered template output is within channel limits.
func validateLength(subjectRendered, bodyRendered string, channel string) []string {
	limits := getChannelLimits(channel)
	errors := make([]string, 0)

	// Check subject length
	if limits.SubjectMaxLen > 0 && len(subjectRendered) > limits.SubjectMaxLen {
		errors = append(errors, fmt.Sprintf(
			"Subject exceeds maximum length for %s: %d > %d characters",
			channel, len(subjectRendered), limits.SubjectMaxLen,
		))
	}

	// Check body length
	if limits.BodyMaxLen > 0 && len(bodyRendered) > limits.BodyMaxLen {
		errors = append(errors, fmt.Sprintf(
			"Body exceeds maximum length for %s: %d > %d characters",
			channel, len(bodyRendered), limits.BodyMaxLen,
		))
	}

	return errors
}

// renderTemplateForValidation attempts to render a template with sample data.
// This catches runtime errors that wouldn't be caught by syntax validation alone.
func renderTemplateForValidation(subjectTmpl, bodyTmpl string, funcMap template.FuncMap, data TemplateData) (subject, body string, err error) {
	// Render subject if provided
	if subjectTmpl != "" {
		tmpl, err := template.New("subject").Funcs(funcMap).Option("missingkey=zero").Parse(subjectTmpl)
		if err != nil {
			return "", "", fmt.Errorf("subject template parse error: %w", err)
		}

		var subjectBuf strings.Builder
		if err := tmpl.Execute(&subjectBuf, data); err != nil {
			return "", "", fmt.Errorf("subject template execution error: %w", err)
		}
		subject = subjectBuf.String()
	}

	// Render body (required)
	if bodyTmpl == "" {
		return "", "", fmt.Errorf("body template cannot be empty")
	}

	tmpl, err := template.New("body").Funcs(funcMap).Option("missingkey=zero").Parse(bodyTmpl)
	if err != nil {
		return "", "", fmt.Errorf("body template parse error: %w", err)
	}

	var bodyBuf strings.Builder
	if err := tmpl.Execute(&bodyBuf, data); err != nil {
		return "", "", fmt.Errorf("body template execution error: %w", err)
	}
	body = bodyBuf.String()

	return subject, body, nil
}

// ValidateTemplateComplete performs comprehensive template validation.
// It checks syntax, restricted functions, and length constraints.
// Returns an array of error messages (empty if valid).
func ValidateTemplateComplete(subjectTmpl, bodyTmpl string, channel string, funcMap template.FuncMap, eventType string) []string {
	errors := make([]string, 0)

	// 1. Validate syntax
	if err := validateSyntax(subjectTmpl, funcMap); err != nil {
		errors = append(errors, fmt.Sprintf("Subject: %v", err))
	}
	if err := validateSyntax(bodyTmpl, funcMap); err != nil {
		errors = append(errors, fmt.Sprintf("Body: %v", err))
	}

	// Stop here if syntax errors (can't proceed to rendering)
	if len(errors) > 0 {
		return errors
	}

	// 2. Check for restricted functions
	if restrictedSubject := validateFunctions(subjectTmpl); len(restrictedSubject) > 0 {
		errors = append(errors, fmt.Sprintf(
			"Subject uses restricted functions: %s",
			strings.Join(restrictedSubject, ", "),
		))
	}
	if restrictedBody := validateFunctions(bodyTmpl); len(restrictedBody) > 0 {
		errors = append(errors, fmt.Sprintf(
			"Body uses restricted functions: %s",
			strings.Join(restrictedBody, ", "),
		))
	}

	// 3. Render with sample data to catch runtime errors
	sampleData := BuildSampleTemplateData(eventType)
	subject, body, err := renderTemplateForValidation(subjectTmpl, bodyTmpl, funcMap, sampleData)
	if err != nil {
		errors = append(errors, err.Error())
		return errors // Can't check length without rendered output
	}

	// 4. Validate length constraints
	lengthErrors := validateLength(subject, body, channel)
	errors = append(errors, lengthErrors...)

	return errors
}
