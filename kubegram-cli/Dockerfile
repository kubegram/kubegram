# ---- Stage 1: Build ----
# --platform=$BUILDPLATFORM runs the builder natively (no QEMU), then cross-compiles for the target.
FROM --platform=$BUILDPLATFORM golang:1.24 AS builder

ARG TARGETOS=linux
ARG TARGETARCH

WORKDIR /workspace

COPY go.mod go.sum* ./
RUN go mod download

COPY cmd/    cmd/
COPY internal/ internal/

ARG VERSION=dev
ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags "-X github.com/kubegram/kubegram-cli/internal/cli.Version=${VERSION} \
              -X github.com/kubegram/kubegram-cli/internal/cli.Commit=${GIT_COMMIT} \
              -X github.com/kubegram/kubegram-cli/internal/cli.BuildDate=${BUILD_DATE} \
              -s -w" \
    -o kubegram \
    ./cmd/kubegram/

# ---- Stage 2: Runtime ----
# debian:bookworm-slim matches the operator's runtime image.
# We install the Docker CLI so the containerised binary can still call `docker compose`.
FROM debian:bookworm-slim

ARG TARGETARCH

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (not the daemon — the host daemon is mounted at runtime).
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc && \
    echo "deb [arch=${TARGETARCH} signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" \
        > /etc/apt/sources.list.d/docker.list && \
    apt-get update && apt-get install -y docker-ce-cli && \
    rm -rf /var/lib/apt/lists/*

# Install kubectl for the target architecture.
RUN curl -LO "https://dl.k8s.io/release/$(curl -Ls https://dl.k8s.io/release/stable.txt)/bin/linux/${TARGETARCH}/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/

COPY --from=builder /workspace/kubegram /usr/local/bin/kubegram

ENTRYPOINT ["/usr/local/bin/kubegram"]
