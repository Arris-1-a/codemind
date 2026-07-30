/**
 * DeepSeek provider implementation.
 * Supports DeepSeek-V3 and DeepSeek-R1 models.
 *
 * @module provider/deepseek
 */

import {
  BaseProvider,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  ProviderCapabilities,
  ChatMessage,
} from './base.js';

const DEFAULT_MODEL = 'deepseek-chat';

const DEEPSEEK_CAPABILITIES: ProviderCapabilities = {
  maxContextTokens: 128000,
  maxOutputTokens: 8192,
  supportsFunctionCalling: false,
  supportsStreaming: true,
  supportsVision: false,
};

/**
 * DeepSeek API provider.
 * Communicates with the DeepSeek chat completions API (OpenAI-compatible).
 */
export class DeepSeekProvider extends BaseProvider {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek';
  readonly capabilities = DEEPSEEK_CAPABILITIES;

  private model: string;

  constructor(config: ProviderConfig = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
    this.model = config.model || DEFAULT_MODEL;
  }

  /**
   * Send a chat completion request to DeepSeek
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
      throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: ChatMessage; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    };

    const choice = data.choices?.[0];
    if (!choice?.message) {
      throw new Error(`DeepSeek API returned an empty response`);
    }

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

  async countTokens(text: string): Promise<number> {
    return this.estimateTokens(text);
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
