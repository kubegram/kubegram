// Learn more at https://docs.boundaryml.com/docs/snippets/clients/overview

client<llm> ClaudeClient {
  provider anthropic
  options {
    model "claude-sonnet-4-5-latest"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 8192
  }
}

client<llm> ClaudeHaikuClient {
  provider anthropic
  options {
    model "claude-haiku-4-5-20251001"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 2048
  }
}

client<llm> ClaudeOpusClient {
  provider anthropic
  options {
    model "claude-opus-4-5-latest"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 16384
  }
}

client<llm> ClaudeSonnetClient {
  provider anthropic
  options {
    model "claude-sonnet-4-5-latest"
    api_key env.ANTHROPIC_API_KEY
    max_tokens 8192
  }
}

client<llm> OpenAIClient {
  provider openai
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
    max_tokens 8192
  }
}

client<llm> GeminiClient {
  provider google-ai
  options {
    model "gemini-2.0-flash"
    api_key env.GOOGLE_API_KEY
    max_tokens 8192
  }
}

client<llm> DeepSeekClient {
  provider openai-generic
  options {
    model "deepseek-chat"
    api_key env.DEEPSEEK_API_KEY
    base_url "https://api.deepseek.com/v1"
    max_tokens 8192
  }
}

client<llm> KimiK2Client {
  provider openai-generic
  options {
    model "kimi-k2-0713"
    api_key env.MOONSHOT_API_KEY
    base_url "https://api.moonshot.cn/v1"
    max_tokens 8192
  }
}

client<llm> KimiK2FlashClient {
  provider openai-generic
  options {
    model "kimi-k2-0713"
    api_key env.MOONSHOT_API_KEY
    base_url "https://api.moonshot.cn/v1"
    max_tokens 2048
  }
}

// Fallback chain: tries Claude first, then OpenAI, Gemini, DeepSeek, Kimi K2
// https://docs.boundaryml.com/docs/snippets/clients/fallback
client<llm> KubegramFallback {
  provider fallback
  options {
    strategy [ClaudeClient, OpenAIClient, GeminiClient, DeepSeekClient, KimiK2Client]
  }
}
