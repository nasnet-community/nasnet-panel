//go:build test

package main

import (
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
)

// TestSSHClientSuite runs the Ginkgo BDD test suite
func TestSSHClientSuite(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "SSH Client Suite")
}

var _ = Describe("SSH Client Pool", func() {
	var pool *SSHClientPool

	BeforeEach(func() {
		pool = NewSSHClientPool()
	})

	Context("when created", func() {
		It("should not be nil", func() {
			Expect(pool).NotTo(BeNil())
		})

		It("should have an initialized clients map", func() {
			Expect(pool.clients).NotTo(BeNil())
		})

		It("should start with an empty clients map", func() {
			Expect(pool.clients).To(BeEmpty())
		})
	})

	Context("when CloseAll is called on empty pool", func() {
		It("should not panic", func() {
			Expect(func() {
				pool.CloseAll()
			}).NotTo(Panic())
		})

		It("should keep clients map empty", func() {
			pool.CloseAll()
			Expect(pool.clients).To(BeEmpty())
		})
	})
})

var _ = Describe("Telnet Client Pool", func() {
	var pool *TelnetClientPool

	BeforeEach(func() {
		pool = NewTelnetClientPool()
	})

	Context("when created", func() {
		It("should not be nil", func() {
			Expect(pool).NotTo(BeNil())
		})

		It("should have an initialized clients map", func() {
			Expect(pool.clients).NotTo(BeNil())
		})
	})

	Context("when CloseAll is called on empty pool", func() {
		It("should not panic", func() {
			Expect(func() {
				pool.CloseAll()
			}).NotTo(Panic())
		})
	})
})

var _ = Describe("RouterOS Prompt Detection", func() {
	DescribeTable("isRouterOSPrompt",
		func(line string, expected bool) {
			Expect(isRouterOSPrompt(line)).To(Equal(expected))
		},
		Entry("standard admin prompt", "[admin@MikroTik] >", true),
		Entry("prompt with path", "[admin@Router] /interface>", true),
		Entry("simple prompt", ">", true),
		Entry("prompt with submenu", "[admin@MikroTik] /ip/address>", true),
		Entry("regular output text", "some output text", false),
		Entry("empty string", "", false),
		Entry("prompt with extra bracket", "[admin@MikroTik] ] >", true),
	)
})

var _ = Describe("String Utilities", func() {
	Describe("truncateForLog", func() {
		DescribeTable("truncation behavior",
			func(input string, maxLen int, expected string) {
				Expect(truncateForLog(input, maxLen)).To(Equal(expected))
			},
			Entry("short string", "short", 10, "short"),
			Entry("exact length", "exactly10!", 10, "exactly10!"),
			Entry("long string", "this is a longer string", 10, "this is..."),
			Entry("empty string", "", 10, ""),
		)
	})
})

var _ = Describe("Protocol Constants", func() {
	It("should define API protocol correctly", func() {
		Expect(ProtocolAPI).To(Equal("api"))
	})

	It("should define SSH protocol correctly", func() {
		Expect(ProtocolSSH).To(Equal("ssh"))
	})

	It("should define Telnet protocol correctly", func() {
		Expect(ProtocolTelnet).To(Equal("telnet"))
	})
})
