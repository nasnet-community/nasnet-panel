package nat

// rollback.go contains rollback and validation logic for NAT operations.
// Currently, the rollback functionality is handled inline within the port forward
// creation logic. This file is reserved for future expansion of rollback capabilities.

// Future enhancements could include:
// - Transaction-based rollback for complex multi-rule operations
// - Validation of NAT rule prerequisites
// - Rule conflict detection
// - Automatic cleanup of orphaned rules
