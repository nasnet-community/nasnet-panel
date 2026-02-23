# NasNetConnect DevContainer
# Pre-built image for consistent development environment
# Target: <60 second startup with pre-built image (AC-1)
#
# Tools included:
# - Node.js 20 LTS
# - Go 1.24+
# - Docker CLI (Docker-in-Docker via feature)
# - air (Go hot-reload)
# - UPX (binary compression for Docker builds)
# - golangci-lint

FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

LABEL org.opencontainers.image.source="https://github.com/stargazer5361/nasnet"
LABEL org.opencontainers.image.description="NasNetConnect development container"
LABEL org.opencontainers.image.licenses="MIT"

# Avoid prompts during package installation
ARG DEBIAN_FRONTEND=noninteractive

# Set shell for better error handling
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Essential build tools
    build-essential \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    # For Go CGO builds
    gcc \
    g++ \
    # For UPX compression
    upx \
    # Utilities
    jq \
    tree \
    htop \
    iputils-ping \
    dnsutils \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 LTS
ARG NODE_VERSION=20
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g npm@latest

# if you are in iran use proxies
#ENV HTTP_PROXY=socks5://127.0.0.1:1080
#ENV HTTPS_PROXY=socks5://127.0.0.1:1080
#ENV NO_PROXY=localhost,127.0.0.1

# Install Go 1.24
ARG GO_VERSION=1.24.3
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" | tar -C /usr/local -xzf - \
    && ln -s /usr/local/go/bin/go /usr/local/bin/go \
    && ln -s /usr/local/go/bin/gofmt /usr/local/bin/gofmt

# Set Go environment variables
ENV GOPATH=/go
ENV GOBIN=/go/bin
ENV PATH="${PATH}:/usr/local/go/bin:${GOBIN}"

# Create Go directories
RUN mkdir -p /go/bin /go/pkg /go/src

# Install Go tools
RUN go install github.com/air-verse/air@latest \
    && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest \
    && go install golang.org/x/tools/gopls@latest \
    && go install github.com/go-delve/delve/cmd/dlv@latest

# Install global npm packages
RUN npm install -g \
    typescript \
    @graphql-codegen/cli \
    prettier \
    && npm cache clean --force

# Set up vscode user permissions
RUN mkdir -p /home/vscode/.npm-global \
    && chown -R vscode:vscode /home/vscode \
    && chown -R vscode:vscode /go

# Ensure workspace directories exist and are writable
RUN mkdir -p /workspaces/nasnet-panel/node_modules \
    && chown -R vscode:vscode /workspaces
    
# Configure npm global for vscode user
USER vscode
ENV NPM_CONFIG_PREFIX=/home/vscode/.npm-global
ENV PATH="${PATH}:/home/vscode/.npm-global/bin"

# Set working directory
WORKDIR /workspaces/nasnet

# Metadata for tracking image version
ARG BUILD_DATE
ARG GIT_SHA
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD node --version && go version || exit 1

# Default command
CMD ["sleep", "infinity"]
