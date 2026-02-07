// Package troubleshoot provides internet connectivity troubleshooting services.
// Story: NAS-5.11 - Implement No Internet Troubleshooting Wizard
package troubleshoot

import (
	"time"
)

// StepType represents the type of diagnostic step.
type StepType string

const (
	StepTypeWAN      StepType = "WAN"
	StepTypeGateway  StepType = "GATEWAY"
	StepTypeInternet StepType = "INTERNET"
	StepTypeDNS      StepType = "DNS"
	StepTypeNAT      StepType = "NAT"
)

// StepStatus represents the status of a diagnostic step.
type StepStatus string

const (
	StepStatusPending StepStatus = "PENDING"
	StepStatusRunning StepStatus = "RUNNING"
	StepStatusPassed  StepStatus = "PASSED"
	StepStatusFailed  StepStatus = "FAILED"
	StepStatusSkipped StepStatus = "SKIPPED"
)

// FixConfidence represents the confidence level for a fix suggestion.
type FixConfidence string

const (
	FixConfidenceHigh   FixConfidence = "HIGH"
	FixConfidenceMedium FixConfidence = "MEDIUM"
	FixConfidenceLow    FixConfidence = "LOW"
)

// FixApplicationStatus represents the status of fix application.
type FixApplicationStatus string

const (
	FixStatusAvailable     FixApplicationStatus = "AVAILABLE"
	FixStatusApplying      FixApplicationStatus = "APPLYING"
	FixStatusApplied       FixApplicationStatus = "APPLIED"
	FixStatusFailed        FixApplicationStatus = "FAILED"
	FixStatusIssuePersists FixApplicationStatus = "ISSUE_PERSISTS"
)

// SessionStatus represents the overall status of a troubleshooting session.
type SessionStatus string

const (
	SessionStatusIdle                SessionStatus = "IDLE"
	SessionStatusInitializing        SessionStatus = "INITIALIZING"
	SessionStatusRunning             SessionStatus = "RUNNING"
	SessionStatusAwaitingFixDecision SessionStatus = "AWAITING_FIX_DECISION"
	SessionStatusApplyingFix         SessionStatus = "APPLYING_FIX"
	SessionStatusVerifyingFix        SessionStatus = "VERIFYING_FIX"
	SessionStatusCompleted           SessionStatus = "COMPLETED"
	SessionStatusCancelled           SessionStatus = "CANCELLED"
)

// StepResult represents the result of a diagnostic step execution.
type StepResult struct {
	Success         bool
	Message         string
	Details         string
	ExecutionTimeMs int
	IssueCode       string
	Target          string
}

// FixSuggestion represents a suggested fix for a failed diagnostic step.
type FixSuggestion struct {
	IssueCode           string
	Title               string
	Explanation         string
	Confidence          FixConfidence
	RequiresConfirmation bool
	IsManualFix         bool
	ManualSteps         []string
	Command             string
	RollbackCommand     string
}

// ISPInfo contains ISP contact information.
type ISPInfo struct {
	Name  string
	Phone string
	URL   string
}

// Step represents a single diagnostic step.
type Step struct {
	ID          StepType
	Name        string
	Description string
	Status      StepStatus
	Result      *StepResult
	Fix         *FixSuggestion
	StartedAt   *time.Time
	CompletedAt *time.Time
}

// Session represents a troubleshooting session.
type Session struct {
	ID               string
	RouterID         string
	Steps            []*Step
	CurrentStepIndex int
	Status           SessionStatus
	WanInterface     string
	Gateway          string
	ISPInfo          *ISPInfo
	AppliedFixes     []string
	StartedAt        time.Time
	CompletedAt      *time.Time
}

// NetworkConfig contains detected network configuration.
type NetworkConfig struct {
	WanInterface string
	Gateway      string
	ISPInfo      *ISPInfo
}
