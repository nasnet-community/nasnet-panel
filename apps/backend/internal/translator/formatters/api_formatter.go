package formatters

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"

	"backend/internal/translator"
)

// RouterOS API verb and boolean constants.
const (
	verbPrint = "print"
	verbSet   = "set"
	boolYes   = "yes"
	boolNo    = "no"
)

// APIFormatter formats commands for the RouterOS Binary API protocol.
//
// Binary API format uses sentences:
//   - Command: /interface/ethernet/print
//   - Arguments: =.id=*1, =name=ether1, =disabled=no
//   - Queries: ?name=ether1, ?#|, ?#&
//
// The Format method returns a JSON representation of the API command
// that can be executed by go-routers library.
type APIFormatter struct{}

// NewAPIFormatter creates a new Binary API formatter.
func NewAPIFormatter() *APIFormatter {
	return &APIFormatter{}
}

// Protocol returns the API protocol type.
func (f *APIFormatter) Protocol() translator.Protocol {
	return translator.ProtocolAPI
}

// APICommand represents a formatted Binary API command.
type APICommand struct {
	Command string   `json:"command"` // e.g., "/interface/ethernet/print"
	Args    []string `json:"args"`    // e.g., ["=name=ether1", "?.id=*1"]
}

// Format converts a canonical command to Binary API format.
func (f *APIFormatter) Format(cmd *translator.CanonicalCommand) ([]byte, error) {
	if cmd == nil {
		return nil, fmt.Errorf("nil command")
	}

	apiCmd := APICommand{
		Command: f.formatCommand(cmd),
		Args:    make([]string, 0),
	}

	// Add ID if present
	if cmd.ID != "" {
		apiCmd.Args = append(apiCmd.Args, fmt.Sprintf("=.id=%s", cmd.ID))
	}

	// Add parameters for add/set operations
	if cmd.Action == translator.ActionAdd || cmd.Action == translator.ActionSet {
		for key, value := range cmd.Parameters {
			apiCmd.Args = append(apiCmd.Args, fmt.Sprintf("=%s=%s", key, f.formatValue(value)))
		}
	}

	// Add enable/disable parameter
	switch cmd.Action {
	case translator.ActionEnable:
		apiCmd.Args = append(apiCmd.Args, "=disabled=no")
	case translator.ActionDisable:
		apiCmd.Args = append(apiCmd.Args, "=disabled=yes")
	case translator.ActionGet, translator.ActionPrint, translator.ActionAdd,
		translator.ActionSet, translator.ActionRemove, translator.ActionMove:
	}

	// Add filters for print operations
	for _, filter := range cmd.Filters {
		apiCmd.Args = append(apiCmd.Args, f.formatFilter(filter))
	}

	// Add proplist for print operations
	if len(cmd.PropList) > 0 {
		apiCmd.Args = append(apiCmd.Args, fmt.Sprintf("=.proplist=%s", strings.Join(cmd.PropList, ",")))
	}

	return json.Marshal(apiCmd)
}

// formatCommand builds the API command path.
func (f *APIFormatter) formatCommand(cmd *translator.CanonicalCommand) string {
	// Convert action to API verb
	verb := f.actionToVerb(cmd.Action)

	// Build command path
	return cmd.Path + "/" + verb
}

// actionToVerb converts a canonical action to API verb.
func (f *APIFormatter) actionToVerb(action translator.Action) string {
	switch action {
	case translator.ActionPrint:
		return verbPrint
	case translator.ActionGet:
		return verbPrint // Get is just print with ID filter
	case translator.ActionAdd:
		return "add"
	case translator.ActionSet:
		return verbSet
	case translator.ActionRemove:
		return "remove"
	case translator.ActionEnable:
		return verbSet // Enable is set with disabled=no
	case translator.ActionDisable:
		return verbSet // Disable is set with disabled=yes
	case translator.ActionMove:
		return "move"
	}
	return string(action) // fallback to raw action string for unknown custom RouterOS actions
}

// formatFilter converts a filter to API query format.
func (f *APIFormatter) formatFilter(filter translator.Filter) string {
	// API uses ? prefix for queries
	// Operators: = (equals), < (less), > (greater)
	var op string
	switch filter.Operator {
	case translator.FilterOpEquals:
		op = "="
	case translator.FilterOpNotEquals:
		// Not equals uses negation in API
		return fmt.Sprintf("?%s=%s", filter.Field, f.formatValue(filter.Value))
	case translator.FilterOpGreater:
		op = ">"
	case translator.FilterOpLess:
		op = "<"
	case translator.FilterOpGreaterOrEq:
		op = ">="
	case translator.FilterOpLessOrEq:
		op = "<="
	case translator.FilterOpContains:
		op = "~" // Regex
	case translator.FilterOpIn:
		// In operator handled separately if needed
		op = "in"
	default:
		op = "="
	}

	return fmt.Sprintf("?%s%s%s", filter.Field, op, f.formatValue(filter.Value))
}

// formatValue formats a value for the Binary API.
func (f *APIFormatter) formatValue(v interface{}) string {
	switch val := v.(type) {
	case bool:
		if val {
			return boolYes
		}
		return boolNo
	case []string:
		return strings.Join(val, ",")
	case string:
		return val
	default:
		return fmt.Sprintf("%v", v)
	}
}

// APIResponse represents a parsed Binary API response.
type APIResponse struct {
	Re   []map[string]string `json:"re"`   // Reply sentences
	Done map[string]string   `json:"done"` // Done sentence with return value
	Trap *APITrap            `json:"trap"` // Error trap
}

// APITrap represents an API error response.
type APITrap struct {
	Category string `json:"category"`
	Message  string `json:"message"`
}

// Parse converts Binary API response bytes to canonical format.
func (f *APIFormatter) Parse(response []byte) (*translator.CanonicalResponse, error) {
	if len(response) == 0 {
		return translator.NewSuccessResponse(nil), nil
	}

	// Try to parse as JSON (our serialization format)
	var apiResp APIResponse
	if err := json.Unmarshal(response, &apiResp); err == nil {
		return f.parseAPIResponse(&apiResp)
	}

	// Try to parse as raw API output (from go-routers Reply)
	return f.parseRawResponse(response)
}

// parseAPIResponse converts our JSON-serialized API response.
func (f *APIFormatter) parseAPIResponse(resp *APIResponse) (*translator.CanonicalResponse, error) {
	// Check for trap (error)
	if resp.Trap != nil {
		return &translator.CanonicalResponse{
			Success: false,
			Error: &translator.CommandError{
				Code:     "API_TRAP",
				Message:  resp.Trap.Message,
				Category: f.categorizeError(resp.Trap.Category, resp.Trap.Message),
			},
			Metadata: translator.ResponseMetadata{
				Protocol: translator.ProtocolAPI,
			},
		}, nil
	}

	// Check for return value (add operation)
	if resp.Done != nil {
		if ret, ok := resp.Done["ret"]; ok {
			return &translator.CanonicalResponse{
				Success: true,
				ID:      ret,
				Metadata: translator.ResponseMetadata{
					Protocol: translator.ProtocolAPI,
				},
			}, nil
		}
	}

	// Convert reply sentences to interface map
	if len(resp.Re) > 0 {
		// Convert []map[string]string to []map[string]interface{}
		data := make([]map[string]interface{}, len(resp.Re))
		for i, re := range resp.Re {
			data[i] = make(map[string]interface{}, len(re))
			for k, v := range re {
				data[i][k] = v
			}
		}

		return &translator.CanonicalResponse{
			Success: true,
			Data:    data,
			Metadata: translator.ResponseMetadata{
				Protocol:    translator.ProtocolAPI,
				RecordCount: len(data),
			},
		}, nil
	}

	return translator.NewSuccessResponse(nil), nil
}

// rawParseState holds the intermediate state from parsing raw API lines.
type rawParseState struct {
	records       []map[string]interface{}
	currentRecord map[string]interface{}
	trapMessage   string
	retValue      string
}

// parseRawLines iterates over raw API protocol output lines and populates the parse state.
func (f *APIFormatter) parseRawLines(response []byte) *rawParseState {
	lines := bytes.Split(response, []byte("\n"))
	state := &rawParseState{}

	for _, line := range lines {
		lineStr := string(bytes.TrimSpace(line))
		if lineStr == "" {
			continue
		}
		f.processRawLine(lineStr, state)
	}
	return state
}

// processRawLine handles a single line of raw API output.
func (f *APIFormatter) processRawLine(lineStr string, state *rawParseState) {
	switch {
	case lineStr == "!re":
		if state.currentRecord != nil {
			state.records = append(state.records, state.currentRecord)
		}
		state.currentRecord = make(map[string]interface{})

	case lineStr == "!done":
		if state.currentRecord != nil {
			state.records = append(state.records, state.currentRecord)
			state.currentRecord = nil
		}

	case lineStr == "!trap":
		state.currentRecord = nil

	case strings.HasPrefix(lineStr, "="):
		f.processRawKeyValue(lineStr, state)
	}
}

// processRawKeyValue handles a key-value pair line (=name=value) from raw API output.
func (f *APIFormatter) processRawKeyValue(lineStr string, state *rawParseState) {
	kv := strings.SplitN(lineStr[1:], "=", 2)
	if len(kv) != 2 {
		return
	}
	switch {
	case kv[0] == "ret":
		state.retValue = kv[1]
	case kv[0] == "message" && state.trapMessage == "":
		state.trapMessage = kv[1]
	case state.currentRecord != nil:
		state.currentRecord[kv[0]] = kv[1]
	}
}

// buildRawResponse converts the parsed state into a CanonicalResponse.
func (f *APIFormatter) buildRawResponse(state *rawParseState) *translator.CanonicalResponse {
	if state.trapMessage != "" {
		return &translator.CanonicalResponse{
			Success: false,
			Error: &translator.CommandError{
				Code:     "API_ERROR",
				Message:  state.trapMessage,
				Category: translator.ErrorCategoryInternal,
			},
			Metadata: translator.ResponseMetadata{
				Protocol: translator.ProtocolAPI,
			},
		}
	}

	if state.retValue != "" {
		return &translator.CanonicalResponse{
			Success: true,
			ID:      state.retValue,
			Metadata: translator.ResponseMetadata{
				Protocol: translator.ProtocolAPI,
			},
		}
	}

	if len(state.records) > 0 {
		return &translator.CanonicalResponse{
			Success: true,
			Data:    state.records,
			Metadata: translator.ResponseMetadata{
				Protocol:    translator.ProtocolAPI,
				RecordCount: len(state.records),
			},
		}
	}

	// Default: return nil for empty response
	return nil
}

// parseRawResponse parses raw API protocol output.
func (f *APIFormatter) parseRawResponse(response []byte) (*translator.CanonicalResponse, error) {
	state := f.parseRawLines(response)
	if resp := f.buildRawResponse(state); resp != nil {
		return resp, nil
	}
	return translator.NewSuccessResponse(nil), nil
}

// categorizeError maps API error categories to canonical categories.
func (f *APIFormatter) categorizeError(category, message string) translator.ErrorCategory {
	// Check message first for specific error patterns
	lowerMsg := strings.ToLower(message)
	switch {
	case strings.Contains(lowerMsg, "not found") || strings.Contains(lowerMsg, "no such item"):
		return translator.ErrorCategoryNotFound
	case strings.Contains(lowerMsg, "already") || strings.Contains(lowerMsg, "duplicate"):
		return translator.ErrorCategoryConflict
	case strings.Contains(lowerMsg, "invalid") || strings.Contains(lowerMsg, "bad"):
		return translator.ErrorCategoryValidation
	}

	// Then check category codes
	switch category {
	case "0": // General error
		return translator.ErrorCategoryInternal
	case "1": // Argument error
		return translator.ErrorCategoryValidation
	case "2": // Execution error
		if strings.Contains(message, "not found") {
			return translator.ErrorCategoryNotFound
		}
		if strings.Contains(message, "already") {
			return translator.ErrorCategoryConflict
		}
		return translator.ErrorCategoryInternal
	case "3": // API server error
		return translator.ErrorCategoryInternal
	case "4": // Login failure
		return translator.ErrorCategoryPermission
	case "5": // Fatal error
		return translator.ErrorCategoryInternal
	}

	return translator.ErrorCategoryInternal
}
