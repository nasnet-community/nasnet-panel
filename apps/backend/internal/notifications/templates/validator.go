package templates

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

// GetChannelLimits returns the length constraints for a notification channel.
func GetChannelLimits(channel string) ChannelLimits {
	switch channel {
	case "email":
		return ChannelLimits{
			SubjectMaxLen: 200,
			BodyMaxLen:    0, // Unlimited for email body
		}
	case "pushover":
		return ChannelLimits{
			SubjectMaxLen: 250,
			BodyMaxLen:    1024,
		}
	case "telegram":
		return ChannelLimits{
			SubjectMaxLen: 0,
			BodyMaxLen:    4096,
		}
	case "webhook":
		return ChannelLimits{
			SubjectMaxLen: 0,
			BodyMaxLen:    0,
		}
	case "inapp":
		return ChannelLimits{
			SubjectMaxLen: 100,
			BodyMaxLen:    500,
		}
	default:
		return ChannelLimits{
			SubjectMaxLen: 100,
			BodyMaxLen:    1000,
		}
	}
}

// ValidateSyntax checks if a template string has valid Go template syntax.
func ValidateSyntax(tmplStr string, funcMap template.FuncMap) error {
	if tmplStr == "" {
		return nil
	}

	_, err := template.New("validate").Funcs(funcMap).Option("missingkey=zero").Parse(tmplStr)
	if err != nil {
		return fmt.Errorf("template syntax error: %w", err)
	}

	return nil
}

// ValidateFunctions checks if a template uses any restricted functions.
func ValidateFunctions(tmplStr string) []string {
	if tmplStr == "" {
		return nil
	}

	restrictedFuncs := []string{
		"call",
		"js",
		"html",
	}

	found := make([]string, 0)
	for _, funcName := range restrictedFuncs {
		pattern := regexp.MustCompile(fmt.Sprintf(`\{\{[^}]*\b%s\b[^}]*\}\}`, regexp.QuoteMeta(funcName)))
		if pattern.MatchString(tmplStr) {
			found = append(found, funcName)
		}
	}

	return found
}

// ValidateLength checks if the rendered template output is within channel limits.
func ValidateLength(subjectRendered, bodyRendered, channel string) []string {
	limits := GetChannelLimits(channel)
	errors := make([]string, 0)

	if limits.SubjectMaxLen > 0 && len(subjectRendered) > limits.SubjectMaxLen {
		errors = append(errors, fmt.Sprintf(
			"Subject exceeds maximum length for %s: %d > %d characters",
			channel, len(subjectRendered), limits.SubjectMaxLen,
		))
	}

	if limits.BodyMaxLen > 0 && len(bodyRendered) > limits.BodyMaxLen {
		errors = append(errors, fmt.Sprintf(
			"Body exceeds maximum length for %s: %d > %d characters",
			channel, len(bodyRendered), limits.BodyMaxLen,
		))
	}

	return errors
}

// RenderForValidation attempts to render a template with sample data.
func RenderForValidation(subjectTmpl, bodyTmpl string, funcMap template.FuncMap, data TemplateData) (subject, body string, err error) {
	if subjectTmpl != "" {
		subjectParsed, parseErr := template.New("subject").Funcs(funcMap).Option("missingkey=zero").Parse(subjectTmpl)
		if parseErr != nil {
			return "", "", fmt.Errorf("subject template parse error: %w", parseErr)
		}

		var subjectBuf strings.Builder
		if execErr := subjectParsed.Execute(&subjectBuf, data); execErr != nil {
			return "", "", fmt.Errorf("subject template execution error: %w", execErr)
		}
		subject = subjectBuf.String()
	}

	if bodyTmpl == "" {
		return "", "", fmt.Errorf("body template cannot be empty")
	}

	bodyParsed, err := template.New("body").Funcs(funcMap).Option("missingkey=zero").Parse(bodyTmpl)
	if err != nil {
		return "", "", fmt.Errorf("body template parse error: %w", err)
	}

	var bodyBuf strings.Builder
	if execErr := bodyParsed.Execute(&bodyBuf, data); execErr != nil {
		return "", "", fmt.Errorf("body template execution error: %w", execErr)
	}
	body = bodyBuf.String()

	return subject, body, nil
}

// ValidateComplete performs comprehensive template validation.
func ValidateComplete(subjectTmpl, bodyTmpl, channel string, funcMap template.FuncMap, eventType string) []string {
	errors := make([]string, 0)

	// 1. Validate syntax
	if err := ValidateSyntax(subjectTmpl, funcMap); err != nil {
		errors = append(errors, fmt.Sprintf("Subject: %v", err))
	}
	if err := ValidateSyntax(bodyTmpl, funcMap); err != nil {
		errors = append(errors, fmt.Sprintf("Body: %v", err))
	}

	if len(errors) > 0 {
		return errors
	}

	// 2. Check for restricted functions
	if restrictedSubject := ValidateFunctions(subjectTmpl); len(restrictedSubject) > 0 {
		errors = append(errors, fmt.Sprintf(
			"Subject uses restricted functions: %s",
			strings.Join(restrictedSubject, ", "),
		))
	}
	if restrictedBody := ValidateFunctions(bodyTmpl); len(restrictedBody) > 0 {
		errors = append(errors, fmt.Sprintf(
			"Body uses restricted functions: %s",
			strings.Join(restrictedBody, ", "),
		))
	}

	// 3. Render with sample data to catch runtime errors
	sampleData := BuildSampleTemplateData(eventType)
	subject, body, renderErr := RenderForValidation(subjectTmpl, bodyTmpl, funcMap, sampleData)
	if renderErr != nil {
		errors = append(errors, renderErr.Error())
		return errors
	}

	// 4. Validate length constraints
	lengthErrors := ValidateLength(subject, body, channel)
	errors = append(errors, lengthErrors...)

	return errors
}
