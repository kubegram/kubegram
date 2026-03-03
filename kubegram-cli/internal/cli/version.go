package cli

import (
	"fmt"
	"runtime"

	"github.com/spf13/cobra"
)

// Version metadata injected at build time via -ldflags.
var (
	Version   = "dev"
	Commit    = "unknown"
	BuildDate = "unknown"
)

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print kubegram version",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("kubegram version %s (commit: %s, built: %s, go: %s)\n",
				Version, Commit, BuildDate, runtime.Version())
		},
	}
}
