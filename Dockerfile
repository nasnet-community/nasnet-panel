# syntax=docker/dockerfile:1.25

# Build the React frontend (Webpack)
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend
WORKDIR /workspace
COPY package*.json .npmrc ./
COPY frontend/package*.json ./frontend/
RUN npm ci --no-audit --no-fund
COPY frontend/ ./frontend/
# on empty BACKEND_URL, SPA uses relative URLs, hitting the same origin/port the container is exposed on
ENV BACKEND_URL=""
RUN npm run build

# Build the Go backend with the embedded SPA
FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS gobuilder
ARG TARGETOS TARGETARCH TARGETVARIANT
# Overridden by the release/snapshot workflows; the default only applies to
# ad-hoc local builds that pass no --build-arg.
ARG APP_VERSION=v0.0.0-dev
RUN apk add --no-cache ca-certificates upx
WORKDIR /workspace/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend /workspace/frontend/dist ./internal/web/dist
RUN set -eux; \
    if [ "$TARGETARCH" = "arm" ] && [ -n "$TARGETVARIANT" ]; then export GOARM=${TARGETVARIANT#v}; fi; \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
      go build -trimpath \
      -ldflags="-w -s -extldflags '-static' -X nasnet-panel/internal/buildinfo.Version=${APP_VERSION}" \
      -tags=netgo,production \
      -o /out/app ./cmd/api; \
    upx --best --lzma /out/app

# Minimal runtime on busybox:musl that gives a ~1.4MB base + a shell for `docker exec`
FROM busybox:musl AS production
COPY --from=gobuilder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=gobuilder /out/app /app
ENV PORT=80 HTTPS_PORT=443 GO_ENV=production ENVIRONMENT=production GOMAXPROCS=1 SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/health
ENTRYPOINT ["/app"]
