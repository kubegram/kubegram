//go:build linux

// Package ebpf manages the lifecycle of the kubegram-sidecar eBPF TC programs.
//
// It loads the compiled eBPF object (embedded at build time via bpf2go /
// go:generate), attaches ingress and egress TC hooks to the target interface,
// reads packet events from the BPF ring buffer, and forwards them to the
// metrics registry for aggregation.
//
// This file is Linux-only. On other platforms use the stub in loader_stub.go.
package ebpf

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"fmt"
	"net"

	ciliumebpf "github.com/cilium/ebpf"
	"github.com/cilium/ebpf/link"
	"github.com/cilium/ebpf/ringbuf"
	"github.com/cilium/ebpf/rlimit"
	"go.uber.org/zap"

	"github.com/kubegram/kubegram-sidecar/pkg/types"
)

//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -cc clang -cflags "-O2 -g -Wall -target bpf" tracer ./bpf/tracer.c

// Observer is the interface the Loader exposes to the metrics package.
// It avoids a direct import of pkg/metrics from pkg/ebpf.
type Observer interface {
	ObservePacket(ev *types.PacketEvent)
}

// Loader holds the loaded eBPF objects and attached TC links.
type Loader struct {
	log      *zap.Logger
	iface    string
	observer Observer
	objs     *tracerObjects
	links    []link.Link
	reader   *ringbuf.Reader
}

// NewLoader creates a new Loader for the given network interface.
// It removes the memlock rlimit (required on kernel < 5.11) and loads the
// compiled eBPF object into the kernel.
func NewLoader(log *zap.Logger, iface string, observer Observer) (*Loader, error) {
	if err := rlimit.RemoveMemlock(); err != nil {
		return nil, fmt.Errorf("remove memlock rlimit: %w", err)
	}

	objs := &tracerObjects{}
	if err := loadTracerObjects(objs, nil); err != nil {
		return nil, fmt.Errorf("load eBPF objects: %w", err)
	}

	reader, err := ringbuf.NewReader(objs.Events)
	if err != nil {
		objs.Close()
		return nil, fmt.Errorf("create ring-buffer reader: %w", err)
	}

	return &Loader{
		log:      log,
		iface:    iface,
		observer: observer,
		objs:     objs,
		reader:   reader,
	}, nil
}

// Attach pins the ingress and egress TC programs to the target interface.
func (l *Loader) Attach() error {
	iface, err := net.InterfaceByName(l.iface)
	if err != nil {
		return fmt.Errorf("interface %q not found: %w", l.iface, err)
	}

	ingress, err := link.AttachTCX(link.TCXOptions{
		Interface: iface.Index,
		Program:   l.objs.TcIngress,
		Attach:    ciliumebpf.AttachTCXIngress,
	})
	if err != nil {
		return fmt.Errorf("attach TC ingress: %w", err)
	}
	l.links = append(l.links, ingress)

	egress, err := link.AttachTCX(link.TCXOptions{
		Interface: iface.Index,
		Program:   l.objs.TcEgress,
		Attach:    ciliumebpf.AttachTCXEgress,
	})
	if err != nil {
		return fmt.Errorf("attach TC egress: %w", err)
	}
	l.links = append(l.links, egress)

	l.log.Info("eBPF TC hooks attached",
		zap.String("iface", l.iface),
		zap.Int("index", iface.Index),
	)
	return nil
}

// Run reads events from the BPF ring buffer until ctx is cancelled.
func (l *Loader) Run(ctx context.Context) {
	go func() {
		<-ctx.Done()
		l.reader.Close() //nolint:errcheck
	}()

	for {
		record, err := l.reader.Read()
		if err != nil {
			if errors.Is(err, ringbuf.ErrClosed) {
				return
			}
			l.log.Error("ring-buffer read error", zap.Error(err))
			continue
		}

		var ev types.PacketEvent
		if err := binary.Read(bytes.NewReader(record.RawSample), binary.LittleEndian, &ev); err != nil {
			l.log.Warn("failed to decode packet event", zap.Error(err))
			continue
		}

		l.observer.ObservePacket(&ev)
	}
}

// Close detaches all TC links and releases eBPF resources.
func (l *Loader) Close() {
	for _, lnk := range l.links {
		lnk.Close() //nolint:errcheck
	}
	if l.reader != nil {
		l.reader.Close() //nolint:errcheck
	}
	if l.objs != nil {
		l.objs.Close()
	}
}
