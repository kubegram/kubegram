package util

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

const (
	DefaultOperatorNamespace = "default"
	DefaultOperatorService   = "kubegram-operator"
	OperatorContainerPort    = 8080
)

type PortForwarder struct {
	client       *kubernetes.Clientset
	localPort    int
	namespace    string
	podName      string
	cmd          *exec.Cmd
	stopCh       chan struct{}
	forwardedURL string
}

func NewPortForwarder(client *kubernetes.Clientset, localPort int, namespace string) *PortForwarder {
	return &PortForwarder{
		client:    client,
		localPort: localPort,
		namespace: namespace,
		stopCh:    make(chan struct{}, 1),
	}
}

func (pf *PortForwarder) Start(ctx context.Context) error {
	pods, err := pf.client.CoreV1().Pods(pf.namespace).List(ctx, metav1.ListOptions{
		LabelSelector: "app.kubernetes.io/name=kubegram-operator",
	})
	if err != nil {
		return fmt.Errorf("failed to list operator pods: %w", err)
	}

	if len(pods.Items) == 0 {
		pods, err = pf.client.CoreV1().Pods(pf.namespace).List(ctx, metav1.ListOptions{
			LabelSelector: "app=kubegram-operator",
		})
		if err != nil {
			return fmt.Errorf("failed to list operator pods: %w", err)
		}
		if len(pods.Items) == 0 {
			return fmt.Errorf("no operator pods found in namespace %s. Make sure the operator is installed with 'kubegram operator install'", pf.namespace)
		}
	}

	pf.podName = pods.Items[0].Name

	kubectlPath, err := exec.LookPath("kubectl")
	if err != nil {
		return fmt.Errorf("kubectl not found in PATH: %w", err)
	}

	pf.cmd = exec.Command(kubectlPath, "port-forward", "-n", pf.namespace, pf.podName, fmt.Sprintf("%d:%d", pf.localPort, OperatorContainerPort))
	pf.cmd.Stdout = os.Stdout
	pf.cmd.Stderr = os.Stderr

	if err := pf.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start port-forward: %w", err)
	}

	time.Sleep(2 * time.Second)

	if pf.cmd.Process == nil {
		return fmt.Errorf("port-forward process failed to start")
	}

	pf.forwardedURL = fmt.Sprintf("http://localhost:%d", pf.localPort)
	return nil
}

func (pf *PortForwarder) Stop() error {
	if pf.cmd != nil && pf.cmd.Process != nil {
		if err := pf.cmd.Process.Kill(); err != nil {
			return fmt.Errorf("failed to stop port-forward: %w", err)
		}
		pf.cmd.Wait()
	}
	close(pf.stopCh)
	return nil
}

func (pf *PortForwarder) GetURL() string {
	return pf.forwardedURL
}

func (pf *PortForwarder) GetPID() int {
	if pf.cmd != nil && pf.cmd.Process != nil {
		return pf.cmd.Process.Pid
	}
	return 0
}

func CreatePortForward(ctx context.Context, namespace string, localPort int) (*PortForwarder, error) {
	restConfig, err := GetKubeRestConfig("")
	if err != nil {
		return nil, fmt.Errorf("failed to get kubeconfig: %w", err)
	}

	client, err := kubernetes.NewForConfig(restConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	if namespace == "" {
		namespace = GetOperatorNamespace()
	}

	pf := NewPortForwarder(client, localPort, namespace)
	if err := pf.Start(ctx); err != nil {
		return nil, err
	}

	return pf, nil
}

func GetKubeRestConfig(kubeContext string) (*rest.Config, error) {
	loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
	if home, err := os.UserHomeDir(); err == nil {
		loadingRules.ExplicitPath = filepath.Join(home, ".kube", "config")
	}

	overrides := &clientcmd.ConfigOverrides{}
	if kubeContext != "" {
		overrides.CurrentContext = kubeContext
	}

	cfg, err := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(
		loadingRules,
		overrides,
	).ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("unable to load kubeconfig: %w", err)
	}
	return cfg, nil
}

func GetOperatorNamespace() string {
	if ns := os.Getenv("KUBEGRAM_OPERATOR_NAMESPACE"); ns != "" {
		return ns
	}
	return DefaultOperatorNamespace
}

func GetOperatorService() string {
	if svc := os.Getenv("KUBEGRAM_OPERATOR_SERVICE"); svc != "" {
		return svc
	}
	return DefaultOperatorService
}

func WaitForPodReady(ctx context.Context, namespace, labelSelector string, timeout time.Duration) error {
	client, err := GetK8sClient()
	if err != nil {
		return err
	}

	watch, err := client.CoreV1().Pods(namespace).Watch(ctx, metav1.ListOptions{
		LabelSelector: labelSelector,
		Watch:         true,
	})
	if err != nil {
		return fmt.Errorf("failed to watch pods: %w", err)
	}
	defer watch.Stop()

	ch := watch.ResultChan()
	endTime := time.Now().Add(timeout)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case event := <-ch:
			if event.Type == "ADDED" || event.Type == "MODIFIED" {
				pod := event.Object.(*corev1.Pod)
				for _, cond := range pod.Status.Conditions {
					if cond.Type == corev1.PodReady && cond.Status == corev1.ConditionTrue {
						return nil
					}
				}
			}
		}

		if time.Now().After(endTime) {
			return fmt.Errorf("timeout waiting for pod to be ready")
		}
	}
}

func GetK8sClient() (*kubernetes.Clientset, error) {
	restConfig, err := GetKubeRestConfig("")
	if err != nil {
		return nil, err
	}
	return kubernetes.NewForConfig(restConfig)
}

func IsOperatorInstalled(ctx context.Context, namespace string) (bool, error) {
	client, err := GetK8sClient()
	if err != nil {
		return false, err
	}

	if namespace == "" {
		namespace = GetOperatorNamespace()
	}

	deployments, err := client.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: "app.kubernetes.io/name=kubegram-operator",
	})
	if err != nil {
		return false, err
	}

	if len(deployments.Items) == 0 {
		deployments, err = client.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{
			LabelSelector: "app=kubegram-operator",
		})
		if err != nil {
			return false, err
		}
	}

	return len(deployments.Items) > 0, nil
}
