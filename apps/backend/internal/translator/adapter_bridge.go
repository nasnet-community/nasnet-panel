// Package translator provides the adapter bridge that connects the translation
// layer to the protocol adapters in the router package.
//
// This bridge converts between:
//   - translator.CanonicalCommand → router.Command (outbound)
//   - router.CommandResult → translator.CanonicalResponse (inbound)
//
// It also provides a TranslatingPort wrapper that automatically translates
// GraphQL operations through the canonical model to protocol-specific commands.
package translator

import (
	"context"
	"fmt"
	"time"

	"backend/internal/router"
)

// AdapterBridge converts between the translator's canonical types and the
// router adapter's command/result types.
type AdapterBridge struct {
	fieldRegistry *FieldMappingRegistry
}

// NewAdapterBridge creates a new adapter bridge.
func NewAdapterBridge(registry *FieldMappingRegistry) *AdapterBridge {
	if registry == nil {
		registry = BuildDefaultRegistry()
	}
	return &AdapterBridge{fieldRegistry: registry}
}

// ToRouterCommand converts a CanonicalCommand to a router.Command.
func (b *AdapterBridge) ToRouterCommand(cmd *CanonicalCommand) router.Command {
	if cmd == nil {
		return router.Command{}
	}

	routerCmd := router.Command{
		Path:   cmd.Path,
		Action: string(cmd.Action),
		ID:     cmd.ID,
		Args:   make(map[string]string),
	}

	// Convert parameters to string args
	for key, value := range cmd.Parameters {
		routerCmd.Args[key] = fmt.Sprintf("%v", value)
	}

	// Convert filters to query string
	if len(cmd.Filters) > 0 {
		routerCmd.Query = b.filtersToQuery(cmd.Filters)
	}

	// Add proplist as a special arg
	if len(cmd.PropList) > 0 {
		var proplist string
		for i, prop := range cmd.PropList {
			if i > 0 {
				proplist += ","
			}
			proplist += prop
		}
		routerCmd.Args[".proplist"] = proplist
	}

	return routerCmd
}

// filtersToQuery converts filters to a query string for the adapter.
func (b *AdapterBridge) filtersToQuery(filters []Filter) string {
	var query string
	for i, f := range filters {
		if i > 0 {
			query += " "
		}
		switch f.Operator {
		case FilterOpEquals:
			query += fmt.Sprintf("%s=%v", f.Field, f.Value)
		case FilterOpNotEquals:
			query += fmt.Sprintf("%s!=%v", f.Field, f.Value)
		case FilterOpGreater:
			query += fmt.Sprintf("%s>%v", f.Field, f.Value)
		case FilterOpLess:
			query += fmt.Sprintf("%s<%v", f.Field, f.Value)
		case FilterOpContains:
			query += fmt.Sprintf("%s~%v", f.Field, f.Value)
		default:
			query += fmt.Sprintf("%s=%v", f.Field, f.Value)
		}
	}
	return query
}

// FromCommandResult converts a router.CommandResult to a CanonicalResponse.
func (b *AdapterBridge) FromCommandResult(result *router.CommandResult, protocol Protocol) *CanonicalResponse {
	if result == nil {
		return NewSuccessResponse(nil)
	}

	if !result.Success {
		errMsg := "unknown error"
		if result.Error != nil {
			errMsg = result.Error.Error()
		}
		return &CanonicalResponse{
			Success: false,
			Error: &CommandError{
				Code:     "ADAPTER_ERROR",
				Message:  errMsg,
				Category: categorizeAdapterError(result.Error),
			},
			Metadata: ResponseMetadata{
				Protocol:   protocol,
				Duration:   result.Duration,
							},
		}
	}

	// Convert []map[string]string to the canonical format
	if len(result.Data) > 0 {
		data := make([]map[string]interface{}, len(result.Data))
		for i, record := range result.Data {
			data[i] = make(map[string]interface{}, len(record))
			for k, v := range record {
				data[i][k] = v
			}
		}

		return &CanonicalResponse{
			Success: true,
			Data:    data,
			ID:      result.ID,
			Metadata: ResponseMetadata{
				Protocol:    protocol,
				RecordCount: len(data),
				Duration:    result.Duration,
			},
		}
	}

	// No data, just success (or ID from add operation)
	return &CanonicalResponse{
		Success: true,
		ID:      result.ID,
		Metadata: ResponseMetadata{
			Protocol: protocol,
			Duration: result.Duration,
		},
	}
}

// categorizeAdapterError determines the error category from an adapter error.
func categorizeAdapterError(err error) ErrorCategory {
	if err == nil {
		return ErrorCategoryInternal
	}

	// Check for AdapterError type
	if adapterErr, ok := err.(*router.AdapterError); ok {
		return categorizeByRouterOSError(adapterErr)
	}

	// Fall back to message-based classification
	cmdErr := TranslateError(err, "")
	if cmdErr != nil {
		return cmdErr.Category
	}

	return ErrorCategoryInternal
}

// categorizeByRouterOSError maps RouterOS error codes to categories.
func categorizeByRouterOSError(err *router.AdapterError) ErrorCategory {
	if err.Retryable {
		return ErrorCategoryConnection
	}

	// Use message-based classification
	cmdErr := TranslateError(err, "")
	if cmdErr != nil {
		return cmdErr.Category
	}

	return ErrorCategoryInternal
}

// MapRouterProtocol converts router.Protocol to translator.Protocol.
func MapRouterProtocol(p router.Protocol) Protocol {
	switch p {
	case router.ProtocolREST:
		return ProtocolREST
	case router.ProtocolAPI:
		return ProtocolAPI
	case router.ProtocolAPISSL:
		return ProtocolAPI // Treat API-SSL same as API for translation
	case router.ProtocolSSH:
		return ProtocolSSH
	default:
		return ProtocolSSH // Default to SSH for telnet/unknown
	}
}

// MapRouterVersion converts router.RouterOSVersion to translator.RouterOSVersion.
func MapRouterVersion(v *router.RouterOSVersion) *RouterOSVersion {
	if v == nil {
		return nil
	}
	return &RouterOSVersion{
		Major: v.Major,
		Minor: v.Minor,
		Patch: v.Patch,
	}
}

// TranslatingPort wraps a RouterPort to provide automatic GraphQL-to-RouterOS translation.
// This is the main entry point for resolvers to execute commands with translation.
type TranslatingPort struct {
	port       router.RouterPort
	translator *Translator
	bridge     *AdapterBridge
	responseRT *ResponseTranslator
}

// NewTranslatingPort creates a port wrapper with translation capabilities.
func NewTranslatingPort(port router.RouterPort, translator *Translator) *TranslatingPort {
	bridge := NewAdapterBridge(translator.registry)
	responseRT := NewResponseTranslator(translator.registry)

	return &TranslatingPort{
		port:       port,
		translator: translator,
		bridge:     bridge,
		responseRT: responseRT,
	}
}

// Query executes a print command and returns translated GraphQL-compatible results.
func (tp *TranslatingPort) Query(ctx context.Context, path string, filters map[string]interface{}, propList []string, meta CommandMetadata) (*CanonicalResponse, error) {
	// Update translator version from router info
	tp.syncVersion()

	// Translate to canonical command
	cmd, err := tp.translator.TranslateQuery(path, filters, propList, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	// Execute through adapter
	result, execErr := tp.execute(ctx, cmd)
	if execErr != nil {
		return nil, execErr
	}

	// Translate response to GraphQL format
	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Get retrieves a single resource by ID.
func (tp *TranslatingPort) Get(ctx context.Context, path, id string, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateGet(path, id, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result, execErr := tp.execute(ctx, cmd)
	if execErr != nil {
		return nil, execErr
	}

	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Create adds a new resource.
func (tp *TranslatingPort) Create(ctx context.Context, path string, fields map[string]interface{}, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateCreate(path, fields, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result, execErr := tp.execute(ctx, cmd)
	if execErr != nil {
		return nil, execErr
	}

	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Update modifies an existing resource.
func (tp *TranslatingPort) Update(ctx context.Context, path, id string, fields map[string]interface{}, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateUpdate(path, id, fields, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result, execErr := tp.execute(ctx, cmd)
	if execErr != nil {
		return nil, execErr
	}

	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Delete removes a resource.
func (tp *TranslatingPort) Delete(ctx context.Context, path, id string, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateDelete(path, id, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result, execErr := tp.execute(ctx, cmd)
	if execErr != nil {
		return nil, execErr
	}

	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// ExecuteCanonical executes a pre-built canonical command with translation.
func (tp *TranslatingPort) ExecuteCanonical(ctx context.Context, cmd *CanonicalCommand) (*CanonicalResponse, error) {
	result, err := tp.execute(ctx, cmd)
	if err != nil {
		return nil, err
	}

	return tp.responseRT.TranslateResponse(ctx, cmd.Path, result)
}

// execute converts a canonical command to a router command and executes it.
func (tp *TranslatingPort) execute(ctx context.Context, cmd *CanonicalCommand) (*CanonicalResponse, error) {
	// Convert to router command
	routerCmd := tp.bridge.ToRouterCommand(cmd)

	// Set timeout from command
	if cmd.Timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, cmd.Timeout)
		defer cancel()
	}

	// Execute on the adapter
	result, err := tp.port.ExecuteCommand(ctx, routerCmd)
	if err != nil {
		// Convert adapter error to canonical response
		protocol := MapRouterProtocol(tp.port.Protocol())
		translatedErr := TranslateError(err, protocol)
		return &CanonicalResponse{
			Success: false,
			Error:   translatedErr,
			Metadata: ResponseMetadata{
				Protocol: protocol,
			},
		}, nil
	}

	// Convert CommandResult to CanonicalResponse
	protocol := MapRouterProtocol(tp.port.Protocol())
	return tp.bridge.FromCommandResult(result, protocol), nil
}

// syncVersion updates the translator version from the router's info.
func (tp *TranslatingPort) syncVersion() {
	if tp.translator.version != nil {
		return // Already set
	}

	info, err := tp.port.Info()
	if err != nil || info == nil {
		return
	}

	tp.translator.SetVersion(MapRouterVersion(&info.Version))
}

// Port returns the underlying RouterPort.
func (tp *TranslatingPort) Port() router.RouterPort {
	return tp.port
}

// Protocol returns the protocol of the underlying port.
func (tp *TranslatingPort) Protocol() Protocol {
	return MapRouterProtocol(tp.port.Protocol())
}

// Health returns the health status of the underlying connection.
func (tp *TranslatingPort) Health(ctx context.Context) router.HealthStatus {
	return tp.port.Health(ctx)
}

// BatchExecutor executes multiple commands through the translating port.
type BatchExecutor struct {
	port *TranslatingPort
}

// NewBatchExecutor creates a batch executor.
func NewBatchExecutor(port *TranslatingPort) *BatchExecutor {
	return &BatchExecutor{port: port}
}

// BatchCommand represents a single command in a batch operation.
type BatchCommand struct {
	// Command is the canonical command to execute.
	Command *CanonicalCommand

	// StopOnError indicates whether to halt the batch on this command's failure.
	StopOnError bool
}

// BatchResult contains the results of a batch execution.
type BatchResult struct {
	// Results contains the response for each command.
	Results []*CanonicalResponse

	// TotalDuration is the total time for the batch.
	TotalDuration time.Duration

	// FailedIndex is the index of the first failed command (-1 if all succeeded).
	FailedIndex int
}

// Execute runs a batch of commands sequentially.
func (be *BatchExecutor) Execute(ctx context.Context, commands []BatchCommand) *BatchResult {
	start := time.Now()
	result := &BatchResult{
		Results:     make([]*CanonicalResponse, len(commands)),
		FailedIndex: -1,
	}

	for i, bc := range commands {
		select {
		case <-ctx.Done():
			// Context cancelled, fill remaining with error
			for j := i; j < len(commands); j++ {
				result.Results[j] = &CanonicalResponse{
					Success: false,
					Error: &CommandError{
						Code:     "CANCELLED",
						Message:  "batch execution cancelled",
						Category: ErrorCategoryTimeout,
					},
				}
			}
			if result.FailedIndex == -1 {
				result.FailedIndex = i
			}
			result.TotalDuration = time.Since(start)
			return result
		default:
		}

		response, err := be.port.ExecuteCanonical(ctx, bc.Command)
		if err != nil {
			result.Results[i] = &CanonicalResponse{
				Success: false,
				Error: &CommandError{
					Code:     "EXECUTION_ERROR",
					Message:  err.Error(),
					Category: ErrorCategoryInternal,
				},
			}
		} else {
			result.Results[i] = response
		}

		// Check for failure with stop-on-error
		if result.Results[i] != nil && !result.Results[i].Success {
			if result.FailedIndex == -1 {
				result.FailedIndex = i
			}
			if bc.StopOnError {
				// Fill remaining with skipped
				for j := i + 1; j < len(commands); j++ {
					result.Results[j] = &CanonicalResponse{
						Success: false,
						Error: &CommandError{
							Code:     "SKIPPED",
							Message:  fmt.Sprintf("skipped due to failure at command %d", i),
							Category: ErrorCategoryInternal,
						},
					}
				}
				break
			}
		}
	}

	result.TotalDuration = time.Since(start)
	return result
}
