// Package reporter periodically pushes aggregated traffic statistics to the
// kubegram-server REST API endpoint POST /api/public/v1/metrics/traffic.
//
// If the endpoint is unavailable the reporter logs a warning and continues;
// it never blocks the main sidecar observer loop.
package reporter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/kubegram/kubegram-sidecar/pkg/metrics"
)

const endpoint = "/api/public/v1/metrics/traffic"

// payload is the JSON body sent to kubegram-server.
type payload struct {
	Namespace         string    `json:"namespace"`
	Pod               string    `json:"pod"`
	PodIP             string    `json:"pod_ip"`
	Service           string    `json:"service"`
	Timestamp         time.Time `json:"timestamp"`
	ActiveConnections int64     `json:"active_connections"`
}

// Reporter sends traffic snapshots to kubegram-server on a fixed interval.
type Reporter struct {
	log         *zap.Logger
	serverURL   string
	apiToken    string
	namespace   string
	pod         string
	podIP       string
	service     string
	reg         *metrics.Registry
	httpClient  *http.Client
}

// New creates a Reporter.
func New(log *zap.Logger, serverURL, apiToken, namespace, pod, podIP, service string, reg *metrics.Registry) *Reporter {
	return &Reporter{
		log:        log,
		serverURL:  serverURL,
		apiToken:   apiToken,
		namespace:  namespace,
		pod:        pod,
		podIP:      podIP,
		service:    service,
		reg:        reg,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// Run starts the reporting loop. It blocks until ctx is cancelled.
func (r *Reporter) Run(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	r.log.Info("reporter started",
		zap.String("server", r.serverURL),
		zap.Duration("interval", interval),
	)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := r.push(ctx); err != nil {
				r.log.Warn("failed to push traffic stats to kubegram-server",
					zap.Error(err),
					zap.String("url", r.serverURL+endpoint),
				)
			}
		}
	}
}

func (r *Reporter) push(ctx context.Context) error {
	snap := r.reg.Snapshot()

	body := payload{
		Namespace:         r.namespace,
		Pod:               r.pod,
		PodIP:             r.podIP,
		Service:           r.service,
		Timestamp:         time.Now().UTC(),
		ActiveConnections: snap.ActiveConn,
	}

	data, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, r.serverURL+endpoint, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if r.apiToken != "" {
		req.Header.Set("Authorization", "Bearer "+r.apiToken)
	}

	resp, err := r.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("http post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("unexpected status %d from kubegram-server", resp.StatusCode)
	}

	r.log.Debug("pushed traffic stats", zap.Int("status", resp.StatusCode))
	return nil
}
