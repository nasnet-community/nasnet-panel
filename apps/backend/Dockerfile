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

# Stage 2: Download hev-socks5-tunnel binary (multi-arch)
FROM --platform=$BUILDPLATFORM alpine:3.21 AS hevdownloader
ARG TARGETOS TARGETARCH TARGETVARIANT
RUN apk add --no-cache curl

WORKDIR /tmp
# Download hev-socks5-tunnel binary from GitHub releases
# Version 2.7.3 (latest stable as of implementation)
RUN set -eux; \
    HEV_VERSION="2.7.3"; \
    case "${TARGETARCH}" in \
        amd64) HEV_ARCH="x86_64" ;; \
        arm64) HEV_ARCH="aarch64" ;; \
        arm) \
            case "${TARGETVARIANT}" in \
                v7) HEV_ARCH="armhf" ;; \
                *) echo "Unsupported ARM variant: ${TARGETVARIANT}"; exit 1 ;; \
            esac ;; \
        *) echo "Unsupported architecture: ${TARGETARCH}"; exit 1 ;; \
    esac; \
    DOWNLOAD_URL="https://github.com/heiher/hev-socks5-tunnel/releases/download/${HEV_VERSION}/hev-socks5-tunnel-linux-${HEV_ARCH}"; \
    echo "Downloading hev-socks5-tunnel from: ${DOWNLOAD_URL}"; \
    curl -L -f -o /tmp/hev-socks5-tunnel "${DOWNLOAD_URL}"; \
    chmod +x /tmp/hev-socks5-tunnel; \
    /tmp/hev-socks5-tunnel -v || true

# Stage 3: Build Go backend (embed dist)
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS gobuilder
ARG TARGETOS TARGETARCH TARGETVARIANT
RUN apk add --no-cache ca-certificates upx
WORKDIR /workspace

# Copy ent module (dependency) and download its deps
COPY libs/data/ent/go.mod libs/data/ent/go.sum ./libs/data/ent/
RUN cd libs/data/ent && go mod download

# Copy backend module (has replace directive pointing to ../../libs/data/ent)
COPY apps/backend/go.mod apps/backend/go.sum ./apps/backend/
WORKDIR /workspace/apps/backend
RUN go mod download

# Copy source files
COPY libs/data/ent/ /workspace/libs/data/ent/
COPY apps/backend/ ./

# Copy built frontend into cmd/nnc/dist/ (so //go:embed dist/** works from cmd/nnc/)
COPY --from=frontend /workspace/dist/apps/connect ./cmd/nnc/dist

# Build static binary from cmd/nnc/ entry point; compress with upx if available
RUN set -eux; \
    if [ "$TARGETARCH" = "arm" ] && [ -n "$TARGETVARIANT" ]; then export GOARM=${TARGETVARIANT#v}; fi; \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build \
      -a -ldflags="-w -s -extldflags '-static'" -tags=netgo -trimpath \
      -o app ./cmd/nnc/; \
    upx --best --lzma app || true

# Stage 4: Production runtime (scratch - minimal)
FROM scratch AS production

# CA certs for HTTPS
COPY --from=gobuilder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Single static binary with embedded frontend
COPY --from=gobuilder /workspace/apps/backend/app /app

# Copy hev-socks5-tunnel binary for SOCKS-to-TUN gateway (NAS-8.14)
COPY --from=hevdownloader /tmp/hev-socks5-tunnel /app/hev-socks5-tunnel

ENV PORT=80
ENV GOMAXPROCS=1
ENV GO_ENV=production

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD ["/app","-healthcheck"]

ENTRYPOINT ["/app"]

# Stage 5: Debug runtime (Alpine - includes shell for troubleshooting)
FROM alpine:3.21 AS debug

# Install debugging tools
RUN apk add --no-cache ca-certificates curl

# Copy binary
COPY --from=gobuilder /workspace/apps/backend/app /app

# Copy hev-socks5-tunnel binary for SOCKS-to-TUN gateway (NAS-8.14)
COPY --from=hevdownloader /tmp/hev-socks5-tunnel /app/hev-socks5-tunnel

ENV PORT=80
ENV GOMAXPROCS=1
ENV GO_ENV=production

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD ["/app","-healthcheck"]

ENTRYPOINT ["/app"]






