package main

// Thin wrapper that delegates to pkg/router/batch.
// The original implementation has been moved to backend/pkg/router/batch/.

import (
	"net/http"

	"backend/pkg/router/batch"
)

// BatchJobSubmitRequest delegates to batch.SubmitRequest.
type BatchJobSubmitRequest = batch.SubmitRequest

// BatchJobSubmitResponse delegates to batch.SubmitResponse.
type BatchJobSubmitResponse = batch.SubmitResponse

// handleBatchJobs delegates to the batch package.
func handleBatchJobs(w http.ResponseWriter, r *http.Request) {
	batch.HandleBatchJobs(w, r)
}
