# Stage 1: Build — cross-compile the Go binary natively (no QEMU)
# tracer_bpfel.go is pre-generated and committed; bpf2go does not run here.
FROM --platform=$BUILDPLATFORM golang:1.24 AS builder

ARG TARGETOS=linux
ARG TARGETARCH

WORKDIR /build

# Cache Go module downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source and cross-compile Go binary for the target platform
COPY . .
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -a -ldflags="-s -w" -o /bin/sidecar ./cmd/sidecar

# Stage 2: Runtime — minimal Debian image with eBPF runtime dependencies
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libelf1 \
    zlib1g \
  && rm -rf /var/lib/apt/lists/*

# Copy compiled binary
COPY --from=builder /bin/sidecar /sidecar

# Run as non-root where possible.
# Note: the sidecar container itself (--mode=sidecar) requires CAP_BPF and
# CAP_NET_ADMIN to attach eBPF TC hooks; those capabilities are injected by
# the webhook into the pod spec, not via the image USER directive.
USER 65532:65532

ENTRYPOINT ["/sidecar"]
