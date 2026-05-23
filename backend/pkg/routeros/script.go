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
	results, err := c.GetAll("/environment")
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
	_, err := c.ExecuteScript(script)
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

// ExecuteScript executes an inline script block on RouterOS.
// The script parameter should contain valid RouterOS script syntax, including :global, :local, and other commands.
// Example: `:global myVar "value"; :put "Result: " . $myVar`.
func (c *Client) ExecuteScript(script string) (string, error) {
	if script == "" {
		return "", fmt.Errorf("script content is required")
	}

	reply, err := c.Execute("/execute", fmt.Sprintf("=script={%s}", script))
	if err != nil {
		return "", fmt.Errorf("failed to execute script: %w", err)
	}

	if reply == nil || reply.Done == nil {
		return "", fmt.Errorf("unexpected response format from script execution")
	}

	result, ok := reply.Done.Map["after"]
	if !ok {
		result = ""
	}

	return result, nil
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
