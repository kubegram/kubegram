package config

import "github.com/spf13/viper"

// Config mirrors the kubegram.yaml structure.
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Compose  ComposeConfig  `mapstructure:"compose"`
	Operator OperatorConfig `mapstructure:"operator"`
	LLM      LLMConfig      `mapstructure:"llm"`
	Auth     AuthConfig     `mapstructure:"auth"`
	MCP      MCPConfig      `mapstructure:"mcp"`
}

type ServerConfig struct {
	Port     int    `mapstructure:"port"`
	LogLevel string `mapstructure:"logLevel"`
}

type ComposeConfig struct {
	File string `mapstructure:"file"`
}

type OperatorConfig struct {
	ChartPath string            `mapstructure:"chartPath"`
	Namespace string            `mapstructure:"namespace"`
	Values    map[string]string `mapstructure:"values"`
}

type LLMConfig struct {
	AnthropicToken string `mapstructure:"anthropicToken"`
	OpenAIToken    string `mapstructure:"openAIToken"`
	GoogleToken    string `mapstructure:"googleToken"`
	DeepSeekToken  string `mapstructure:"deepSeekToken"`
}

type AuthConfig struct {
	AdminUsername string `mapstructure:"adminUsername"`
	AdminPassword string `mapstructure:"adminPassword"`
}

type MCPConfig struct {
	Token string `mapstructure:"token"`
	Port  int    `mapstructure:"port"`
	Mode  string `mapstructure:"mode"`
}

// SetDefaults registers sensible defaults with Viper.
func SetDefaults() {
	viper.SetDefault("server.port", 8090)
	viper.SetDefault("server.logLevel", "info")
	viper.SetDefault("operator.namespace", "default")
	viper.SetDefault("mcp.port", 8080)
	viper.SetDefault("mcp.mode", "local")
}

// Load unmarshals the current Viper state into a Config struct.
func Load() (*Config, error) {
	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
