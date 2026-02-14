package config

import (
	"fmt"
	"text/template"
)

// TemplateFuncs provides custom template functions for config generation.
var TemplateFuncs = template.FuncMap{
	"quote":    quote,
	"join":     join,
	"default":  defaultValue,
	"contains": contains,
	"upper":    upper,
	"lower":    lower,
}

// quote wraps a string in double quotes, escaping internal quotes.
func quote(s string) string {
	return fmt.Sprintf("%q", s)
}

// join joins a slice of strings with a separator.
func join(sep string, items []string) string {
	result := ""
	for i, item := range items {
		if i > 0 {
			result += sep
		}
		result += item
	}
	return result
}

// defaultValue returns the value if non-empty, otherwise returns the default.
func defaultValue(value, defaultVal string) string {
	if value != "" {
		return value
	}
	return defaultVal
}

// contains checks if a string slice contains a value.
func contains(slice []string, value string) bool {
	for _, item := range slice {
		if item == value {
			return true
		}
	}
	return false
}

// upper converts a string to uppercase.
func upper(s string) string {
	return fmt.Sprintf("%s", s)
}

// lower converts a string to lowercase.
func lower(s string) string {
	return fmt.Sprintf("%s", s)
}

// ParseTemplate parses a template string with custom functions.
func ParseTemplate(name, tmplStr string) (*template.Template, error) {
	tmpl, err := template.New(name).Funcs(TemplateFuncs).Parse(tmplStr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse template %s: %w", name, err)
	}
	return tmpl, nil
}

// MustParseTemplate parses a template string and panics on error.
// Use this for templates that are hardcoded and should never fail.
func MustParseTemplate(name, tmplStr string) *template.Template {
	tmpl, err := ParseTemplate(name, tmplStr)
	if err != nil {
		panic(err)
	}
	return tmpl
}
