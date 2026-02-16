# Image URL to use all building/pushing image targets
IMG ?= kubegram-operator:latest
# Helm Chart Release Name
RELEASE_NAME ?= kubegram-operator
# Helm Chart Namespace
NAMESPACE ?= default

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

.PHONY: all
all: build

##@ General

.PHONY: help
help: ## Display this help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: fmt
fmt: ## Run go fmt against code.
	go fmt ./...

.PHONY: vet
vet: ## Run go vet against code.
	go vet ./...

.PHONY: build
build: fmt vet ## Build manager binary.
	go build -o bin/manager cmd/manager/main.go

.PHONY: run
run: fmt vet ## Run a controller from your host.
# This runs the operator locally using "go run".
# It uses the default Stdio transport for the MCP server.
	go run ./cmd/manager/main.go

.PHONY: run-http
run-http: fmt vet ## Run a controller from your host with HTTP MCP enabled.
# This runs the operator locally with the HTTP/SSE transport enabled on port 8080.
	go run ./cmd/manager/main.go --mcp-http-addr ":8080"

.PHONY: deploy-argocd
deploy-argocd: ## Deploy Argo CD locally for testing
	kubectl create namespace argocd || true
	kubectl apply -n argocd -f k8s/argocd/install.yaml
	# Patch service to LoadBalancer for easier access if needed (optional)
	# kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

.PHONY: setup-argocd-test
setup-argocd-test: ## Setup Argo CD with test app and token
	./scripts/setup_argocd.sh

.PHONY: test-e2e
test-e2e: ## Run E2E tests
	go test ./tests/e2e/... -v

##@ Build

.PHONY: docker-build
docker-build: ## Build docker image with the manager.
	docker build -t ${IMG} .

.PHONY: docker-push
docker-push: ## Push docker image with the manager.
	docker push ${IMG}

##@ Deployment

.PHONY: helm-install
helm-install: ## Install Helm chart to the K8s cluster specified in ~/.kube/config.
# This installs or upgrades the Helm chart in the specified namespace.
# It overrides the image repository and tag to match the built image.
	helm upgrade --install ${RELEASE_NAME} ./charts/kubegram-operator \
		--namespace ${NAMESPACE} \
		--set image.repository=$(shell echo ${IMG} | cut -d: -f1) \
		--set image.tag=$(shell echo ${IMG} | cut -d: -f2)

.PHONY: helm-uninstall
helm-uninstall: ## Uninstall Helm chart from the K8s cluster.
	helm uninstall ${RELEASE_NAME} --namespace ${NAMESPACE}

.PHONY: helm-dependency-update
helm-dependency-update: ## Update Helm chart dependencies.
	helm dependency update ./charts/kubegram-operator

.PHONY: kind-load

kind-load: ## Load docker image into kind cluster (requires kind installed and cluster running).
# This loads the built Docker image into a local Kind cluster so it's available for the Helm chart.
	kind load docker-image ${IMG}

.PHONY: minikube-load
minikube-load: ## Load docker image into minikube cluster (requires minikube installed and running).
	minikube image load ${IMG}

.PHONY: minikube-dev-up
minikube-dev-up: docker-build minikube-load helm-install ## Build image, load to minikube, and install chart.

.PHONY: dev-up
dev-up: docker-build kind-load helm-install ## Build image, load to kind, and install chart.
# This is a convenience target for the full local development loop with Kind.

.PHONY: dev-down
dev-down: helm-uninstall ## Uninstall chart.

.PHONY: restart
restart: ## Rebuild and reinstall the operator locally (Minikube).
	-helm uninstall ${RELEASE_NAME} --namespace ${NAMESPACE}
	$(MAKE) minikube-dev-up

.PHONY: restart-debug
restart-debug: ## Rebuild and reinstall the operator locally (Minikube) with debug enabled.
	-helm uninstall ${RELEASE_NAME} --namespace ${NAMESPACE}
	$(MAKE) docker-build IMG=$(shell echo ${IMG} | cut -d: -f1):debug
	$(MAKE) minikube-load IMG=$(shell echo ${IMG} | cut -d: -f1):debug
	helm upgrade --install ${RELEASE_NAME} ./charts/kubegram-operator \
		--namespace ${NAMESPACE} \
		--set image.repository=$(shell echo ${IMG} | cut -d: -f1) \
		--set image.tag=debug \
		--set debug.enabled=true
.PHONY: deploy-debug
deploy-debug: ## Deploy the operator with debug enabled.
	$(MAKE) docker-build IMG=$(shell echo ${IMG} | cut -d: -f1):debug
	$(MAKE) minikube-load IMG=$(shell echo ${IMG} | cut -d: -f1):debug
	helm upgrade --install ${RELEASE_NAME} ./charts/kubegram-operator \
		--namespace ${NAMESPACE} \
		--set image.repository=$(shell echo ${IMG} | cut -d: -f1) \
		--set image.tag=debug \
		--set debug.enabled=true

.PHONY: debug-connect
debug-connect: ## Forward port 40000 to the operator pod for debugging.
	kubectl port-forward deployment/kubegram-operator 40000:40000

.PHONY: debug-connect-http
debug-connect-http: ## Forward port 8080 to the operator pod for HTTP/SSE.
	kubectl port-forward deployment/kubegram-operator 8080:8080
