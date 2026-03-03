//go:build !linux

// Package ebpf manages the lifecycle of the kubegram-sidecar eBPF TC programs.
// This stub is compiled on non-Linux platforms so the project builds anywhere.
// The real implementation (loader.go) is Linux-only.
package ebpf

import (
	"context"
	"fmt"

	"go.uber.org/zap"

	"github.com/kubegram/kubegram-sidecar/pkg/types"
)

// Observer is the interface the Loader exposes to the metrics package.
type Observer interface {
	ObservePacket(ev *types.PacketEvent)
}

// Loader is a no-op stub on non-Linux platforms.
type Loader struct{}

// NewLoader always returns an error on non-Linux platforms.
func NewLoader(log *zap.Logger, iface string, observer Observer) (*Loader, error) {
	_ = log
	return nil, fmt.Errorf("eBPF TC hooks require Linux (current platform does not support them)")
}

func (l *Loader) Attach() error        { return fmt.Errorf("not supported on this platform") }
func (l *Loader) Run(_ context.Context) {}
func (l *Loader) Close()               {}
