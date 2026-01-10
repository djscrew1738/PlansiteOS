/**
 * AI Core - Provider Abstraction Layer
 *
 * Unified interface for multiple AI providers (Anthropic, OpenAI, Gemini)
 */

const AnthropicProvider = require('./providers/anthropic.provider');
const OpenAIProvider = require('./providers/openai.provider');

class AIClient {
  constructor(config = {}) {
    this.config = config;
    this.providers = new Map();

    // Initialize providers based on available API keys
    if (config.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider({
        apiKey: config.anthropicApiKey || process.env.ANTHROPIC_API_KEY
      }));
    }

    if (config.openaiApiKey || process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider({
        apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY
      }));
    }

    // Set default provider
    this.defaultProvider = config.defaultProvider || 'anthropic';
  }

  /**
   * Send a message to AI provider
   */
  async chat(messages, options = {}) {
    const provider = options.provider || this.defaultProvider;
    const client = this.providers.get(provider);

    if (!client) {
      throw new Error(`Provider '${provider}' not initialized`);
    }

    return await client.chat(messages, options);
  }

  /**
   * Analyze an image with vision AI
   */
  async analyzeImage(imagePath, prompt, options = {}) {
    const provider = options.provider || this.defaultProvider;
    const client = this.providers.get(provider);

    if (!client) {
      throw new Error(`Provider '${provider}' not initialized`);
    }

    if (!client.supportsVision()) {
      throw new Error(`Provider '${provider}' does not support vision`);
    }

    return await client.analyzeImage(imagePath, prompt, options);
  }

  /**
   * Get available providers
   */
  getAvailableProviders() {
    return Array.from(this.providers.keys());
  }
}

module.exports = { AIClient };
