# Stage 1: Build — compile the Go binary and the eBPF C program
FROM golang:1.24 AS builder

# Install clang + libbpf-dev for bpf2go eBPF compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    libbpf-dev \
    linux-headers-amd64 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Cache Go module downloads
COPY go.mod go.sum ./
RUN go mod download

# Copy source and compile eBPF + Go binary
COPY . .
RUN go generate ./pkg/ebpf/...
RUN CGO_ENABLED=0 GOOS=linux go build -a -ldflags="-s -w" -o /bin/sidecar ./cmd/sidecar

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
