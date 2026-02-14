package main

// Thin wrapper that delegates to pkg/router/batch.
// The original implementation has been moved to backend/pkg/router/batch/.

import (
	"backend/pkg/router/batch"
)

// Type aliases for backward compatibility within package main.
type JobStatus = batch.JobStatus
type JobProgress = batch.JobProgress
type CommandError = batch.CommandError
type BatchJob = batch.Job
type BatchJobRequest = batch.JobRequest

// Constant aliases.
const (
	ProtocolAPI    = batch.ProtocolAPI
	ProtocolSSH    = batch.ProtocolSSH
	ProtocolTelnet = batch.ProtocolTelnet
)

// jobStore delegates to the batch package default store.
var jobStore = batch.DefaultJobStore
