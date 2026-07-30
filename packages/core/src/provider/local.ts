/**
 * Local model provider implementation.
 * Supports local models via Ollama, LM Studio, and other OpenAI-compatible local servers.
 *
 * @module provider/local
 */

import {
  BaseProvider,
  ProviderConfig,
  CompletionRequest,
  CompletionResponse,
  ProviderCapabilities,
  ChatMessage,
} from './base.js';

const DEFAULT_MODEL = 'llama3';

const LOCAL_CAPABILITIES: ProviderCapabilities = {
  maxContextTokens: 32768,
  maxOutputTokens: 4096,
  supportsFunctionCalling: false,
  supportsStreaming: true,
  supportsVision: false,
};

/**
 * Local model provider.
 * Connects to local LLM servers with OpenAI-compatible API.
 */
export class LocalProvider extends BaseProvider {
  readonly id = 'local';
  readonly name = 'Local Model';
  readonly capabilities = LOCAL_CAPABILITIES;

  private model: string;

  constructor(config: ProviderConfig = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434/v1';
    this.model = config.model || DEFAULT_MODEL;
  }

  protected requiresApiKey(): boolean {
    return false;
  }

  /**
   * Send a chat completion request to a local model
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local model error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: ChatMessage; finish_reason: string }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
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

  async countTokens(text: string): Promise<number> {
    return this.estimateTokens(text);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available local models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return [];
      const data = (await response.json()) as { data?: Array<{ id: string }> };
      return (data.data || []).map((m: { id: string }) => m.id);
    } catch {
      return [];
    }
  }
}
