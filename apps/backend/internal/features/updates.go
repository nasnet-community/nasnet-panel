package features

import (
	"backend/internal/features/updates"
)

// UpdateService is an alias for updates.UpdateService.
type UpdateService = updates.UpdateService

// UpdateServiceConfig is an alias for updates.UpdateServiceConfig.
type UpdateServiceConfig = updates.UpdateServiceConfig

// UpdateScheduler is an alias for updates.UpdateScheduler.
type UpdateScheduler = updates.UpdateScheduler

// UpdateSchedulerConfig is an alias for updates.UpdateSchedulerConfig.
type UpdateSchedulerConfig = updates.UpdateSchedulerConfig

// UpdateEngine is an alias for updates.UpdateEngine.
type UpdateEngine = updates.UpdateEngine

// UpdateEngineConfig is an alias for updates.UpdateEngineConfig.
type UpdateEngineConfig = updates.UpdateEngineConfig

// UpdateJournal is an alias for updates.UpdateJournal.
type UpdateJournal = updates.UpdateJournal

// UpdateInfo is an alias for updates.UpdateInfo.
type UpdateInfo = updates.UpdateInfo

// GitHubClient is an alias for updates.GitHubClient.
type GitHubClient = updates.GitHubClient

// NewUpdateService creates a new update service.
// Delegates to updates.NewUpdateService.
var NewUpdateService = updates.NewUpdateService

// NewUpdateScheduler creates a new update scheduler.
// Delegates to updates.NewUpdateScheduler.
var NewUpdateScheduler = updates.NewUpdateScheduler

// NewUpdateEngine creates a new update engine.
// Delegates to updates.NewUpdateEngine.
var NewUpdateEngine = updates.NewUpdateEngine

// NewUpdateJournal creates a new update journal.
// Delegates to updates.NewUpdateJournal.
var NewUpdateJournal = updates.NewUpdateJournal

// NewGitHubClient creates a new GitHub API client.
// Delegates to updates.NewGitHubClient.
var NewGitHubClient = updates.NewGitHubClient
