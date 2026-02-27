# NasNetConnect DevContainer
# Thin image — Go and Node provided by devcontainer features
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

LABEL org.opencontainers.image.source="https://github.com/stargazer5361/nasnet"
LABEL org.opencontainers.image.description="NasNetConnect development container"
LABEL org.opencontainers.image.licenses="MIT"

ARG DEBIAN_FRONTEND=noninteractive
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# System dependencies (rarely changes — excellent cache layer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl wget git ca-certificates gnupg \
    gcc g++ upx jq tree htop \
    iputils-ping dnsutils net-tools \
    && rm -rf /var/lib/apt/lists/*

# vscode user permissions
RUN mkdir -p /home/vscode/.npm-global \
    && chown -R vscode:vscode /home/vscode

USER vscode
ENV NPM_CONFIG_PREFIX=/home/vscode/.npm-global
ENV PATH="${PATH}:/home/vscode/.npm-global/bin"

WORKDIR /workspaces/nasnet

ARG BUILD_DATE
ARG GIT_SHA
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"

CMD ["sleep", "infinity"]
