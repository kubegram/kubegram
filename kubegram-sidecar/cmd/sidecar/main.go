package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"github.com/kubegram/kubegram-sidecar/pkg/ebpf"
	"github.com/kubegram/kubegram-sidecar/pkg/metrics"
	"github.com/kubegram/kubegram-sidecar/pkg/reporter"
	"github.com/kubegram/kubegram-sidecar/pkg/validator"
	"github.com/kubegram/kubegram-sidecar/pkg/webhook"
)

func main() {
	var (
		mode           string
		webhookAddr    string
		metricsAddr    string
		healthAddr     string
		reportInterval time.Duration
		kubegramURL    string
		iface          string
		tlsCertFile    string
		tlsKeyFile     string
	)

	flag.StringVar(&mode, "mode", "", "Runtime mode: 'webhook' or 'sidecar' (required)")
	flag.StringVar(&webhookAddr, "webhook-addr", ":8443", "Address for the mutating webhook TLS server")
	flag.StringVar(&metricsAddr, "metrics-addr", ":9090", "Address for the Prometheus metrics endpoint")
	flag.StringVar(&healthAddr, "health-addr", ":8081", "Address for liveness and readiness probes")
	flag.DurationVar(&reportInterval, "report-interval", 15*time.Second, "Interval for pushing stats to kubegram-server")
	flag.StringVar(&kubegramURL, "kubegram-url", "", "kubegram-server base URL (fallback: KUBEGRAM_SERVER_URL env var)")
	flag.StringVar(&iface, "iface", "eth0", "Network interface to attach eBPF TC hooks to")
	flag.StringVar(&tlsCertFile, "tls-cert", "/tls/tls.crt", "Path to TLS certificate file (webhook mode)")
	flag.StringVar(&tlsKeyFile, "tls-key", "/tls/tls.key", "Path to TLS key file (webhook mode)")
	flag.Parse()

	if mode == "" {
		fmt.Fprintln(os.Stderr, "error: --mode is required ('webhook' or 'sidecar')")
		os.Exit(1)
	}

	log := newLogger()
	defer log.Sync() //nolint:errcheck

	if kubegramURL == "" {
		kubegramURL = os.Getenv("KUBEGRAM_SERVER_URL")
	}

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	switch mode {
	case "webhook":
		runWebhook(ctx, log, webhookAddr, healthAddr, tlsCertFile, tlsKeyFile)
	case "sidecar":
		runSidecar(ctx, log, iface, metricsAddr, healthAddr, kubegramURL, reportInterval)
	default:
		log.Fatal("unknown mode", zap.String("mode", mode))
	}
}

func runWebhook(ctx context.Context, log *zap.Logger, addr, healthAddr, certFile, keyFile string) {
	log.Info("starting webhook server", zap.String("addr", addr))

	srv := webhook.NewServer(log, certFile, keyFile)

	// Health probe server
	go serveHealth(ctx, log, healthAddr)

	if err := srv.Run(ctx, addr); err != nil {
		log.Fatal("webhook server exited", zap.Error(err))
	}
}

func runSidecar(ctx context.Context, log *zap.Logger, iface, metricsAddr, healthAddr, kubegramURL string, interval time.Duration) {
	log.Info("starting sidecar observer",
		zap.String("iface", iface),
		zap.String("metrics_addr", metricsAddr),
	)

	namespace := os.Getenv("KUBEGRAM_NAMESPACE")
	podName := os.Getenv("KUBEGRAM_POD_NAME")
	podIP := os.Getenv("KUBEGRAM_POD_IP")
	serviceName := os.Getenv("KUBEGRAM_SERVICE_NAME")

	reg := metrics.NewRegistry(namespace, podName, serviceName)

	loader, err := ebpf.NewLoader(log, iface, reg)
	if err != nil {
		log.Fatal("failed to initialise eBPF loader", zap.Error(err))
	}
	defer loader.Close()

	if err := loader.Attach(); err != nil {
		log.Fatal("failed to attach eBPF programs", zap.Error(err))
	}

	// Start consuming ring-buffer events in the background
	go loader.Run(ctx)

	// Prometheus metrics server + validation handler (shared port 9090)
	mux := http.NewServeMux()
	mux.Handle("/metrics", promhttp.HandlerFor(reg.Registry(), promhttp.HandlerOpts{}))

	// Validation handler: POST /validate and GET /validate/results
	validatorHandler := validator.New(log, kubegramURL, namespace, podName)
	mux.Handle("/validate", validatorHandler)
	mux.Handle("/validate/results", validatorHandler)

	go func() {
		log.Info("metrics+validator server listening", zap.String("addr", metricsAddr))
		if err := http.ListenAndServe(metricsAddr, mux); err != nil && err != http.ErrServerClosed {
			log.Error("metrics server error", zap.Error(err))
		}
	}()

	// Health probe server
	go serveHealth(ctx, log, healthAddr)

	// kubegram-server reporter (includes podIP for sidecar registry)
	if kubegramURL != "" {
		apiToken := os.Getenv("KUBEGRAM_API_TOKEN")
		rep := reporter.New(log, kubegramURL, apiToken, namespace, podName, podIP, serviceName, reg)
		go rep.Run(ctx, interval)
	} else {
		log.Warn("kubegram-url not set; skipping traffic push to kubegram-server")
	}

	<-ctx.Done()
	log.Info("shutting down sidecar observer")
}

func serveHealth(ctx context.Context, log *zap.Logger, addr string) {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })

	srv := &http.Server{Addr: addr, Handler: mux}
	go func() {
		<-ctx.Done()
		srv.Close() //nolint:errcheck
	}()

	log.Info("health server listening", zap.String("addr", addr))
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Error("health server error", zap.Error(err))
	}
}

func newLogger() *zap.Logger {
	cfg := zap.NewProductionConfig()
	cfg.EncoderConfig.TimeKey = "ts"
	cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	log, err := cfg.Build()
	if err != nil {
		panic(err)
	}
	return log
}
