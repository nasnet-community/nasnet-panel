package formatters

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"backend/internal/translator"
)

// REST API constants.
const (
	restBoolYes = "yes"
	restBoolNo  = "no"
)

// RESTFormatter formats commands for the RouterOS REST API (7.1+).
//
// REST API format:
//   - GET /rest/interface/ethernet for print
//   - GET /rest/interface/ethernet/*1 for get by ID
//   - PUT /rest/interface/ethernet with JSON body for add
//   - PATCH /rest/interface/ethernet/*1 with JSON body for set
//   - DELETE /rest/interface/ethernet/*1 for remove
//
// The Format method returns JSON that includes HTTP method and path metadata.
type RESTFormatter struct{}

// NewRESTFormatter creates a new REST formatter.
func NewRESTFormatter() *RESTFormatter {
	return &RESTFormatter{}
}

// Protocol returns the REST protocol type.
func (f *RESTFormatter) Protocol() translator.Protocol {
	return translator.ProtocolREST
}

// RESTRequest represents a formatted REST API request.
type RESTRequest struct {
	Method string                 `json:"method"`
	Path   string                 `json:"path"`
	Body   map[string]interface{} `json:"body,omitempty"`
	Query  map[string]string      `json:"query,omitempty"`
}

// Format converts a canonical command to REST API format.
func (f *RESTFormatter) Format(cmd *translator.CanonicalCommand) ([]byte, error) {
	if cmd == nil {
		return nil, fmt.Errorf("nil command")
	}

	req := RESTRequest{
		Path:  f.formatPath(cmd),
		Query: make(map[string]string),
	}

	switch cmd.Action {
	case translator.ActionPrint:
		req.Method = http.MethodGet
		// Add filters as query parameters
		for _, filter := range cmd.Filters {
			req.Query[filter.Field] = fmt.Sprintf("%v", filter.Value)
		}
		// Add proplist as .proplist query param
		if len(cmd.PropList) > 0 {
			req.Query[".proplist"] = strings.Join(cmd.PropList, ",")
		}

	case translator.ActionGet:
		req.Method = http.MethodGet
		// ID is already in the path

	case translator.ActionAdd:
		req.Method = http.MethodPut
		req.Body = f.formatBody(cmd.Parameters)

	case translator.ActionSet:
		req.Method = http.MethodPatch
		req.Body = f.formatBody(cmd.Parameters)

	case translator.ActionRemove:
		req.Method = http.MethodDelete

	case translator.ActionEnable:
		req.Method = http.MethodPatch
		req.Body = map[string]interface{}{"disabled": restBoolNo}

	case translator.ActionDisable:
		req.Method = http.MethodPatch
		req.Body = map[string]interface{}{"disabled": restBoolYes}

	case translator.ActionMove:
		req.Method = http.MethodPost
	default:
		return nil, fmt.Errorf("unsupported action for REST: %s", cmd.Action)
	}

	// Remove empty query map
	if len(req.Query) == 0 {
		req.Query = nil
	}

	return json.Marshal(req)
}

// formatPath converts the canonical path to REST API path format.
func (f *RESTFormatter) formatPath(cmd *translator.CanonicalCommand) string {
	// REST API paths start with /rest
	path := "/rest" + cmd.Path

	// For get/set/remove by ID, append the ID
	if cmd.ID != "" && (cmd.Action == translator.ActionGet ||
		cmd.Action == translator.ActionSet ||
		cmd.Action == translator.ActionRemove ||
		cmd.Action == translator.ActionEnable ||
		cmd.Action == translator.ActionDisable) {

		path += "/" + cmd.ID
	}

	return path
}

// formatBody formats parameters for the request body.
func (f *RESTFormatter) formatBody(params map[string]interface{}) map[string]interface{} {
	body := make(map[string]interface{}, len(params))
	for k, v := range params {
		// REST API uses the same field names as the canonical format (kebab-case)
		body[k] = f.formatValue(v)
	}
	return body
}

// formatValue formats a single value for the REST API.
func (f *RESTFormatter) formatValue(v interface{}) interface{} {
	switch val := v.(type) {
	case bool:
		if val {
			return restBoolYes
		}
		return restBoolNo
	case []string:
		return strings.Join(val, ",")
	default:
		return v
	}
}

// RESTResponse represents a REST API response.
type RESTResponse struct {
	Data    interface{}            `json:"data,omitempty"`
	Error   *RESTError             `json:"error,omitempty"`
	ID      string                 `json:"ret,omitempty"` // Return value for add operations
	Details map[string]interface{} `json:"-"`             // Captures unknown fields
}

// RESTError represents a REST API error response.
type RESTError struct {
	Code    int    `json:"error"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

// Parse converts REST API response bytes to canonical format.
func (f *RESTFormatter) Parse(response []byte) (*translator.CanonicalResponse, error) {
	if len(response) == 0 {
		return translator.NewSuccessResponse(nil), nil
	}

	// Try to parse as array first (list response)
	var listData []map[string]interface{}
	if err := json.Unmarshal(response, &listData); err == nil {
		return &translator.CanonicalResponse{
			Success: true,
			Data:    listData,
			Metadata: translator.ResponseMetadata{
				Protocol:    translator.ProtocolREST,
				RecordCount: len(listData),
			},
		}, nil
	}

	// Try to parse as single object
	var objData map[string]interface{}
	if err := json.Unmarshal(response, &objData); err == nil { //nolint:nestif // error response handling requires nested checks
		// Check for error response
		if errCode, hasErr := objData["error"]; hasErr {
			errMsg, _ := objData["message"].(string)   //nolint:errcheck // type assertion - zero value is acceptable
			errDetail, _ := objData["detail"].(string) //nolint:errcheck // type assertion - zero value is acceptable
			if errDetail != "" {
				errMsg = errMsg + ": " + errDetail
			} else {
				_ = errMsg
			}

			return &translator.CanonicalResponse{
				Success: false,
				Error: &translator.CommandError{
					Code:     fmt.Sprintf("REST_%v", errCode),
					Message:  errMsg,
					Category: f.categorizeError(errCode, errMsg),
				},
				Metadata: translator.ResponseMetadata{
					Protocol: translator.ProtocolREST,
				},
			}, nil
		}

		// Check for add response with "ret" field
		if ret, hasRet := objData["ret"]; hasRet {
			return &translator.CanonicalResponse{
				Success: true,
				ID:      fmt.Sprintf("%v", ret),
				Metadata: translator.ResponseMetadata{
					Protocol: translator.ProtocolREST,
				},
			}, nil
		}

		return &translator.CanonicalResponse{
			Success: true,
			Data:    objData,
			Metadata: translator.ResponseMetadata{
				Protocol:    translator.ProtocolREST,
				RecordCount: 1,
			},
		}, nil
	}

	// Return raw response as string if JSON parsing fails
	return &translator.CanonicalResponse{
		Success: true,
		Data:    string(response),
		Metadata: translator.ResponseMetadata{
			Protocol: translator.ProtocolREST,
		},
	}, nil
}

// categorizeError maps REST error codes to canonical error categories.
func (f *RESTFormatter) categorizeError(code interface{}, message string) translator.ErrorCategory {
	switch code {
	case 400:
		return translator.ErrorCategoryValidation
	case 401, 403:
		return translator.ErrorCategoryPermission
	case 404:
		return translator.ErrorCategoryNotFound
	case 409:
		return translator.ErrorCategoryConflict
	case 408, 504:
		return translator.ErrorCategoryTimeout
	case 500, 502, 503:
		return translator.ErrorCategoryInternal
	}

	// Check message for hints
	lowerMsg := strings.ToLower(message)
	if strings.Contains(lowerMsg, "not found") {
		return translator.ErrorCategoryNotFound
	}
	if strings.Contains(lowerMsg, "already exists") {
		return translator.ErrorCategoryConflict
	}

	return translator.ErrorCategoryInternal
}
