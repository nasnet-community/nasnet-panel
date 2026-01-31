package compatibility

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetUpgradeRecommendation(t *testing.T) {
	svc := NewService().(*service)

	t.Run("returns nil for supported feature", func(t *testing.T) {
		version := Version{Major: 7, Minor: 13, Patch: 2}
		rec := svc.GetUpgradeRecommendation("rest_api", version, false)
		assert.Nil(t, rec, "Should return nil for supported feature")
	})

	t.Run("returns recommendation for REST API on 6.49", func(t *testing.T) {
		version := Version{Major: 6, Minor: 49, Patch: 10}
		rec := svc.GetUpgradeRecommendation("rest_api", version, false)

		require.NotNil(t, rec)
		assert.Equal(t, "rest_api", rec.FeatureID)
		assert.Equal(t, "REST API", rec.FeatureName)
		assert.Equal(t, "6.49.10", rec.CurrentVersion)
		assert.Equal(t, "7.1", rec.RequiredVersion)
		assert.True(t, rec.IsMajorUpgrade)
		assert.Equal(t, PriorityHigh, rec.Priority) // REST API is high priority
		assert.NotEmpty(t, rec.Steps)
		assert.True(t, rec.Impact.RequiresReboot)
		assert.True(t, rec.Impact.BackupRecommended)
		assert.NotEmpty(t, rec.Warnings)
	})

	t.Run("returns recommendation for Container on 7.3", func(t *testing.T) {
		version := Version{Major: 7, Minor: 3, Patch: 0}
		rec := svc.GetUpgradeRecommendation("container", version, false)

		require.NotNil(t, rec)
		assert.Equal(t, "container", rec.FeatureID)
		assert.False(t, rec.IsMajorUpgrade) // 7.3 to 7.4 is not major
		assert.Equal(t, PriorityMedium, rec.Priority)
	})

	t.Run("returns recommendation for WireGuard on 6.49", func(t *testing.T) {
		version := Version{Major: 6, Minor: 49, Patch: 10}
		rec := svc.GetUpgradeRecommendation("wireguard", version, false)

		require.NotNil(t, rec)
		assert.Equal(t, "wireguard", rec.FeatureID)
		assert.True(t, rec.IsMajorUpgrade)
		assert.Contains(t, rec.Warnings, "WireGuard is only available in RouterOS 7.x")
	})

	t.Run("returns nil for unknown feature", func(t *testing.T) {
		version := Version{Major: 6, Minor: 49, Patch: 10}
		rec := svc.GetUpgradeRecommendation("unknown_feature", version, false)
		assert.Nil(t, rec)
	})

	t.Run("CHR uses CHR-specific version requirements", func(t *testing.T) {
		version := Version{Major: 7, Minor: 5, Patch: 0}
		rec := svc.GetUpgradeRecommendation("container", version, true) // CHR

		require.NotNil(t, rec)
		assert.Equal(t, "7.6", rec.RequiredVersion) // CHR requires 7.6+
	})
}

func TestGetAllUpgradeRecommendations(t *testing.T) {
	svc := NewService().(*service)

	t.Run("returns multiple recommendations for 6.49", func(t *testing.T) {
		version := Version{Major: 6, Minor: 49, Patch: 10}
		recs := svc.GetAllUpgradeRecommendations(version, false)

		require.NotEmpty(t, recs)

		// Should have recommendations for features not supported in 6.49
		featureIDs := make(map[string]bool)
		for _, rec := range recs {
			featureIDs[rec.FeatureID] = true
		}

		assert.True(t, featureIDs["rest_api"], "Should recommend REST API upgrade")
		assert.True(t, featureIDs["container"], "Should recommend Container upgrade")
		assert.True(t, featureIDs["wireguard"], "Should recommend WireGuard upgrade")
	})

	t.Run("returns fewer recommendations for 7.13", func(t *testing.T) {
		version := Version{Major: 7, Minor: 13, Patch: 2}
		recs := svc.GetAllUpgradeRecommendations(version, false)

		// 7.13 supports most features, so should have fewer recommendations
		// than 6.49
		version6 := Version{Major: 6, Minor: 49, Patch: 10}
		recs6 := svc.GetAllUpgradeRecommendations(version6, false)

		assert.Less(t, len(recs), len(recs6), "7.13 should have fewer recommendations than 6.49")
	})

	t.Run("recommendations are sorted by priority", func(t *testing.T) {
		version := Version{Major: 6, Minor: 40, Patch: 0}
		recs := svc.GetAllUpgradeRecommendations(version, false)

		if len(recs) < 2 {
			t.Skip("Need at least 2 recommendations to test sorting")
		}

		// Verify priority ordering
		for i := 0; i < len(recs)-1; i++ {
			assert.LessOrEqual(t,
				priorityValue(recs[i].Priority),
				priorityValue(recs[i+1].Priority),
				"Recommendations should be sorted by priority")
		}
	})
}

func TestDeterminePriority(t *testing.T) {
	tests := []struct {
		featureID string
		isMajor   bool
		expected  UpgradePriority
	}{
		{"api_ssl", false, PriorityCritical},
		{"acme", false, PriorityCritical},
		{"rest_api", false, PriorityHigh},
		{"wireguard", false, PriorityMedium},
		{"container", false, PriorityMedium},
		{"zerotier", false, PriorityMedium},
		{"binary_api", false, PriorityLow},
		{"unknown_feature", false, PriorityLow},
	}

	for _, tt := range tests {
		t.Run(tt.featureID, func(t *testing.T) {
			result := determinePriority(tt.featureID, tt.isMajor)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestBuildUpgradeSteps(t *testing.T) {
	fc := &FeatureCompatibility{
		ID:               "container",
		Name:             "Container Support",
		RequiredPackages: []string{"container"},
	}

	t.Run("builds steps for minor upgrade", func(t *testing.T) {
		current := Version{Major: 7, Minor: 3, Patch: 0}
		required := Version{Major: 7, Minor: 4, Patch: 0}
		steps := buildUpgradeSteps(current, required, fc, false)

		require.NotEmpty(t, steps)

		// First step should be backup
		assert.Equal(t, 1, steps[0].Step)
		assert.Contains(t, steps[0].Title, "Backup")

		// Should have package install step for container
		hasPackageStep := false
		for _, step := range steps {
			if step.Title == "Install Required Packages" {
				hasPackageStep = true
				assert.Contains(t, step.Description, "container")
			}
		}
		assert.True(t, hasPackageStep)

		// Should have container enable step
		hasEnableStep := false
		for _, step := range steps {
			if step.Title == "Enable Container Feature" {
				hasEnableStep = true
			}
		}
		assert.True(t, hasEnableStep)
	})

	t.Run("builds steps for major upgrade", func(t *testing.T) {
		current := Version{Major: 6, Minor: 49, Patch: 10}
		required := Version{Major: 7, Minor: 4, Patch: 0}
		steps := buildUpgradeSteps(current, required, fc, true)

		require.NotEmpty(t, steps)

		// Should have breaking changes review step for major upgrade
		hasReviewStep := false
		for _, step := range steps {
			if step.Title == "Review Breaking Changes" {
				hasReviewStep = true
			}
		}
		assert.True(t, hasReviewStep)
	})
}

func TestBuildImpact(t *testing.T) {
	t.Run("minor upgrade impact", func(t *testing.T) {
		current := Version{Major: 7, Minor: 3, Patch: 0}
		required := Version{Major: 7, Minor: 4, Patch: 0}
		impact := buildImpact(current, required, false)

		assert.True(t, impact.RequiresReboot)
		assert.True(t, impact.BackupRecommended)
		assert.Equal(t, "2-5 minutes", impact.EstimatedDowntime)
		assert.Empty(t, impact.BreakingChanges)
	})

	t.Run("major upgrade impact", func(t *testing.T) {
		current := Version{Major: 6, Minor: 49, Patch: 10}
		required := Version{Major: 7, Minor: 4, Patch: 0}
		impact := buildImpact(current, required, true)

		assert.True(t, impact.RequiresReboot)
		assert.True(t, impact.BackupRecommended)
		assert.Contains(t, impact.EstimatedDowntime, "major version")
		assert.NotEmpty(t, impact.BreakingChanges)
	})
}

func TestBuildWarnings(t *testing.T) {
	t.Run("major upgrade warnings", func(t *testing.T) {
		current := Version{Major: 6, Minor: 49, Patch: 10}
		required := Version{Major: 7, Minor: 4, Patch: 0}
		fc := &FeatureCompatibility{ID: "container", Name: "Container"}

		warnings := buildWarnings(current, required, fc, true)

		assert.NotEmpty(t, warnings)
		// Should have major upgrade warnings
		hasRollbackWarning := false
		for _, w := range warnings {
			if w == "Major version upgrades cannot be easily rolled back" {
				hasRollbackWarning = true
			}
		}
		assert.True(t, hasRollbackWarning)
	})

	t.Run("feature-specific warnings", func(t *testing.T) {
		current := Version{Major: 7, Minor: 3, Patch: 0}
		required := Version{Major: 7, Minor: 4, Patch: 0}

		// Container warnings
		fc := &FeatureCompatibility{ID: "container", Name: "Container"}
		warnings := buildWarnings(current, required, fc, false)
		hasArchWarning := false
		for _, w := range warnings {
			if w == "Container feature requires ARM64 or x86 architecture" {
				hasArchWarning = true
			}
		}
		assert.True(t, hasArchWarning)

		// WireGuard warnings
		fc = &FeatureCompatibility{ID: "wireguard", Name: "WireGuard"}
		warnings = buildWarnings(current, required, fc, false)
		hasV7Warning := false
		for _, w := range warnings {
			if w == "WireGuard is only available in RouterOS 7.x" {
				hasV7Warning = true
			}
		}
		assert.True(t, hasV7Warning)
	})
}

func TestPriorityValue(t *testing.T) {
	assert.Equal(t, 0, priorityValue(PriorityCritical))
	assert.Equal(t, 1, priorityValue(PriorityHigh))
	assert.Equal(t, 2, priorityValue(PriorityMedium))
	assert.Equal(t, 3, priorityValue(PriorityLow))
	assert.Equal(t, 99, priorityValue("unknown"))
}
