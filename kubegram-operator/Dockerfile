# Build Stage
# We use a multi-stage build to keep the final image small.
# The builder stage compiles the Go binary.
# --platform=$BUILDPLATFORM runs the builder natively (no QEMU), then cross-compiles for the target.
FROM --platform=$BUILDPLATFORM golang:1.24 AS builder

ARG TARGETOS=linux
ARG TARGETARCH

WORKDIR /workspace

# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum

# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go mod download

# Copy the go source
COPY cmd/ cmd/
COPY pkg/ pkg/

# Build
# We build a statically linked binary, cross-compiled for the target platform.
# Added gcflags to disable optimizations/inlining for better debugging
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -gcflags="all=-N -l" -a -o manager cmd/manager/main.go

# Final Stage
# We use a slim Debian image for the runtime environment.
# This provides a balance between size and available utilities (like bash, curl).
FROM debian:bookworm-slim

WORKDIR /

# Install dependencies
# We install tools needed for the local MCP tools and proxies:
# - bash: for the bash tool
# - kubectl: for the kubectl tool
# - nodejs/npm: for running Node.js-based MCP servers (like Argo CD MCP)
# - python3/pip/venv: for running Python-based MCP servers (like Kubernetes MCP)
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    bash \
    nodejs \
    npm \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl
# We download the stable release of kubectl for the target architecture.
ARG TARGETARCH
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/${TARGETARCH}/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/

# Install uv (for uvx)
# uv is a fast Python package installer and resolver, often used to run Python tools.
RUN pip3 install uv --break-system-packages

# Install Helm
RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 && \
    chmod 700 get_helm.sh && \
    ./get_helm.sh && \
    rm get_helm.sh

# Copy the binary
# We copy the compiled binary from the builder stage.
COPY --from=builder /workspace/manager .

# Use a non-root user for security
USER 65532:65532

ENTRYPOINT ["/manager"]
