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
	"errors"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"

	"backend/internal/router"
)

// AdapterBridge converts between the translator's canonical types and the
// router adapter's command/result types.
type AdapterBridge struct {
	fieldRegistry *FieldMappingRegistry
	logger        *zap.Logger
}

// asString converts a value to its string representation.
func asString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	if b, ok := v.([]byte); ok {
		return string(b)
	}
	// For other types, use standard conversion without exposing internals
	return "[value]"
}

// NewAdapterBridge creates a new adapter bridge.
func NewAdapterBridge(registry *FieldMappingRegistry) *AdapterBridge {
	if registry == nil {
		registry = BuildDefaultRegistry()
	}
	if registry == nil {
		// Defensive: BuildDefaultRegistry should always return a non-nil value
		panic("failed to create default field mapping registry")
	}
	logger := zap.L().Named("translator.AdapterBridge")
	return &AdapterBridge{fieldRegistry: registry, logger: logger}
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
		// Note: Key names checked for sensitive data redaction at resolver layer
		routerCmd.Args[key] = asString(value)
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
		// Build query with field name and operator (value is appended safely)
		var prefix string
		switch f.Operator {
		case FilterOpEquals:
			prefix = f.Field + "="
		case FilterOpNotEquals:
			prefix = f.Field + "!="
		case FilterOpGreater:
			prefix = f.Field + ">"
		case FilterOpLess:
			prefix = f.Field + "<"
		case FilterOpContains:
			prefix = f.Field + "~"
		case FilterOpGreaterOrEq:
			prefix = f.Field + ">="
		case FilterOpLessOrEq:
			prefix = f.Field + "<="
		case FilterOpIn:
			prefix = f.Field + string(f.Operator)
		default:
			prefix = f.Field + "="
		}
		query += prefix + asString(f.Value)
	}
	return query
}

// FromCommandResult converts a router.CommandResult to a CanonicalResponse.
func (b *AdapterBridge) FromCommandResult(result *router.CommandResult, protocol Protocol) *CanonicalResponse {
	if result == nil {
		return NewSuccessResponse(nil)
	}

	if !result.Success {
		b.logger.Warn("adapter command failed", zap.Error(result.Error), zap.String("protocol", string(protocol)))
		errMsg := "command failed"
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
				Protocol: protocol,
				Duration: result.Duration,
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
	var adapterErr *router.AdapterError
	if errors.As(err, &adapterErr) {
		return categorizeByRouterOSError(adapterErr)
	}

	// Fall back to message-based classification
	cmdErr := TranslateError(err, ProtocolAPI)
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
	cmdErr := TranslateError(err, ProtocolAPI)
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
	case router.ProtocolTelnet:
		return ProtocolTelnet
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
	versionMu  sync.Mutex // Protects version synchronization
}

// NewTranslatingPort creates a port wrapper with translation capabilities.
func NewTranslatingPort(port router.RouterPort, translator *Translator) *TranslatingPort {
	if port == nil {
		panic("NewTranslatingPort: port is nil")
	}
	if translator == nil {
		panic("NewTranslatingPort: translator is nil")
	}

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
	result := tp.execute(ctx, cmd)

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

	result := tp.execute(ctx, cmd)
	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Create adds a new resource.
func (tp *TranslatingPort) Create(ctx context.Context, path string, fields map[string]interface{}, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateCreate(path, fields, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result := tp.execute(ctx, cmd)
	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Update modifies an existing resource.
func (tp *TranslatingPort) Update(ctx context.Context, path, id string, fields map[string]interface{}, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateUpdate(path, id, fields, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result := tp.execute(ctx, cmd)
	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// Delete removes a resource.
func (tp *TranslatingPort) Delete(ctx context.Context, path, id string, meta CommandMetadata) (*CanonicalResponse, error) {
	tp.syncVersion()

	cmd, err := tp.translator.TranslateDelete(path, id, meta)
	if err != nil {
		return nil, fmt.Errorf("translation error: %w", err)
	}

	result := tp.execute(ctx, cmd)
	return tp.responseRT.TranslateResponse(ctx, path, result)
}

// ExecuteCanonical executes a pre-built canonical command with translation.
func (tp *TranslatingPort) ExecuteCanonical(ctx context.Context, cmd *CanonicalCommand) (*CanonicalResponse, error) {
	result := tp.execute(ctx, cmd)
	return tp.responseRT.TranslateResponse(ctx, cmd.Path, result)
}

// execute converts a canonical command to a router command and executes it.
func (tp *TranslatingPort) execute(ctx context.Context, cmd *CanonicalCommand) *CanonicalResponse {
	if cmd == nil {
		return &CanonicalResponse{
			Success: false,
			Error: &CommandError{
				Code:     "INVALID_COMMAND",
				Message:  "command is nil",
				Category: ErrorCategoryInternal,
			},
		}
	}

	// Convert to router command
	routerCmd := tp.bridge.ToRouterCommand(cmd)

	// Set timeout from command, preserving parent context cancellation
	execCtx := ctx
	var cancel context.CancelFunc
	if cmd.Timeout > 0 {
		execCtx, cancel = context.WithTimeout(ctx, cmd.Timeout)
		defer cancel()
	}

	// Execute on the adapter
	result, err := tp.port.ExecuteCommand(execCtx, routerCmd)
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
		}
	}

	// Convert CommandResult to CanonicalResponse
	protocol := MapRouterProtocol(tp.port.Protocol())
	return tp.bridge.FromCommandResult(result, protocol)
}

// syncVersion updates the translator version from the router's info.
// This method is thread-safe and idempotent.
func (tp *TranslatingPort) syncVersion() {
	// Quick check without lock
	if tp.translator.GetVersion() != nil {
		return // Already set
	}

	tp.versionMu.Lock()
	defer tp.versionMu.Unlock()

	// Double-check after acquiring lock
	if tp.translator.GetVersion() != nil {
		return
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
			// Context canceled, fill remaining with error
			for j := i; j < len(commands); j++ {
				result.Results[j] = &CanonicalResponse{
					Success: false,
					Error: &CommandError{
						Code:     "CANCELED",
						Message:  "batch execution canceled",
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
