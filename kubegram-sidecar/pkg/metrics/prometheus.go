// Package metrics manages Prometheus metric collectors for the kubegram-sidecar.
//
// It receives raw PacketEvent structs from the eBPF ring buffer, parses
// HTTP headers where possible, and increments the appropriate counters and
// gauges.
package metrics

import (
	"bufio"
	"bytes"
	"net/http"
	"strconv"
	"sync/atomic"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/prometheus/client_golang/prometheus"

	"github.com/kubegram/kubegram-sidecar/pkg/types"
)

const ns = "kubegram_sidecar"

// Registry holds all Prometheus metrics for the sidecar.
type Registry struct {
	reg prometheus.Registerer
	gat prometheus.Gatherer

	requestsTotal *prometheus.CounterVec
	bytesTotal    *prometheus.CounterVec
	activeConns   prometheus.Gauge

	openConns atomic.Int64
}

// NewRegistry creates a new Prometheus registry scoped to this pod.
func NewRegistry(namespace, pod, service string) *Registry {
	reg := prometheus.NewRegistry()

	constLabels := prometheus.Labels{
		"namespace": namespace,
		"pod":       pod,
		"service":   service,
	}

	requestsTotal := prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace:   ns,
		Name:        "http_requests_total",
		Help:        "Total HTTP requests observed by the eBPF sidecar.",
		ConstLabels: constLabels,
	}, []string{"method", "path", "status"})

	bytesTotal := prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace:   ns,
		Name:        "http_request_bytes_total",
		Help:        "Total bytes observed by the eBPF sidecar.",
		ConstLabels: constLabels,
	}, []string{"direction"})

	activeConns := prometheus.NewGauge(prometheus.GaugeOpts{
		Namespace:   ns,
		Name:        "active_connections",
		Help:        "Estimated number of currently active TCP connections.",
		ConstLabels: constLabels,
	})

	reg.MustRegister(requestsTotal, bytesTotal, activeConns)
	reg.MustRegister(prometheus.NewGoCollector())
	reg.MustRegister(prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}))

	return &Registry{
		reg:           reg,
		gat:           reg,
		requestsTotal: requestsTotal,
		bytesTotal:    bytesTotal,
		activeConns:   activeConns,
	}
}

// Registry returns the Prometheus gatherer (for the /metrics HTTP handler).
func (r *Registry) Registry() prometheus.Gatherer { return r.gat }

// Snapshot is a point-in-time aggregated view for the reporter.
type Snapshot struct {
	ActiveConn int64
}

// ObservePacket processes a raw eBPF packet event and updates metrics.
func (r *Registry) ObservePacket(ev *types.PacketEvent) {
	direction := "ingress"
	if ev.Direction == types.DirectionEgress {
		direction = "egress"
	}

	r.bytesTotal.WithLabelValues(direction).Add(float64(ev.Bytes))

	if ev.PayloadLen > 0 {
		r.parseHTTP(ev)
	}
}

// parseHTTP tries to decode the payload as HTTP/1.x and records labels.
func (r *Registry) parseHTTP(ev *types.PacketEvent) {
	payload := ev.Payload[:ev.PayloadLen]

	if isHTTPRequest(payload) {
		req, err := http.ReadRequest(bufio.NewReader(bytes.NewReader(payload)))
		if err == nil {
			r.requestsTotal.WithLabelValues(req.Method, sanitisePath(req.URL.Path), "").Inc()
			return
		}
	}

	if isHTTPResponse(payload) {
		resp, err := http.ReadResponse(bufio.NewReader(bytes.NewReader(payload)), nil)
		if err == nil {
			r.requestsTotal.WithLabelValues("", "", strconv.Itoa(resp.StatusCode)).Inc()
			return
		}
	}

	// Non-HTTP TCP: bytes already counted; gopacket available for future L4 extension.
	_ = gopacket.NewPacket(payload, layers.LayerTypeTCP, gopacket.Default)
}

// Snapshot returns aggregated values for the reporter.
func (r *Registry) Snapshot() Snapshot {
	return Snapshot{ActiveConn: r.openConns.Load()}
}

func isHTTPRequest(b []byte) bool {
	for _, m := range []string{"GET ", "POST ", "PUT ", "DELETE ", "PATCH ", "HEAD ", "OPTIONS "} {
		if bytes.HasPrefix(b, []byte(m)) {
			return true
		}
	}
	return false
}

func isHTTPResponse(b []byte) bool {
	return bytes.HasPrefix(b, []byte("HTTP/"))
}

func sanitisePath(path string) string {
	if len(path) > 128 {
		return path[:128]
	}
	return path
}
