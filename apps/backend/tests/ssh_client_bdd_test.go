//go:build test

package main

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"backend/internal/router/adapters/mikrotik"
)

// TestSSHClientSuite runs the Ginkgo BDD test suite
func TestSSHClientSuite(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "SSH Client Suite")
}

var _ = Describe("SSH Client Pool", func() {
	var pool *mikrotik.SSHClientPool

	BeforeEach(func() {
		pool = mikrotik.NewSSHClientPool()
	})

	AfterEach(func() {
		if pool != nil {
			pool.CloseAll()
		}
	})

	Context("when created", func() {
		It("should not be nil", func() {
			Expect(pool).NotTo(BeNil())
		})

		It("should handle CloseAll without panic", func() {
			Expect(func() {
				pool.CloseAll()
			}).NotTo(Panic())
		})
	})

	Context("when multiple CloseAll calls are made", func() {
		It("should be idempotent and safe", func() {
			Expect(func() {
				pool.CloseAll()
				pool.CloseAll()
			}).NotTo(Panic())
		})
	})
})

var _ = Describe("Telnet Client Pool", func() {
	var pool *mikrotik.TelnetClientPool

	BeforeEach(func() {
		pool = mikrotik.NewTelnetClientPool()
	})

	AfterEach(func() {
		if pool != nil {
			pool.CloseAll()
		}
	})

	Context("when created", func() {
		It("should not be nil", func() {
			Expect(pool).NotTo(BeNil())
		})
	})

	Context("when CloseAll is called on empty pool", func() {
		It("should not panic", func() {
			Expect(func() {
				pool.CloseAll()
			}).NotTo(Panic())
		})
	})

	Context("lifecycle management", func() {
		It("should be safe to call CloseAll multiple times", func() {
			Expect(func() {
				pool.CloseAll()
				pool.CloseAll()
				pool.CloseAll()
			}).NotTo(Panic())
		})
	})
})
