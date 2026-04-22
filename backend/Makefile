.PHONY: fmt fmt-check vet lint lint-fix test build check

GOLANGCI_LINT ?= golangci-lint

fmt:
	$(GOLANGCI_LINT) fmt

fmt-check:
	$(GOLANGCI_LINT) fmt --diff

vet:
	go vet ./...

lint:
	$(GOLANGCI_LINT) run --timeout=5m

lint-fix:
	$(GOLANGCI_LINT) run --fix --timeout=5m

test:
	go test -vet=off ./...

build:
	go build ./...

check: fmt-check vet lint test build
