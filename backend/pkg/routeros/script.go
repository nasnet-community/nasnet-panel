package routeros

import (
	"fmt"
)

// ScriptInfo represents a RouterOS script.
type ScriptInfo struct {
	ID       string
	Name     string
	Source   string
	Owner    string
	Policy   string
	RunCount string
	Disabled bool
	Comment  string
}

// ScriptConfig represents configuration for adding a new script.
type ScriptConfig struct {
	Name     string
	Source   string
	Owner    string
	Policy   string
	Comment  string
	Disabled bool
}

// GetEnvironmentVariable retrieves an environment variable value from RouterOS by name.
func (c *Client) GetEnvironmentVariable(name string) (string, error) {
	if name == "" {
		return "", fmt.Errorf("environment variable name is required")
	}

	results, err := c.GetAll("/system/script/environment", "?=name="+name)
	if err != nil {
		return "", fmt.Errorf("failed to get environment variable %s: %w", name, err)
	}

	if len(results) == 0 {
		return "", fmt.Errorf("environment variable %s not found", name)
	}

	value, ok := results[0]["value"]
	if !ok {
		return "", fmt.Errorf("no value found for environment variable %s", name)
	}

	return value, nil
}

// GetEnvironmentVariables retrieves all environment variables from RouterOS.
func (c *Client) GetEnvironmentVariables() (map[string]string, error) {
	results, err := c.GetAll("/system/script/environment")
	if err != nil {
		return nil, fmt.Errorf("failed to list environment variables: %w", err)
	}

	vars := make(map[string]string)
	for _, result := range results {
		name, ok := result["name"]
		if !ok {
			continue
		}
		value, ok := result["value"]
		if !ok {
			value = ""
		}
		vars[name] = value
	}

	return vars, nil
}

// SetEnvironmentVariable sets an environment variable in RouterOS using script execution.
func (c *Client) SetEnvironmentVariable(name, value string) error {
	if name == "" {
		return fmt.Errorf("environment variable name is required")
	}

	script := fmt.Sprintf(":global %s %q", name, value)
	_, err := c.Execute("/execute", fmt.Sprintf("=script={%s}", script))
	if err != nil {
		return fmt.Errorf("failed to set environment variable %s: %w", name, err)
	}

	return nil
}

// DeleteEnvironmentVariable removes an environment variable from RouterOS.
func (c *Client) DeleteEnvironmentVariable(name string) error {
	if name == "" {
		return fmt.Errorf("environment variable name is required")
	}

	results, err := c.GetAll("/system/script/environment", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find environment variable %s: %w", name, err)
	}

	if len(results) == 0 {
		return fmt.Errorf("environment variable %s not found", name)
	}

	varID := results[0][".id"]
	_, err = c.Remove("/system/script/environment", "=.id="+varID)
	if err != nil {
		return fmt.Errorf("failed to delete environment variable %s: %w", name, err)
	}

	return nil
}

// GetScript retrieves a script by name from RouterOS.
func (c *Client) GetScript(name string) (*ScriptInfo, error) {
	if name == "" {
		return nil, fmt.Errorf("script name is required")
	}

	results, err := c.GetAll("/system/script", "?=name="+name)
	if err != nil {
		return nil, fmt.Errorf("failed to get script %s: %w", name, err)
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("script %s not found", name)
	}

	return parseScriptInfo(results[0]), nil
}

// ListScripts retrieves all scripts from RouterOS.
func (c *Client) ListScripts() ([]ScriptInfo, error) {
	results, err := c.GetAll("/system/script")
	if err != nil {
		return nil, fmt.Errorf("failed to list scripts: %w", err)
	}

	scripts := make([]ScriptInfo, 0, len(results))
	for _, result := range results {
		scripts = append(scripts, *parseScriptInfo(result))
	}

	return scripts, nil
}

// RunScript executes a named script on RouterOS.
// The scriptName parameter should be the name of an existing script in RouterOS.
func (c *Client) RunScript(scriptName string) error {
	if scriptName == "" {
		return fmt.Errorf("script name is required")
	}

	_, err := c.Execute("/system/script/run", "=number="+scriptName)
	if err != nil {
		return fmt.Errorf("failed to execute script %s: %w", scriptName, err)
	}

	return nil
}

// AddScript adds a new script to RouterOS.
func (c *Client) AddScript(config ScriptConfig) (string, error) {
	if config.Name == "" {
		return "", fmt.Errorf("script name is required")
	}
	if config.Source == "" {
		return "", fmt.Errorf("script source is required")
	}

	args := []string{
		"=name=" + config.Name,
		"=source=" + config.Source,
	}

	if config.Owner != "" {
		args = append(args, "=owner="+config.Owner)
	}
	if config.Policy != "" {
		args = append(args, "=policy="+config.Policy)
	}
	if config.Comment != "" {
		args = append(args, "=comment="+config.Comment)
	}
	if config.Disabled {
		args = append(args, "=disabled=yes")
	}

	id, err := c.Add("/system/script", args...)
	if err != nil {
		return "", fmt.Errorf("failed to add script %s: %w", config.Name, err)
	}

	return id, nil
}

// RemoveScript removes a script from RouterOS by name.
func (c *Client) RemoveScript(name string) error {
	if name == "" {
		return fmt.Errorf("script name is required")
	}

	results, err := c.GetAll("/system/script", "?=name="+name)
	if err != nil {
		return fmt.Errorf("failed to find script %s: %w", name, err)
	}

	if len(results) == 0 {
		return fmt.Errorf("script %s not found", name)
	}

	scriptID := results[0][".id"]
	_, err = c.Remove("/system/script", "=.id="+scriptID)
	if err != nil {
		return fmt.Errorf("failed to remove script %s: %w", name, err)
	}

	return nil
}

// ExecuteScriptString executes a RouterOS script string directly without storing it.
// The script parameter should contain valid RouterOS script code.
func (c *Client) ExecuteScriptString(script string) error {
	if script == "" {
		return fmt.Errorf("script content is required")
	}

	_, err := c.Execute("/execute", fmt.Sprintf("=script={%s}", script))
	if err != nil {
		return fmt.Errorf("failed to execute script: %w", err)
	}

	return nil
}

// ImportFile imports and executes a RouterOS script file by name.
// The filename parameter should be the name of a file stored in RouterOS (e.g., "wizard.rsc").
func (c *Client) ImportFile(filename string) error {
	if filename == "" {
		return fmt.Errorf("filename is required")
	}

	_, err := c.Execute("/import", "=file-name="+filename)
	if err != nil {
		return fmt.Errorf("failed to import file %s: %w", filename, err)
	}

	return nil
}

// parseScriptInfo converts a RouterOS script map to ScriptInfo struct.
func parseScriptInfo(scriptMap map[string]string) *ScriptInfo {
	disabled := scriptMap["disabled"] == "true"

	return &ScriptInfo{
		ID:       scriptMap[".id"],
		Name:     scriptMap["name"],
		Source:   scriptMap["source"],
		Owner:    scriptMap["owner"],
		Policy:   scriptMap["policy"],
		RunCount: scriptMap["run-count"],
		Disabled: disabled,
		Comment:  scriptMap["comment"],
	}
}
