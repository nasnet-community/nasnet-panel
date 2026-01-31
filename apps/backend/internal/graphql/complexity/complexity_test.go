package complexity

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// =============================================================================
// Constants Tests
// =============================================================================

func TestConstants(t *testing.T) {
	// Verify threshold values match AC4 requirements
	assert.Equal(t, 750, WarningThreshold, "Warning threshold should be 750 as per AC4")
	assert.Equal(t, 1000, MaxComplexity, "Max complexity should be 1000 as per AC4")
}

// =============================================================================
// Calculator Tests
// =============================================================================

func TestCalculator_DefaultCosts(t *testing.T) {
	c := NewCalculator()

	// Scalar field (no children)
	cost := c.GetFieldCost("Query", "version", 0, nil)
	assert.Equal(t, DefaultCosts.Scalar, cost)

	// Object field (has children)
	cost = c.GetFieldCost("Query", "router", 10, nil)
	assert.Equal(t, DefaultCosts.Object+10, cost)
}

func TestCalculator_ListMultiplier(t *testing.T) {
	c := NewCalculator()

	// List with first argument
	args := map[string]interface{}{"first": 10}
	cost := c.GetFieldCost("Query", "routers", 5, args)
	assert.Equal(t, DefaultCosts.List+(5*10), cost)

	// List with last argument
	args = map[string]interface{}{"last": 20}
	cost = c.GetFieldCost("Query", "routers", 5, args)
	assert.Equal(t, DefaultCosts.List+(5*20), cost)
}

func TestCalculator_ConnectionField(t *testing.T) {
	c := NewCalculator()

	// Connection field has higher base cost
	cost := c.GetFieldCost("Query", "routersConnection", 5, nil)
	assert.Equal(t, DefaultCosts.Connection+5, cost)
}

func TestCalculator_CustomFieldCost(t *testing.T) {
	c := NewCalculator()
	c.SetFieldCost("Query", "expensiveOperation", 100)

	// Custom cost should override defaults
	cost := c.GetFieldCost("Query", "expensiveOperation", 5, nil)
	assert.Equal(t, 105, cost) // 100 + childComplexity
}

// =============================================================================
// Complexity Calculation Tests
// =============================================================================

func TestCalculateComplexity_NoMultiplier(t *testing.T) {
	args := map[string]interface{}{}
	cost := CalculateComplexity(10, args)
	assert.Equal(t, 11, cost) // 1*10 + 1
}

func TestCalculateComplexity_WithFirstArg(t *testing.T) {
	args := map[string]interface{}{"first": 5}
	cost := CalculateComplexity(10, args)
	assert.Equal(t, 51, cost) // 5*10 + 1
}

func TestCalculateComplexity_WithLastArg(t *testing.T) {
	args := map[string]interface{}{"last": 3}
	cost := CalculateComplexity(10, args)
	assert.Equal(t, 31, cost) // 3*10 + 1
}

// =============================================================================
// OperationComplexity Tests
// =============================================================================

func TestOperationComplexity_NoWarning(t *testing.T) {
	oc := OperationComplexity{
		Complexity: 500,
		Limit:      MaxComplexity,
	}

	oc.Warning = oc.Complexity > WarningThreshold && oc.Complexity <= MaxComplexity
	oc.Exceeded = oc.Complexity > MaxComplexity

	assert.False(t, oc.Warning)
	assert.False(t, oc.Exceeded)
}

func TestOperationComplexity_Warning(t *testing.T) {
	oc := OperationComplexity{
		Complexity: 800,
		Limit:      MaxComplexity,
	}

	oc.Warning = oc.Complexity > WarningThreshold && oc.Complexity <= MaxComplexity
	oc.Exceeded = oc.Complexity > MaxComplexity

	assert.True(t, oc.Warning)
	assert.False(t, oc.Exceeded)
}

func TestOperationComplexity_Exceeded(t *testing.T) {
	oc := OperationComplexity{
		Complexity: 1100,
		Limit:      MaxComplexity,
	}

	oc.Warning = oc.Complexity > WarningThreshold && oc.Complexity <= MaxComplexity
	oc.Exceeded = oc.Complexity > MaxComplexity

	assert.False(t, oc.Warning) // Not warning, exceeded
	assert.True(t, oc.Exceeded)
}

func TestOperationComplexity_AtThreshold(t *testing.T) {
	// At warning threshold (751)
	oc1 := OperationComplexity{Complexity: 751}
	oc1.Warning = oc1.Complexity > WarningThreshold && oc1.Complexity <= MaxComplexity
	assert.True(t, oc1.Warning)

	// At max threshold (1000)
	oc2 := OperationComplexity{Complexity: 1000}
	oc2.Warning = oc2.Complexity > WarningThreshold && oc2.Complexity <= MaxComplexity
	oc2.Exceeded = oc2.Complexity > MaxComplexity
	assert.True(t, oc2.Warning)
	assert.False(t, oc2.Exceeded)

	// Just over max (1001)
	oc3 := OperationComplexity{Complexity: 1001}
	oc3.Exceeded = oc3.Complexity > MaxComplexity
	assert.True(t, oc3.Exceeded)
}

// =============================================================================
// isConnectionField Tests
// =============================================================================

func TestIsConnectionField(t *testing.T) {
	tests := []struct {
		name     string
		field    string
		expected bool
	}{
		{"connection field", "routersConnection", true},
		{"another connection", "interfacesConnection", true},
		{"regular field", "routers", false},
		{"similar but not connection", "connections", false},
		{"short name", "conn", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isConnectionField(tt.field)
			assert.Equal(t, tt.expected, result)
		})
	}
}
