package webhook

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"go.uber.org/zap"
	admissionv1 "k8s.io/api/admission/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	k8stypes "k8s.io/apimachinery/pkg/types"
)

var (
	runtimeScheme = runtime.NewScheme()
	codecs        = serializer.NewCodecFactory(runtimeScheme)
	deserializer  = codecs.UniversalDeserializer()
)

func init() {
	_ = corev1.AddToScheme(runtimeScheme)
	_ = admissionv1.AddToScheme(runtimeScheme)
}

// Server is the TLS admission webhook HTTP server.
type Server struct {
	log      *zap.Logger
	certFile string
	keyFile  string
	image    string
}

// NewServer creates a Server. The sidecar image is read from the
// KUBEGRAM_SIDECAR_IMAGE environment variable, falling back to the public
// ghcr.io image.
func NewServer(log *zap.Logger, certFile, keyFile string) *Server {
	image := os.Getenv("KUBEGRAM_SIDECAR_IMAGE")
	if image == "" {
		image = "ghcr.io/kubegram/kubegram-sidecar:latest"
	}
	return &Server{
		log:      log,
		certFile: certFile,
		keyFile:  keyFile,
		image:    image,
	}
}

// Run starts the TLS HTTPS server and blocks until ctx is cancelled.
func (s *Server) Run(ctx context.Context, addr string) error {
	cert, err := tls.LoadX509KeyPair(s.certFile, s.keyFile)
	if err != nil {
		return fmt.Errorf("load TLS keypair: %w", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/mutate", s.handleMutate)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusOK) })

	srv := &http.Server{
		Addr:    addr,
		Handler: mux,
		TLSConfig: &tls.Config{
			Certificates: []tls.Certificate{cert},
			MinVersion:   tls.VersionTLS12,
		},
	}

	go func() {
		<-ctx.Done()
		srv.Close() //nolint:errcheck
	}()

	s.log.Info("webhook server listening", zap.String("addr", addr))
	if err := srv.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
		return err
	}
	return nil
}

// handleMutate processes an AdmissionReview request.
func (s *Server) handleMutate(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1 MB limit
	if err != nil {
		http.Error(w, "read body", http.StatusBadRequest)
		return
	}

	obj, gvk, err := deserializer.Decode(body, nil, nil)
	if err != nil {
		s.log.Error("decode admission review", zap.Error(err))
		http.Error(w, "decode body", http.StatusBadRequest)
		return
	}

	review, ok := obj.(*admissionv1.AdmissionReview)
	if !ok {
		s.log.Error("unexpected type", zap.String("gvk", gvk.String()))
		http.Error(w, "unexpected type", http.StatusBadRequest)
		return
	}

	response := s.mutate(review.Request)
	review.Response = response
	review.Response.UID = review.Request.UID

	out, err := json.Marshal(review)
	if err != nil {
		s.log.Error("marshal review response", zap.Error(err))
		http.Error(w, "marshal response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(out) //nolint:errcheck
}

// mutate decides whether to inject the sidecar and returns the admission response.
func (s *Server) mutate(req *admissionv1.AdmissionRequest) *admissionv1.AdmissionResponse {
	if req.Kind.Kind != "Pod" {
		return allow(req.UID)
	}

	var pod corev1.Pod
	if err := json.Unmarshal(req.Object.Raw, &pod); err != nil {
		s.log.Error("unmarshal pod", zap.Error(err))
		return deny(req.UID, "unmarshal pod")
	}

	if !needsInjection(&pod) {
		s.log.Debug("skipping injection",
			zap.String("pod", pod.Name),
			zap.String("namespace", pod.Namespace),
		)
		return allow(req.UID)
	}

	patch, err := buildPatch(&pod, s.image)
	if err != nil {
		s.log.Error("build patch", zap.Error(err))
		return deny(req.UID, "build patch")
	}

	s.log.Info("injecting sidecar",
		zap.String("pod", pod.GenerateName),
		zap.String("namespace", pod.Namespace),
		zap.String("service", pod.Annotations[serviceAnnotation]),
	)

	pt := admissionv1.PatchTypeJSONPatch
	return &admissionv1.AdmissionResponse{
		Allowed:   true,
		PatchType: &pt,
		Patch:     patch,
	}
}

func allow(uid k8stypes.UID) *admissionv1.AdmissionResponse {
	return &admissionv1.AdmissionResponse{
		UID:     uid,
		Allowed: true,
	}
}

func deny(uid k8stypes.UID, reason string) *admissionv1.AdmissionResponse {
	return &admissionv1.AdmissionResponse{
		UID:     uid,
		Allowed: false,
		Result:  &metav1.Status{Message: reason},
	}
}
