// Package server manages the kubegram-server standalone binary lifecycle:
// downloading from GitHub releases, extracting, starting, and stopping.
package server

import (
	"archive/tar"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/kubegram/kubegram-cli/internal/util"
)

const (
	githubRepo  = "kubegram/kubegram"
	pidFileName = "server.pid"
	serverDir   = "server"
	binaryName  = "kubegram-server"
)

// Dir returns ~/.kubegram/server/.
func Dir() (string, error) {
	base, err := util.KubegramDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, serverDir), nil
}

// BinaryPath returns the full path to the installed server binary.
func BinaryPath() (string, error) {
	dir, err := Dir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, binaryName), nil
}

// pidPath returns the path to ~/.kubegram/server.pid.
func pidPath() (string, error) {
	base, err := util.KubegramDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, pidFileName), nil
}

// IsInstalled reports whether the server binary exists in ~/.kubegram/server/.
func IsInstalled() bool {
	p, err := BinaryPath()
	if err != nil {
		return false
	}
	info, err := os.Stat(p)
	return err == nil && !info.IsDir() && info.Mode()&0111 != 0
}

// archiveName returns the tar.gz asset name for the current platform.
func archiveName(version string) (string, error) {
	goos := runtime.GOOS
	goarch := runtime.GOARCH

	var arch string
	switch goarch {
	case "amd64":
		arch = "x64"
	case "arm64":
		arch = "arm64"
	default:
		return "", fmt.Errorf("unsupported architecture: %s", goarch)
	}

	return fmt.Sprintf("kubegram-server_%s_%s-%s.tar.gz", version, goos, arch), nil
}

// githubReleaseAssetURL resolves the download URL for a given version and asset name.
// If version is "latest", it queries the GitHub releases API to get the latest
// kubegram-server release tag.
func githubReleaseAssetURL(version, asset string) (string, error) {
	if version == "latest" {
		tag, err := latestReleaseTag()
		if err != nil {
			return "", err
		}
		version = tag
	}
	// Strip leading "v" from version for the asset filename if present.
	fileVersion := strings.TrimPrefix(version, "v")
	assetWithVersion := strings.Replace(asset, version, fileVersion, 1)
	_ = assetWithVersion
	return fmt.Sprintf(
		"https://github.com/%s/releases/download/kubegram-server/%s/%s",
		githubRepo, version, asset,
	), nil
}

type ghRelease struct {
	TagName string `json:"tag_name"`
}

// latestReleaseTag queries GitHub for the latest release tagged kubegram-server/*.
func latestReleaseTag() (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	url := fmt.Sprintf("https://api.github.com/repos/%s/releases", githubRepo)
	resp, err := client.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to query GitHub releases: %w", err)
	}
	defer resp.Body.Close()

	var releases []ghRelease
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return "", fmt.Errorf("failed to parse GitHub releases: %w", err)
	}

	for _, r := range releases {
		if strings.HasPrefix(r.TagName, "kubegram-server/") {
			return strings.TrimPrefix(r.TagName, "kubegram-server/"), nil
		}
	}
	return "", fmt.Errorf("no kubegram-server release found on GitHub")
}

// Install downloads and extracts the server binary + public/ assets for the given version.
// version may be "latest" or a specific version string like "v1.0.0-abc1234".
func Install(version string) error {
	archive, err := archiveName(version)
	if err != nil {
		return err
	}

	if version == "latest" {
		version, err = latestReleaseTag()
		if err != nil {
			return err
		}
	}

	url := fmt.Sprintf(
		"https://github.com/%s/releases/download/kubegram-server/%s/%s",
		githubRepo, version, archive,
	)

	fmt.Printf("  Downloading kubegram-server %s...\n", version)

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed: HTTP %d from %s", resp.StatusCode, url)
	}

	dir, err := Dir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create server directory: %w", err)
	}

	if err := extractTarGz(resp.Body, dir); err != nil {
		return fmt.Errorf("extraction failed: %w", err)
	}

	bin, err := BinaryPath()
	if err != nil {
		return err
	}
	if err := os.Chmod(bin, 0755); err != nil {
		return fmt.Errorf("failed to make binary executable: %w", err)
	}

	fmt.Printf("  Installed to %s\n", dir)
	return nil
}

// extractTarGz extracts a .tar.gz stream into destDir.
func extractTarGz(r io.Reader, destDir string) error {
	gz, err := gzip.NewReader(r)
	if err != nil {
		return err
	}
	defer gz.Close()

	tr := tar.NewReader(gz)
	for {
		hdr, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		// Sanitize path to prevent directory traversal.
		target := filepath.Join(destDir, filepath.Clean("/"+hdr.Name)[1:])
		if !strings.HasPrefix(target, filepath.Clean(destDir)+string(os.PathSeparator)) {
			return fmt.Errorf("invalid tar entry: %s", hdr.Name)
		}

		switch hdr.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(target, 0755); err != nil {
				return err
			}
		case tar.TypeReg:
			if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
				return err
			}
			f, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, os.FileMode(hdr.Mode))
			if err != nil {
				return err
			}
			if _, err := io.Copy(f, tr); err != nil {
				f.Close()
				return err
			}
			f.Close()
		}
	}
	return nil
}

// Start launches the server binary as a detached background process.
// env is a list of KEY=VALUE pairs appended to the current environment.
// Returns the PID of the started process.
func Start(port int, env []string) (int, error) {
	bin, err := BinaryPath()
	if err != nil {
		return 0, err
	}
	dir, err := Dir()
	if err != nil {
		return 0, err
	}

	cmd := exec.Command(bin)
	cmd.Dir = dir
	cmd.Env = append(os.Environ(), env...)
	cmd.Stdout = nil
	cmd.Stderr = nil
	// Detach from the parent process group so the server keeps running after
	// the CLI exits.
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}

	if err := cmd.Start(); err != nil {
		return 0, fmt.Errorf("failed to start kubegram-server: %w", err)
	}

	pid := cmd.Process.Pid
	if err := writePID(pid); err != nil {
		// Non-fatal: server is running, we just can't track the PID.
		fmt.Fprintf(os.Stderr, "Warning: could not write PID file: %v\n", err)
	}
	return pid, nil
}

// Stop sends SIGTERM to the running server process and cleans up the PID file.
func Stop() error {
	pid, err := readPID()
	if err != nil {
		return fmt.Errorf("kubegram-server is not running (no PID file found)")
	}

	proc, err := os.FindProcess(pid)
	if err != nil {
		_ = removePID()
		return fmt.Errorf("process %d not found: %w", pid, err)
	}
	if err := proc.Signal(syscall.SIGTERM); err != nil {
		_ = removePID()
		return fmt.Errorf("failed to stop kubegram-server: %w", err)
	}
	_ = removePID()
	return nil
}

// IsRunning reports whether the server process is currently running.
func IsRunning() bool {
	pid, err := readPID()
	if err != nil {
		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	return proc.Signal(syscall.Signal(0)) == nil
}

func writePID(pid int) error {
	if err := util.EnsureKubegramDir(); err != nil {
		return err
	}
	p, err := pidPath()
	if err != nil {
		return err
	}
	return os.WriteFile(p, []byte(strconv.Itoa(pid)), 0644)
}

func readPID() (int, error) {
	p, err := pidPath()
	if err != nil {
		return 0, err
	}
	data, err := os.ReadFile(p)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(strings.TrimSpace(string(data)))
}

func removePID() error {
	p, err := pidPath()
	if err != nil {
		return err
	}
	if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
