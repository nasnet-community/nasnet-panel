package firewall

import (
	"context"
	"errors"
	"testing"

	"backend/graph/model"

	"backend/internal/router"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stretchr/testify/assert"
)

// ============================================
// TEST FIXTURES
// ============================================
// Note: MockRouterPort is defined in address_list_service_test.go

func createMockNATData(id, chain, action string) map[string]string {
	return map[string]string{
		".id":      id,
		"chain":    chain,
		"action":   action,
		"disabled": "false",
		"bytes":    "1024",
		"packets":  "10",
	}
}

func createMockPortForwardData(ulid, name string) map[string]string {
	comment := "portforward:" + ulid
	if name != "" {
		comment += " " + name
	}

	return map[string]string{
		".id":          "*1",
		"chain":        "dstnat",
		"action":       "dst-nat",
		"protocol":     "tcp",
		"dst-port":     "80",
		"to-addresses": "192.168.1.100",
		"to-ports":     "8080",
		"comment":      comment,
		"disabled":     "false",
	}
}

// ============================================
// GET NAT RULES TESTS
// ============================================

func TestGetNatRules(t *testing.T) {
	t.Run("should query all NAT rules", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "print" {
					return &router.CommandResult{
						Success: true,
						Data: []map[string]string{
							createMockNATData("*1", "srcnat", "masquerade"),
							createMockNATData("*2", "dstnat", "dst-nat"),
						},
					}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		rules, err := service.GetNatRules(context.Background(), nil)

		assert.NoError(t, err)
		assert.Len(t, rules, 2)
		assert.Equal(t, "*1", rules[0].ID)
		assert.Equal(t, model.NatChainSrcnat, rules[0].Chain)
		assert.Equal(t, model.NatActionMasquerade, rules[0].Action)
	})

	t.Run("should filter by chain", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Args["chain"] == "dstnat" {
					return &router.CommandResult{
						Success: true,
						Data: []map[string]string{
							createMockNATData("*1", "dstnat", "dst-nat"),
						},
					}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		chain := model.NatChainDstnat
		rules, err := service.GetNatRules(context.Background(), &chain)

		assert.NoError(t, err)
		assert.Len(t, rules, 1)
		assert.Equal(t, model.NatChainDstnat, rules[0].Chain)
	})

	t.Run("should handle empty result", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				return &router.CommandResult{
					Success: true,
					Data:    []map[string]string{},
				}, nil
			},
		}
		service := NewNatService(mockPort, nil)

		rules, err := service.GetNatRules(context.Background(), nil)

		assert.NoError(t, err)
		assert.Len(t, rules, 0)
	})

	t.Run("should handle execution error", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				return nil, assert.AnError
			},
		}
		service := NewNatService(mockPort, nil)

		rules, err := service.GetNatRules(context.Background(), nil)

		assert.Error(t, err)
		assert.Nil(t, rules)
	})
}

// ============================================
// GET PORT FORWARDS TESTS
// ============================================

func TestGetPortForwards(t *testing.T) {
	t.Run("should extract port forwards from NAT rules", func(t *testing.T) {
		ulid1 := "01ARZ3NDEKTSV4RRFFQ69G5FAV"
		ulid2 := "01ARZ3NDEKTSV4RRFFQ69G5FAW"

		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Args["chain"] == "dstnat" {
					return &router.CommandResult{
						Success: true,
						Data: []map[string]string{
							createMockPortForwardData(ulid1, "Web Server"),
							createMockNATData("*2", "dstnat", "masquerade"), // Not a port forward
							createMockPortForwardData(ulid2, ""),
						},
					}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		portForwards, err := service.GetPortForwards(context.Background())

		assert.NoError(t, err)
		assert.Len(t, portForwards, 2)
		assert.Equal(t, ulid1, portForwards[0].ID)
		assert.Equal(t, "Web Server", *portForwards[0].Name)
		assert.Equal(t, 80, portForwards[0].ExternalPort)
		assert.Equal(t, "192.168.1.100", portForwards[0].InternalIP)
		assert.Equal(t, 8080, portForwards[0].InternalPort)
	})

	t.Run("should filter out non-portforward rules", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				return &router.CommandResult{
					Success: true,
					Data: []map[string]string{
						createMockNATData("*1", "dstnat", "dst-nat"),  // Regular NAT rule
						createMockNATData("*2", "dstnat", "redirect"), // Redirect rule
					},
				}, nil
			},
		}
		service := NewNatService(mockPort, nil)

		portForwards, err := service.GetPortForwards(context.Background())

		assert.NoError(t, err)
		assert.Len(t, portForwards, 0) // No port forwards
	})
}

// ============================================
// CREATE PORT FORWARD TESTS
// ============================================

func TestCreatePortForward(t *testing.T) {
	t.Run("should create both NAT and filter rules", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "add" {
					return &router.CommandResult{Success: true, ID: "*1"}, nil
				}
				if cmd.Path == "/ip/firewall/filter" && cmd.Action == "add" {
					return &router.CommandResult{Success: true, ID: "*2"}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		input := model.PortForwardInput{
			Protocol:     model.TransportProtocolTCP,
			ExternalPort: 80,
			InternalIP:   "192.168.1.100",
		}

		portForward, err := service.CreatePortForward(context.Background(), input)

		assert.NoError(t, err)
		assert.NotNil(t, portForward)
		assert.Equal(t, model.TransportProtocolTCP, portForward.Protocol)
		assert.Equal(t, 80, portForward.ExternalPort)
		assert.Equal(t, "192.168.1.100", portForward.InternalIP)
		assert.Equal(t, 80, portForward.InternalPort) // Defaults to external port
		assert.Equal(t, "*1", portForward.NatRuleID)
		assert.Equal(t, "*2", *portForward.FilterRuleID)
	})

	t.Run("should use custom internal port", func(t *testing.T) {
		internalPort := 8080
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Args["to-ports"] == "8080" {
					return &router.CommandResult{Success: true, ID: "*1"}, nil
				}
				if cmd.Path == "/ip/firewall/filter" && cmd.Args["dst-port"] == "8080" {
					return &router.CommandResult{Success: true, ID: "*2"}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		input := model.PortForwardInput{
			Protocol:     model.TransportProtocolTCP,
			ExternalPort: 80,
			InternalIP:   "192.168.1.100",
			InternalPort: graphql.OmittableOf(&internalPort),
		}

		portForward, err := service.CreatePortForward(context.Background(), input)

		assert.NoError(t, err)
		assert.Equal(t, 8080, portForward.InternalPort)
	})

	t.Run("should rollback NAT rule if filter creation fails", func(t *testing.T) {
		natRuleCreated := false
		natRuleDeleted := false

		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "add" {
					natRuleCreated = true
					return &router.CommandResult{Success: true, ID: "*1"}, nil
				}
				if cmd.Path == "/ip/firewall/filter" && cmd.Action == "add" {
					return &router.CommandResult{Success: false}, errors.New("filter error")
				}
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "remove" && cmd.ID == "*1" {
					natRuleDeleted = true
					return &router.CommandResult{Success: true}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		input := model.PortForwardInput{
			Protocol:     model.TransportProtocolTCP,
			ExternalPort: 80,
			InternalIP:   "192.168.1.100",
		}

		portForward, err := service.CreatePortForward(context.Background(), input)

		assert.Error(t, err)
		assert.Nil(t, portForward)
		assert.Contains(t, err.Error(), "filter rule")
		assert.True(t, natRuleCreated, "NAT rule should have been created")
		assert.True(t, natRuleDeleted, "NAT rule should have been rolled back")
	})
}

// ============================================
// DELETE PORT FORWARD TESTS
// ============================================

func TestDeletePortForward(t *testing.T) {
	t.Run("should delete both NAT and filter rules", func(t *testing.T) {
		ulid := "01ARZ3NDEKTSV4RRFFQ69G5FAV"
		comment := "portforward:" + ulid + " Web Server"

		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "print" {
					return &router.CommandResult{
						Success: true,
						Data: []map[string]string{
							{".id": "*1", "comment": comment},
						},
					}, nil
				}
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "remove" && cmd.ID == "*1" {
					return &router.CommandResult{Success: true}, nil
				}
				if cmd.Path == "/ip/firewall/filter" && cmd.Action == "print" {
					return &router.CommandResult{
						Success: true,
						Data: []map[string]string{
							{".id": "*2", "comment": comment},
						},
					}, nil
				}
				if cmd.Path == "/ip/firewall/filter" && cmd.Action == "remove" && cmd.ID == "*2" {
					return &router.CommandResult{Success: true}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		err := service.DeletePortForward(context.Background(), ulid)

		assert.NoError(t, err)
	})
}

// ============================================
// CREATE MASQUERADE RULE TESTS
// ============================================

func TestCreateMasqueradeRule(t *testing.T) {
	t.Run("should create masquerade rule", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "add" &&
					cmd.Args["action"] == "masquerade" && cmd.Args["out-interface"] == "ether1" {
					return &router.CommandResult{Success: true, ID: "*1"}, nil
				}
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "print" {
					return &router.CommandResult{
						Success: true,
						Data: []map[string]string{
							{
								".id":           "*1",
								"chain":         "srcnat",
								"action":        "masquerade",
								"out-interface": "ether1",
								"disabled":      "false",
							},
						},
					}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		rule, err := service.CreateMasqueradeRule(context.Background(), "ether1", nil, nil)

		assert.NoError(t, err)
		assert.NotNil(t, rule)
		assert.Equal(t, model.NatChainSrcnat, rule.Chain)
		assert.Equal(t, model.NatActionMasquerade, rule.Action)
	})
}

// ============================================
// DELETE NAT RULE TESTS
// ============================================

func TestDeleteNatRule(t *testing.T) {
	t.Run("should delete NAT rule by ID", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				if cmd.Path == "/ip/firewall/nat" && cmd.Action == "remove" && cmd.ID == "*1" {
					return &router.CommandResult{Success: true}, nil
				}
				return nil, nil
			},
		}
		service := NewNatService(mockPort, nil)

		err := service.DeleteNatRule(context.Background(), "*1")

		assert.NoError(t, err)
	})

	t.Run("should return error if deletion fails", func(t *testing.T) {
		mockPort := &MockRouterPort{
			executeFunc: func(_ context.Context, cmd router.Command) (*router.CommandResult, error) {
				return &router.CommandResult{Success: false}, errors.New("not found")
			},
		}
		service := NewNatService(mockPort, nil)

		err := service.DeleteNatRule(context.Background(), "*1")

		assert.Error(t, err)
	})
}
