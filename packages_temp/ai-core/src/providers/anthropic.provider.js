const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');

class AnthropicProvider {
  constructor(config = {}) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  supportsVision() {
    return true;
  }

  async chat(messages, options = {}) {
    const model = options.model || 'claude-3-opus-20240229';
    const maxTokens = options.max_tokens || 1024;

    const response = await this.client.messages.create({
      model: model,
      max_tokens: maxTokens,
      messages: messages,
    });

    return response.content[0]?.text;
  }

  async analyzeImage(imagePath, prompt, options = {}) {
    const model = options.model || 'claude-3-5-sonnet-20241022';
    const maxTokens = options.max_tokens || 4096;

    const imageData = await this.readImageFile(imagePath);

    const response = await this.client.messages.create({
      model: model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: imageData },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    return response.content[0]?.text;
  }

  async readImageFile(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mediaTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const mediaType = mediaTypeMap[ext] || 'image/jpeg';
    const base64Data = fileBuffer.toString('base64');

    return {
      type: 'base64',
      media_type: mediaType,
      data: base64Data,
    };
  }
}

module.exports = AnthropicProvider;
