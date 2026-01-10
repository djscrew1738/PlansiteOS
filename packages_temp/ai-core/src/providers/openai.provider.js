const OpenAI = require('openai');

class OpenAIProvider {
  constructor(config = {}) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  supportsVision() {
    return false; // Or true if you implement it
  }

  async chat(messages, options = {}) {
    // Implementation for OpenAI chat
    throw new Error('Not implemented');
  }

  async analyzeImage(imagePath, prompt, options = {}) {
    // Implementation for OpenAI vision
    throw new Error('Not implemented');
  }
}

module.exports = OpenAIProvider;
