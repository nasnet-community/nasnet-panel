# syntax=docker/dockerfile:1.7

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
RUN apk add --no-cache ca-certificates upx
WORKDIR /workspace/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend /workspace/frontend/dist ./internal/web/dist
RUN set -eux; \
    if [ "$TARGETARCH" = "arm" ] && [ -n "$TARGETVARIANT" ]; then export GOARM=${TARGETVARIANT#v}; fi; \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
      go build -trimpath -ldflags="-w -s -extldflags '-static'" -tags=netgo \
      -o /out/app ./cmd/api; \
    upx --best --lzma /out/app

# Minimal runtime on busybox:musl that gives a ~1.4MB base + a shell for `docker exec`
FROM busybox:musl AS production
COPY --from=gobuilder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=gobuilder /out/app /app
ENV PORT=80 GO_ENV=production GOMAXPROCS=1 SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/health
ENTRYPOINT ["/app"]
