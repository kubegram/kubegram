// Package ebpf manages the lifecycle of kubegram-sidecar eBPF TC programs.
package ebpf

import "github.com/kubegram/kubegram-sidecar/pkg/types"

// Re-export PacketEvent and direction constants so callers that already import
// this package do not need to change their imports.
type PacketEvent = types.PacketEvent

const (
	DirectionIngress = types.DirectionIngress
	DirectionEgress  = types.DirectionEgress
)
