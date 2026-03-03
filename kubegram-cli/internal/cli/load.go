package cli

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func newLoadCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "load <design.json>",
		Short: "Load a Kubegram design file into the running server",
		Long: `Read a JSON design file and POST it to the kubegram-server graph CRUD API.

The server must be running (see: kubegram start). Use --api-url to override the
default server address and --api-token if authentication is required.`,
		Args: cobra.ExactArgs(1),
		RunE: runLoad,
	}

	cmd.Flags().String("api-url", "", "kubegram-server base URL (default: http://localhost:<port>)")
	cmd.Flags().String("api-token", "", "authentication token (or set KUBEGRAM_AUTH_API_TOKEN)")

	return cmd
}

func runLoad(cmd *cobra.Command, args []string) error {
	filePath := args[0]

	// Resolve API URL.
	apiURL, _ := cmd.Flags().GetString("api-url")
	if apiURL == "" {
		apiURL = os.Getenv("KUBEGRAM_API_URL")
	}
	if apiURL == "" {
		port := viper.GetInt("server.port")
		apiURL = fmt.Sprintf("http://localhost:%d", port)
	}

	// Resolve auth token.
	apiToken, _ := cmd.Flags().GetString("api-token")
	if apiToken == "" {
		apiToken = os.Getenv("KUBEGRAM_AUTH_API_TOKEN")
	}

	// Read design file.
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read design file %q: %w", filePath, err)
	}

	// Validate JSON.
	var payload interface{}
	if err := json.Unmarshal(data, &payload); err != nil {
		return fmt.Errorf("design file %q is not valid JSON: %w", filePath, err)
	}

	// POST to graph CRUD endpoint.
	endpoint := apiURL + "/api/public/v1/graph/crud"
	fmt.Printf("Loading design from %q → %s\n", filePath, endpoint)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if apiToken != "" {
		req.Header.Set("Authorization", "Bearer "+apiToken)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf(
			"request to %s failed: %w\n  Is the server running? Try: kubegram start",
			endpoint, err,
		)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return fmt.Errorf(
			"server returned 401 Unauthorized — provide an API token via --api-token or KUBEGRAM_AUTH_API_TOKEN",
		)
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("server returned HTTP %d from %s", resp.StatusCode, endpoint)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err == nil {
		if id, ok := result["id"]; ok {
			fmt.Printf("Design loaded successfully. Graph ID: %v\n", id)
			return nil
		}
	}

	fmt.Printf("Design loaded successfully (HTTP %d).\n", resp.StatusCode)
	return nil
}
