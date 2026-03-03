BINARY_NAME := kubegram
MODULE      := github.com/kubegram/kubegram-cli

VERSION     ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
GIT_COMMIT  ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE  ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
GOBIN       ?= $(shell go env GOPATH)/bin

LDFLAGS := -ldflags "\
    -X $(MODULE)/internal/cli.Version=$(VERSION) \
    -X $(MODULE)/internal/cli.Commit=$(GIT_COMMIT) \
    -X $(MODULE)/internal/cli.BuildDate=$(BUILD_DATE) \
    -s -w"

.PHONY: all build fmt vet test clean install cross-build package docker-build

all: fmt vet build

fmt:
	go fmt ./...

vet:
	go vet ./...

build: fmt vet
	go build $(LDFLAGS) -o bin/$(BINARY_NAME) ./cmd/kubegram/

test:
	go test ./... -v

clean:
	rm -rf bin/ dist/

install: build
	cp bin/$(BINARY_NAME) $(GOBIN)/$(BINARY_NAME)

## cross-build: produce binaries for all supported platforms
cross-build:
	GOOS=darwin  GOARCH=arm64  go build $(LDFLAGS) -o dist/$(BINARY_NAME)-darwin-arm64    ./cmd/kubegram/
	GOOS=darwin  GOARCH=amd64  go build $(LDFLAGS) -o dist/$(BINARY_NAME)-darwin-amd64    ./cmd/kubegram/
	GOOS=linux   GOARCH=amd64  go build $(LDFLAGS) -o dist/$(BINARY_NAME)-linux-amd64     ./cmd/kubegram/
	GOOS=linux   GOARCH=arm64  go build $(LDFLAGS) -o dist/$(BINARY_NAME)-linux-arm64     ./cmd/kubegram/
	GOOS=windows GOARCH=amd64  go build $(LDFLAGS) -o dist/$(BINARY_NAME)-windows-amd64.exe ./cmd/kubegram/

## package: create .tar.gz archives of cross-built binaries
package: cross-build
	cd dist && for f in $(BINARY_NAME)-*; do \
		tar czf "$$f.tar.gz" "$$f" && rm "$$f"; \
	done

docker-build:
	docker build \
		--build-arg VERSION=$(VERSION) \
		--build-arg GIT_COMMIT=$(GIT_COMMIT) \
		--build-arg BUILD_DATE=$(BUILD_DATE) \
		-t kubegram-cli:$(VERSION) .
