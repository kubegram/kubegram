// Package compose wraps the docker compose CLI for orchestrating local Kubegram services.
package compose

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

const composeFileName = "docker-compose.yml"

// FindComposeFile walks up from the current working directory looking for docker-compose.yml.
// This mirrors the heuristic git uses to find .git — works from any subdirectory in the repo.
func FindComposeFile() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("unable to determine working directory: %w", err)
	}

	for {
		candidate := filepath.Join(dir, composeFileName)
		if _, statErr := os.Stat(candidate); statErr == nil {
			return candidate, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf(
		"%s not found in the current directory or any parent; use --compose-file to specify its location",
		composeFileName,
	)
}

// Options configures docker compose operations.
type Options struct {
	// ComposeFile is an explicit path to docker-compose.yml; if empty FindComposeFile is used.
	ComposeFile string
}

func resolveFile(opts Options) (string, error) {
	if opts.ComposeFile != "" {
		return opts.ComposeFile, nil
	}
	return FindComposeFile()
}

// CheckDaemon verifies the Docker daemon is reachable.
func CheckDaemon(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, "docker", "info", "--format", "{{.ServerVersion}}")
	cmd.Stdout = nil
	cmd.Stderr = nil
	if err := cmd.Run(); err != nil {
		return fmt.Errorf(
			"Docker daemon is not running — is Docker Desktop open?\n  underlying error: %w", err,
		)
	}
	return nil
}

// Up runs `docker compose -f <file> up -d --build`.
func Up(ctx context.Context, opts Options) error {
	file, err := resolveFile(opts)
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", file, "up", "-d", "--build")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker compose up failed: %w", err)
	}
	return nil
}

// Down runs `docker compose -f <file> down`.
func Down(ctx context.Context, opts Options) error {
	file, err := resolveFile(opts)
	if err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", file, "down")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("docker compose down failed: %w", err)
	}
	return nil
}
