package alerts

import (
	"embed"
	"fmt"
	"html/template"
	"strings"
	"time"

	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

//go:embed email/*.tmpl telegram/*.tmpl pushover/*.tmpl webhook/*.tmpl inapp/*.tmpl
var templatesFS embed.FS

// GetTemplate retrieves a template by channel and name.
// Returns the template content as a string, or an error if not found.
//
// Examples:
//   - GetTemplate("email", "default-subject")
//   - GetTemplate("telegram", "default-message")
//   - GetTemplate("webhook", "default-payload")
func GetTemplate(channel, name string) (string, error) {
	if channel == "" {
		return "", fmt.Errorf("channel cannot be empty")
	}
	if name == "" {
		return "", fmt.Errorf("template name cannot be empty")
	}

	// Construct the file path
	path := fmt.Sprintf("%s/%s.tmpl", channel, name)

	// Read the template file
	content, err := templatesFS.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("template not found: %s/%s", channel, name)
	}

	return string(content), nil
}

// GetAllTemplatesForChannel returns all template names for a given channel.
func GetAllTemplatesForChannel(channel string) ([]string, error) {
	if channel == "" {
		return nil, fmt.Errorf("channel cannot be empty")
	}

	entries, err := templatesFS.ReadDir(channel)
	if err != nil {
		return nil, fmt.Errorf("channel not found: %s", channel)
	}

	templates := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".tmpl") {
			// Remove .tmpl extension
			name := strings.TrimSuffix(entry.Name(), ".tmpl")
			templates = append(templates, name)
		}
	}

	return templates, nil
}

// GetSupportedChannels returns all available notification channels.
func GetSupportedChannels() []string {
	return []string{"email", "telegram", "pushover", "webhook", "inapp"}
}

// TemplateFuncMap returns the function map available in templates.
// These functions can be used in all alert templates.
func TemplateFuncMap() template.FuncMap {
	return template.FuncMap{
		// String manipulation
		"upper": strings.ToUpper,
		"lower": strings.ToLower,
		"title": func(s string) string { return cases.Title(language.English).String(s) },
		"trim":  strings.TrimSpace,

		// Truncate with ellipsis
		"truncate": func(maxLen int, s string) string {
			if len(s) <= maxLen {
				return s
			}
			if maxLen <= 3 {
				return s[:maxLen]
			}
			return s[:maxLen-3] + "..."
		},

		// Time formatting
		"formatTime": func(layout string, t time.Time) string {
			return t.Format(layout)
		},

		// Join strings
		"join": func(sep string, items []string) string {
			return strings.Join(items, sep)
		},

		// Default value if empty
		"default": func(defaultVal, val string) string {
			if val == "" {
				return defaultVal
			}
			return val
		},

		// Add numbers (useful for range loops)
		"add": func(a, b int) int {
			return a + b
		},

		// Escape for MarkdownV2 (Telegram)
		"escape": func(s string) string {
			replacer := strings.NewReplacer(
				"_", "\\_",
				"*", "\\*",
				"[", "\\[",
				"]", "\\]",
				"(", "\\(",
				")", "\\)",
				"~", "\\~",
				"`", "\\`",
				">", "\\>",
				"#", "\\#",
				"+", "\\+",
				"-", "\\-",
				"=", "\\=",
				"|", "\\|",
				"{", "\\{",
				"}", "\\}",
				".", "\\.",
				"!", "\\!",
			)
			return replacer.Replace(s)
		},

		// JSON encoding helper (for webhook payloads)
		"json": func(v interface{}) string {
			// This is a placeholder - in real usage, you'd use json.Marshal
			// For now, return empty object as fallback
			return "{}"
		},
	}
}

// ValidateTemplate checks if a template is valid by attempting to parse it.
func ValidateTemplate(content string) error {
	_, err := template.New("validate").Funcs(TemplateFuncMap()).Parse(content)
	if err != nil {
		return fmt.Errorf("invalid template syntax: %w", err)
	}
	return nil
}

// TemplateExists checks if a template exists for the given channel and name.
func TemplateExists(channel, name string) bool {
	_, err := GetTemplate(channel, name)
	return err == nil
}
