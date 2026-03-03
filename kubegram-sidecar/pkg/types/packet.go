// Package types contains shared data types used across kubegram-sidecar packages.
package types

// PacketEvent mirrors the C struct packet_event defined in pkg/ebpf/bpf/tracer.c.
// Fields must match the BPF map layout exactly (size and alignment).
type PacketEvent struct {
	SrcIP      uint32
	DstIP      uint32
	SrcPort    uint16
	DstPort    uint16
	Bytes      uint32
	Direction  uint8
	Proto      uint8
	Payload    [64]uint8
	PayloadLen uint8
	_          [1]uint8 // alignment padding
}

const (
	DirectionIngress uint8 = 0
	DirectionEgress  uint8 = 1
)
