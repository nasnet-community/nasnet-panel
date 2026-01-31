package translator

import (
	"time"
)

// CommandBuilder provides a fluent API for constructing CanonicalCommands.
//
// Example usage:
//
//	cmd := NewCommandBuilder("/interface/ethernet").
//	    WithAction(ActionSet).
//	    WithID("*1").
//	    WithParam("disabled", false).
//	    WithParam("mtu", 1500).
//	    WithVersion(version).
//	    WithRequestID(requestID).
//	    Build()
type CommandBuilder struct {
	cmd *CanonicalCommand
}

// NewCommandBuilder creates a new command builder for the given path.
func NewCommandBuilder(path string) *CommandBuilder {
	return &CommandBuilder{
		cmd: &CanonicalCommand{
			Path:       path,
			Parameters: make(map[string]interface{}),
			Filters:    make([]Filter, 0),
		},
	}
}

// WithAction sets the action for the command.
func (b *CommandBuilder) WithAction(action Action) *CommandBuilder {
	b.cmd.Action = action
	return b
}

// WithID sets the target item ID.
func (b *CommandBuilder) WithID(id string) *CommandBuilder {
	b.cmd.ID = id
	return b
}

// WithParam adds a parameter to the command.
func (b *CommandBuilder) WithParam(key string, value interface{}) *CommandBuilder {
	b.cmd.Parameters[key] = value
	return b
}

// WithParams adds multiple parameters to the command.
func (b *CommandBuilder) WithParams(params map[string]interface{}) *CommandBuilder {
	for k, v := range params {
		b.cmd.Parameters[k] = v
	}
	return b
}

// WithFilter adds a query filter.
func (b *CommandBuilder) WithFilter(field string, op FilterOp, value interface{}) *CommandBuilder {
	b.cmd.Filters = append(b.cmd.Filters, Filter{
		Field:    field,
		Operator: op,
		Value:    value,
	})
	return b
}

// WithEqualFilter adds an equality filter (shorthand for WithFilter with FilterOpEquals).
func (b *CommandBuilder) WithEqualFilter(field string, value interface{}) *CommandBuilder {
	return b.WithFilter(field, FilterOpEquals, value)
}

// WithPropList sets the fields to return in print operations.
func (b *CommandBuilder) WithPropList(props ...string) *CommandBuilder {
	b.cmd.PropList = props
	return b
}

// WithVersion sets the target RouterOS version.
func (b *CommandBuilder) WithVersion(version *RouterOSVersion) *CommandBuilder {
	b.cmd.Version = version
	return b
}

// WithTimeout sets a custom timeout for the command.
func (b *CommandBuilder) WithTimeout(timeout time.Duration) *CommandBuilder {
	b.cmd.Timeout = timeout
	return b
}

// WithRequestID sets the correlation request ID.
func (b *CommandBuilder) WithRequestID(requestID string) *CommandBuilder {
	b.cmd.Metadata.RequestID = requestID
	return b
}

// WithOperationName sets the GraphQL operation name.
func (b *CommandBuilder) WithOperationName(name string) *CommandBuilder {
	b.cmd.Metadata.OperationName = name
	return b
}

// WithFieldPath sets the GraphQL field path.
func (b *CommandBuilder) WithFieldPath(path string) *CommandBuilder {
	b.cmd.Metadata.FieldPath = path
	return b
}

// WithRouterID sets the target router ID.
func (b *CommandBuilder) WithRouterID(routerID string) *CommandBuilder {
	b.cmd.Metadata.RouterID = routerID
	return b
}

// WithMetadata sets all metadata fields at once.
func (b *CommandBuilder) WithMetadata(meta CommandMetadata) *CommandBuilder {
	b.cmd.Metadata = meta
	return b
}

// Build returns the constructed CanonicalCommand.
func (b *CommandBuilder) Build() *CanonicalCommand {
	return b.cmd
}

// BuildGet is a convenience method that sets ActionGet and builds.
func (b *CommandBuilder) BuildGet() *CanonicalCommand {
	b.cmd.Action = ActionGet
	return b.cmd
}

// BuildPrint is a convenience method that sets ActionPrint and builds.
func (b *CommandBuilder) BuildPrint() *CanonicalCommand {
	b.cmd.Action = ActionPrint
	return b.cmd
}

// BuildAdd is a convenience method that sets ActionAdd and builds.
func (b *CommandBuilder) BuildAdd() *CanonicalCommand {
	b.cmd.Action = ActionAdd
	return b.cmd
}

// BuildSet is a convenience method that sets ActionSet and builds.
func (b *CommandBuilder) BuildSet() *CanonicalCommand {
	b.cmd.Action = ActionSet
	return b.cmd
}

// BuildRemove is a convenience method that sets ActionRemove and builds.
func (b *CommandBuilder) BuildRemove() *CanonicalCommand {
	b.cmd.Action = ActionRemove
	return b.cmd
}

// Shorthand builder functions

// Print creates a print command builder.
func Print(path string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionPrint)
}

// Get creates a get command builder.
func Get(path string, id string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionGet).WithID(id)
}

// Add creates an add command builder.
func Add(path string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionAdd)
}

// Set creates a set command builder.
func Set(path string, id string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionSet).WithID(id)
}

// Remove creates a remove command builder.
func Remove(path string, id string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionRemove).WithID(id)
}

// Enable creates an enable command builder.
func Enable(path string, id string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionEnable).WithID(id)
}

// Disable creates a disable command builder.
func Disable(path string, id string) *CommandBuilder {
	return NewCommandBuilder(path).WithAction(ActionDisable).WithID(id)
}
