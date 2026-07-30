/**
 * Anthropic Claude provider implementation.
 * Supports Claude 3 Opus, Sonnet, Haiku models.
 *
 * @module provider/anthropic
 */

import {
  BaseProvider,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  ProviderCapabilities,
  ChatMessage,
} from './base.js';

/** Default Anthropic model */
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/** Anthropic provider capabilities */
const ANTHROPIC_CAPABILITIES: ProviderCapabilities = {
  maxContextTokens: 200000,
  maxOutputTokens: 4096,
  supportsFunctionCalling: true,
  supportsStreaming: true,
  supportsVision: true,
};

/**
 * Anthropic Claude API provider.
 * Communicates with the Anthropic Messages API.
 */
export class AnthropicProvider extends BaseProvider {
  readonly id = 'anthropic';
  readonly name = 'Anthropic Claude';
  readonly capabilities = ANTHROPIC_CAPABILITIES;

  private model: string;
  private anthropicVersion: string;

  constructor(config: ProviderConfig = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.model = config.model || DEFAULT_MODEL;
    this.anthropicVersion = '2023-06-01';
  }

  /**
   * Convert internal messages to Anthropic format
   */
  private convertMessages(
    messages: ChatMessage[],
  ): { system?: string; messages: Array<{ role: string; content: string }> } {
    const systemMsg = messages.find((m) => m.role === 'system');
    const rest = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    return {
      system: systemMsg?.content,
      messages: rest,
    };
  }

  /**
   * Send a chat completion request to Anthropic
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateConfig();

    const { system, messages } = this.convertMessages(request.messages);

    const body = {
      model: request.model || this.model,
      system: system,
      messages: messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      top_p: request.topP,
      stop_sequences: request.stopSequences,
      ...request.extra,
    };

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(),
        'anthropic-version': this.anthropicVersion,
        'x-api-key': this.apiKey || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      content: Array<{ text: string; type: string }>;
      model: string;
      stop_reason: string;
      usage: { input_tokens: number; output_tokens: number };
    };

    const textContent = data.content.find((c) => c.type === 'text')?.text || '';

    return {
      message: { role: 'assistant', content: textContent },
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
      model: data.model,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason as CompletionResponse['finishReason'],
    };
  }

  /**
   * Count tokens for Anthropic models (approximation)
   */
  async countTokens(text: string): Promise<number> {
    return this.estimateTokens(text);
  }

  /**
   * Check if Anthropic provider is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
