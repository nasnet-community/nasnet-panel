package utils

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"text/template"
)

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
func RenderTemplate(templatePath string, data interface{}) (string, error) {
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
func RenderTemplateToFile(templatePath, outputPath string, data interface{}) error {
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

	err = os.WriteFile(outputPath, []byte(rendered), 0644)
	if err != nil {
		return fmt.Errorf("failed to write to output file %s: %w", outputPath, err)
	}

	return nil
}
