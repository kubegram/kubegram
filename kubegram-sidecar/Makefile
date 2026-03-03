IMG            ?= kubegram-sidecar:latest
RELEASE_NAME   ?= kubegram-sidecar
NAMESPACE      ?= default
IMAGE_REPO     ?= $(shell echo $(IMG) | cut -d: -f1)
IMAGE_TAG      ?= $(shell echo $(IMG) | cut -d: -f2)

.PHONY: fmt vet generate build run-webhook docker-build docker-push \
        kind-load minikube-load helm-install helm-uninstall \
        dev-up dev-down test

##@ Development

fmt: ## Run go fmt
	go fmt ./...

vet: ## Run go vet
	go vet ./...

generate: ## Compile eBPF C program via bpf2go (requires clang + libbpf-dev on Linux)
	go generate ./pkg/ebpf/...

build: fmt vet ## Build binary to bin/sidecar
	go build -o bin/sidecar ./cmd/sidecar

run-webhook: build ## Run webhook server locally (requires TLS certs at /tls/)
	./bin/sidecar --mode=webhook --webhook-addr=:8443

test: ## Run unit tests
	go test ./... -v -count=1

##@ Docker

docker-build: ## Build Docker image (IMG=kubegram-sidecar:latest)
	docker build -t $(IMG) .

docker-push: ## Push Docker image
	docker push $(IMG)

##@ Kubernetes

kind-load: ## Load image into Kind cluster
	kind load docker-image $(IMG)

minikube-load: ## Load image into Minikube
	minikube image load $(IMG)

##@ Helm

helm-install: ## Install/upgrade Helm chart into cluster
	helm upgrade --install $(RELEASE_NAME) ./charts/kubegram-sidecar \
		--namespace $(NAMESPACE) \
		--create-namespace \
		--set image.repository=$(IMAGE_REPO) \
		--set image.tag=$(IMAGE_TAG)

helm-uninstall: ## Uninstall Helm chart
	helm uninstall $(RELEASE_NAME) --namespace $(NAMESPACE)

##@ Combined Workflows

dev-up: docker-build kind-load helm-install ## Build → load to Kind → install chart

dev-down: helm-uninstall ## Uninstall chart from cluster
