// Package health provides HTTP health-check polling for Kubegram services.
package health

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// Service describes a named HTTP health endpoint.
type Service struct {
	Name string
	URL  string
}

// WaitForServices polls all services until they all return HTTP 2xx/3xx or the context is
// cancelled. Uses exponential backoff: starts at 2s, caps at 30s.
func WaitForServices(ctx context.Context, services []Service) error {
	interval := 2 * time.Second
	const maxInterval = 30 * time.Second

	client := &http.Client{Timeout: 3 * time.Second}

	healthy := make(map[string]bool, len(services))
	for _, s := range services {
		healthy[s.Name] = false
	}

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("timed out waiting for services to become healthy: %w", ctx.Err())
		default:
		}

		allHealthy := true
		for _, svc := range services {
			if healthy[svc.Name] {
				continue
			}
			resp, err := client.Get(svc.URL)
			if err == nil && resp.StatusCode < 400 {
				resp.Body.Close()
				healthy[svc.Name] = true
				fmt.Printf("  [OK] %-20s %s\n", svc.Name, svc.URL)
			} else {
				if err == nil {
					resp.Body.Close()
				}
				allHealthy = false
			}
		}

		if allHealthy {
			return nil
		}

		select {
		case <-ctx.Done():
			return fmt.Errorf("timed out waiting for services to become healthy: %w", ctx.Err())
		case <-time.After(interval):
		}

		if interval < maxInterval {
			interval *= 2
			if interval > maxInterval {
				interval = maxInterval
			}
		}
	}
}
