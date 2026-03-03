// Package validator implements the HTTP API that kubegram-core uses to
// trigger validation test cases against deployed services.
//
// The handler is mounted on the existing metrics server (port 9090) alongside
// /metrics, so no additional port or Kubernetes Service configuration is
// required.
//
// Flow:
//  1. kubegram-server POSTs to POST /validate with a list of test cases.
//  2. For each test case, the handler issues an outbound HTTP request to the
//     target service with the X-Kubegram-Validation-ID header set to the
//     case's correlationId.  The sidecar's eBPF TC hooks capture this
//     traffic automatically — no changes to the eBPF layer are needed.
//  3. Results are stored in memory keyed by correlationId.
//  4. After all cases complete (or the timeout elapses), the handler POSTs
//     the full result set back to kubegram-server's internal result endpoint.
//  5. kubegram-core may also poll GET /validate/results?ids=… at any time.
package validator

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"
)

const (
	correlationHeader   = "X-Kubegram-Validation-ID"
	resultsEndpoint     = "/api/internal/sidecar/validation/results"
	defaultTimeoutSecs  = 30
)

// TestCase is a single HTTP request to execute against the target service.
type TestCase struct {
	CorrelationID  string            `json:"correlation_id"`
	Method         string            `json:"method"`
	Path           string            `json:"path"`
	Headers        map[string]string `json:"headers,omitempty"`
	Body           json.RawMessage   `json:"body,omitempty"`
	ExpectedStatus int               `json:"expected_status"`
}

// TestResult captures the outcome of executing one TestCase.
type TestResult struct {
	CorrelationID  string `json:"correlation_id"`
	Success        bool   `json:"success"`
	ActualStatus   int    `json:"actual_status"`
	ResponseTimeMs int64  `json:"response_time_ms"`
	Error          string `json:"error,omitempty"`
}

// validationTrigger is the JSON body received on POST /validate.
type validationTrigger struct {
	TestCases      []TestCase `json:"test_cases"`
	TargetService  string     `json:"target_service"` // e.g. "my-service:8080"
	TimeoutSeconds int        `json:"timeout_seconds"`
}

// validationReport is the JSON body sent back to kubegram-server.
type validationReport struct {
	Namespace string       `json:"namespace"`
	Pod       string       `json:"pod"`
	Results   []TestResult `json:"results"`
	Timestamp time.Time    `json:"timestamp"`
}

// Handler handles POST /validate and GET /validate/results.
type Handler struct {
	log        *zap.Logger
	serverURL  string
	namespace  string
	pod        string
	httpClient *http.Client

	mu      sync.RWMutex
	results map[string]TestResult // correlationId → result
}

// New creates a Handler.
func New(log *zap.Logger, serverURL, namespace, pod string) *Handler {
	return &Handler{
		log:        log,
		serverURL:  serverURL,
		namespace:  namespace,
		pod:        pod,
		httpClient: &http.Client{Timeout: 35 * time.Second},
		results:    make(map[string]TestResult),
	}
}

// ServeHTTP dispatches /validate and /validate/results requests.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/validate":
		h.handleTrigger(w, r)
	case r.Method == http.MethodGet && r.URL.Path == "/validate/results":
		h.handleResults(w, r)
	default:
		http.NotFound(w, r)
	}
}

// handleTrigger receives validation test cases and executes them asynchronously.
func (h *Handler) handleTrigger(w http.ResponseWriter, r *http.Request) {
	var trigger validationTrigger
	if err := json.NewDecoder(r.Body).Decode(&trigger); err != nil {
		http.Error(w, "invalid JSON body: "+err.Error(), http.StatusBadRequest)
		return
	}
	if trigger.TargetService == "" {
		http.Error(w, "target_service is required", http.StatusBadRequest)
		return
	}
	if len(trigger.TestCases) == 0 {
		w.WriteHeader(http.StatusAccepted)
		return
	}

	timeout := trigger.TimeoutSeconds
	if timeout <= 0 {
		timeout = defaultTimeoutSecs
	}

	h.log.Info("validation trigger received",
		zap.Int("cases", len(trigger.TestCases)),
		zap.String("target", trigger.TargetService),
	)

	// Execute test cases asynchronously so we return 202 immediately.
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
	go func() {
		defer cancel()
		h.executeAll(ctx, trigger.TestCases, trigger.TargetService)
		h.pushResults(context.Background())
	}()

	w.WriteHeader(http.StatusAccepted)
}

// handleResults returns all results for the requested correlationIds.
// Returns 202 if some IDs are still pending; 200 when all are complete.
func (h *Handler) handleResults(w http.ResponseWriter, r *http.Request) {
	idsParam := r.URL.Query().Get("ids")
	if idsParam == "" {
		http.Error(w, "ids query parameter is required", http.StatusBadRequest)
		return
	}
	requested := strings.Split(idsParam, ",")

	h.mu.RLock()
	defer h.mu.RUnlock()

	var found []TestResult
	var pending []string
	for _, id := range requested {
		id = strings.TrimSpace(id)
		if res, ok := h.results[id]; ok {
			found = append(found, res)
		} else {
			pending = append(pending, id)
		}
	}

	status := http.StatusOK
	if len(pending) > 0 {
		status = http.StatusAccepted
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]any{ //nolint:errcheck
		"results": found,
		"pending": pending,
	})
}

// executeAll runs all test cases concurrently and stores results.
func (h *Handler) executeAll(ctx context.Context, cases []TestCase, targetService string) {
	var wg sync.WaitGroup
	for _, tc := range cases {
		wg.Add(1)
		go func(tc TestCase) {
			defer wg.Done()
			result := h.execute(ctx, tc, targetService)
			h.mu.Lock()
			h.results[tc.CorrelationID] = result
			h.mu.Unlock()
		}(tc)
	}
	wg.Wait()
}

// execute performs a single HTTP request and returns the result.
func (h *Handler) execute(ctx context.Context, tc TestCase, targetService string) TestResult {
	result := TestResult{CorrelationID: tc.CorrelationID}

	url := fmt.Sprintf("http://%s%s", targetService, tc.Path)

	var bodyReader io.Reader
	if len(tc.Body) > 0 && string(tc.Body) != "null" {
		bodyReader = bytes.NewReader(tc.Body)
	}

	req, err := http.NewRequestWithContext(ctx, tc.Method, url, bodyReader)
	if err != nil {
		result.Error = fmt.Sprintf("build request: %v", err)
		return result
	}

	// Set correlation header so eBPF + userspace can track this request
	req.Header.Set(correlationHeader, tc.CorrelationID)

	// Apply any additional headers from the test case
	for k, v := range tc.Headers {
		req.Header.Set(k, v)
	}

	start := time.Now()
	resp, err := h.httpClient.Do(req)
	result.ResponseTimeMs = time.Since(start).Milliseconds()

	if err != nil {
		result.Error = fmt.Sprintf("http %s %s: %v", tc.Method, url, err)
		return result
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body) //nolint:errcheck

	result.ActualStatus = resp.StatusCode
	result.Success = (resp.StatusCode == tc.ExpectedStatus)

	h.log.Debug("test case executed",
		zap.String("correlation_id", tc.CorrelationID),
		zap.String("url", url),
		zap.Int("status", resp.StatusCode),
		zap.Bool("success", result.Success),
	)

	return result
}

// pushResults reports all collected results back to kubegram-server.
// Called after all test cases in a trigger complete.
func (h *Handler) pushResults(ctx context.Context) {
	if h.serverURL == "" {
		return
	}

	h.mu.RLock()
	results := make([]TestResult, 0, len(h.results))
	for _, r := range h.results {
		results = append(results, r)
	}
	h.mu.RUnlock()

	report := validationReport{
		Namespace: h.namespace,
		Pod:       h.pod,
		Results:   results,
		Timestamp: time.Now().UTC(),
	}

	data, err := json.Marshal(report)
	if err != nil {
		h.log.Warn("failed to marshal validation report", zap.Error(err))
		return
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, h.serverURL+resultsEndpoint, bytes.NewReader(data))
	if err != nil {
		h.log.Warn("failed to build validation report request", zap.Error(err))
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		h.log.Warn("failed to push validation results to kubegram-server", zap.Error(err))
		return
	}
	defer resp.Body.Close()

	h.log.Info("pushed validation results",
		zap.Int("count", len(results)),
		zap.Int("status", resp.StatusCode),
	)
}
