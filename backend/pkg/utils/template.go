package utils

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

// EscapeScriptString escapes special characters in a script string for safe RouterOS execution.
// Escapes newlines, quotes, and dollar signs.
func EscapeScriptString(s string) string {
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	s = strings.ReplaceAll(s, "$", "\\$")
	return s
}

// templateFuncs returns custom template functions.
func templateFuncs() template.FuncMap {
	return template.FuncMap{
		"add": func(a, b int) int {
			return a + b
		},
	}
}

// RenderTemplate reads a template file, parses it along with other templates in the same directory,
// and renders it with the provided data. Returns the rendered template as a string.
func RenderTemplate(templatePath string, data any) (string, error) {
	if templatePath == "" {
		return "", fmt.Errorf("template path is required")
	}

	dir := filepath.Dir(templatePath)
	pattern := filepath.Join(dir, "*.tmpl")

	tmpl, err := template.New("config").Funcs(templateFuncs()).ParseGlob(pattern)
	if err != nil {
		return "", fmt.Errorf("failed to parse templates from %s: %w", pattern, err)
	}

	filename := filepath.Base(templatePath)
	var buf bytes.Buffer
	err = tmpl.ExecuteTemplate(&buf, filename, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}

// RenderTemplateToFile reads a template file, renders it with the provided data,
// and writes the output to the specified file.
func RenderTemplateToFile(templatePath, outputPath string, data any) error {
	if templatePath == "" {
		return fmt.Errorf("template path is required")
	}
	if outputPath == "" {
		return fmt.Errorf("output path is required")
	}

	rendered, err := RenderTemplate(templatePath, data)
	if err != nil {
		return err
	}

	err = os.WriteFile(outputPath, []byte(rendered), 0o600)
	if err != nil {
		return fmt.Errorf("failed to write to output file %s: %w", outputPath, err)
	}

	return nil
}
