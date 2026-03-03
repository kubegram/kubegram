package util

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
)

const (
	PIDFileName = "mcp.pid"
	BinDirName  = "bin"
)

func KubegramDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".kubegram"), nil
}

func PIDFilePath() (string, error) {
	dir, err := KubegramDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, PIDFileName), nil
}

func EnsureKubegramDir() error {
	dir, err := KubegramDir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create kubegram directory: %w", err)
	}
	return nil
}

func WritePID(pid int) error {
	if err := EnsureKubegramDir(); err != nil {
		return err
	}
	pidPath, err := PIDFilePath()
	if err != nil {
		return err
	}
	pidStr := strconv.Itoa(pid)
	if err := os.WriteFile(pidPath, []byte(pidStr), 0644); err != nil {
		return fmt.Errorf("failed to write PID file: %w", err)
	}
	return nil
}

func ReadPID() (int, error) {
	pidPath, err := PIDFilePath()
	if err != nil {
		return 0, err
	}
	data, err := os.ReadFile(pidPath)
	if err != nil {
		return 0, fmt.Errorf("MCP server not running (no PID file found)")
	}
	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return 0, fmt.Errorf("invalid PID file: %w", err)
	}
	return pid, nil
}

func RemovePIDFile() error {
	pidPath, err := PIDFilePath()
	if err != nil {
		return err
	}
	if err := os.Remove(pidPath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to remove PID file: %w", err)
	}
	return nil
}

func FindProcess(pid int) (*os.Process, error) {
	proc, err := os.FindProcess(pid)
	if err != nil {
		return nil, fmt.Errorf("process %d not found: %w", pid, err)
	}
	return proc, nil
}

func IsProcessRunning(pid int) bool {
	proc, err := FindProcess(pid)
	if err != nil {
		return false
	}
	if err := proc.Signal(syscall.Signal(0)); err != nil {
		return false
	}
	return true
}

func KillProcess(pid int) error {
	proc, err := FindProcess(pid)
	if err != nil {
		return err
	}
	if err := proc.Signal(syscall.SIGTERM); err != nil {
		return fmt.Errorf("failed to stop MCP server: %w", err)
	}
	return nil
}

func FindOperatorBinary() (string, error) {
	binNames := []string{
		"kubegram-operator",
		"manager",
	}

	pathEnv := os.Getenv("PATH")
	pathDirs := strings.Split(pathEnv, string(os.PathListSeparator))

	for _, name := range binNames {
		for _, dir := range pathDirs {
			if dir == "" {
				continue
			}
			candidate := filepath.Join(dir, name)
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() && info.Mode()&0111 != 0 {
				return candidate, nil
			}
		}
	}

	kubegramDir, err := KubegramDir()
	if err != nil {
		return "", fmt.Errorf("kubegram-operator binary not found. Please ensure it is in your PATH or at ~/.kubegram/bin/")
	}

	if info, err := os.Stat(filepath.Join(kubegramDir, BinDirName, "kubegram-operator")); err == nil && !info.IsDir() && info.Mode()&0111 != 0 {
		return filepath.Join(kubegramDir, BinDirName, "kubegram-operator"), nil
	}

	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("kubegram-operator binary not found. Please ensure it is in your PATH or at ~/.kubegram/bin/")
	}

	if info, err := os.Stat(filepath.Join(cwd, "bin", "kubegram-operator")); err == nil && !info.IsDir() && info.Mode()&0111 != 0 {
		return filepath.Join(cwd, "bin", "kubegram-operator"), nil
	}

	return "", fmt.Errorf("kubegram-operator binary not found. Please ensure it is in your PATH or at ~/.kubegram/bin/")
}

func GetOperatorBinaryDir() (string, error) {
	operatorBin, err := FindOperatorBinary()
	if err != nil {
		return "", err
	}
	return filepath.Dir(operatorBin), nil
}

func RunCommand(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd
}
