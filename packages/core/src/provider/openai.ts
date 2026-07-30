/**
 * OpenAI provider implementation.
 * Supports GPT-4, GPT-4o, GPT-3.5, and compatible APIs.
 *
 * @module provider/openai
 */

import {
  BaseProvider,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  ProviderCapabilities,
  ChatMessage,
  TokenUsage,
} from './base.js';

/** Default OpenAI models */
const DEFAULT_MODEL = 'gpt-4o';

/** OpenAI provider capabilities */
const OPENAI_CAPABILITIES: ProviderCapabilities = {
  maxContextTokens: 128000,
  maxOutputTokens: 4096,
  supportsFunctionCalling: true,
  supportsStreaming: true,
  supportsVision: true,
};

/**
 * OpenAI API provider.
 * Connects to OpenAI's chat completions API.
 */
export class OpenAIProvider extends BaseProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly capabilities = OPENAI_CAPABILITIES;

  private model: string;

  constructor(config: ProviderConfig = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || DEFAULT_MODEL;
  }

  /**
   * Send a chat completion request to OpenAI
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateConfig();

    const body = {
      model: request.model || this.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.maxTokens,
      top_p: request.topP,
      stop: request.stopSequences,
      stream: false,
      ...request.extra,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: ChatMessage; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    };

    const choice = data.choices[0];
    return {
      message: choice.message,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      model: data.model,
      finishReason: choice.finish_reason as CompletionResponse['finishReason'],
    };
  }

  /**
   * Count tokens using tiktoken approximation
   */
  async countTokens(text: string): Promise<number> {
    return this.estimateTokens(text);
  }

  /**
   * Check if the OpenAI provider is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.buildHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
