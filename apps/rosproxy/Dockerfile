# Stage 1: Build frontend (Nx)
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend
WORKDIR /workspace

# Root workspace files for Nx build context
COPY package*.json nx.json tsconfig.base.json ./
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY shared/ ./shared/

RUN npm ci --no-audit --no-fund --legacy-peer-deps
RUN npx nx build connect

# Stage 2: Build Go backend (embed dist)
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS gobuilder
ARG TARGETOS TARGETARCH TARGETVARIANT
RUN apk add --no-cache ca-certificates upx
WORKDIR /workspace/apps/rosproxy

# Go modules
COPY apps/rosproxy/go.mod apps/rosproxy/go.sum ./
RUN go mod download

# Backend sources
COPY apps/rosproxy/*.go ./

# Copy built frontend (so //go:embed dist/** works)
COPY --from=frontend /workspace/dist/apps/connect ./dist

# Build static binary for target platform; compress with upx if available
# Include all production Go files (excluding test files and main.dev.go)
RUN set -eux; \
    if [ "$TARGETARCH" = "arm" ] && [ -n "$TARGETVARIANT" ]; then export GOARM=${TARGETVARIANT#v}; fi; \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build \
      -a -ldflags="-w -s -extldflags '-static'" -tags=netgo -trimpath \
      -o app main.prod.go router_proxy.go scanner.go server_shared.go \
      batch_handlers.go batch_executor.go cli_parser.go ros_client.go \
      ssh_client.go telnet_client.go; \
    upx --best --lzma app || true

# Stage 3: Minimal runtime image
FROM scratch

# CA certs for HTTPS
COPY --from=gobuilder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Single static binary with embedded frontend
COPY --from=gobuilder /workspace/apps/rosproxy/app /app

ENV PORT=80
ENV GOMAXPROCS=1
ENV GO_ENV=production

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD ["/app","-healthcheck"]

ENTRYPOINT ["/app"]






