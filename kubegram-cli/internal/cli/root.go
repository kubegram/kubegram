// Package cli defines all Cobra commands for the kubegram CLI.
package cli

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/kubegram/kubegram-cli/internal/config"
)

var cfgFile string

var rootCmd = &cobra.Command{
	Use:   "kubegram",
	Short: "kubegram — AI-driven Kubernetes infrastructure CLI",
	Long: `kubegram is the command-line interface for the Kubegram platform.

It lets you start the local development runtime, load architecture designs,
and install the Kubegram operator on Kubernetes clusters.

Documentation: https://kubegram.com/docs`,
	SilenceUsage: true,
}

// Execute is the entry point called from main.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default: ./kubegram.yaml)")
	rootCmd.PersistentFlags().String("log-level", "info", "log level: debug, info, warn, error")
	_ = viper.BindPFlag("server.logLevel", rootCmd.PersistentFlags().Lookup("log-level"))

	config.SetDefaults()

	rootCmd.AddCommand(newVersionCmd())
	rootCmd.AddCommand(newStartCmd())
	rootCmd.AddCommand(newLoadCmd())
	rootCmd.AddCommand(newMCPCmd())
	rootCmd.AddCommand(newClusterCmd())
	rootCmd.AddCommand(newOperatorCmd())
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.SetConfigName("kubegram")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")
		viper.AddConfigPath("$HOME")
	}

	// KUBEGRAM_SERVER_PORT overrides server.port, etc.
	viper.SetEnvPrefix("KUBEGRAM")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			fmt.Fprintf(os.Stderr, "Warning: could not read config file: %v\n", err)
		}
	}
}
