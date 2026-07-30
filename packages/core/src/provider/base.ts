/**
 * Base provider interface and abstract class for AI model providers.
 * All providers (OpenAI, Anthropic, DeepSeek, local) implement this interface.
 *
 * @module provider/base
 */

/** Message role types */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function';

/** A single chat message */
export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

/** Completion request parameters */
export interface CompletionRequest {
  /** The model identifier to use */
  model: string;
  /** Conversation messages */
  messages: ChatMessage[];
  /** Temperature (0-2), controls randomness */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top-p nucleus sampling */
  topP?: number;
  /** Sequences that stop generation */
  stopSequences?: string[];
  /** Whether to stream the response */
  stream?: boolean;
  /** Additional provider-specific options */
  extra?: Record<string, unknown>;
}

/** Completion response */
export interface CompletionResponse {
  /** The generated completion message */
  message: ChatMessage;
  /** Token usage statistics */
  usage?: TokenUsage;
  /** The model used for this completion */
  model: string;
  /** Reason the generation stopped */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error';
}

/** Token usage information */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Streaming chunk of a completion */
export interface CompletionChunk {
  /** Delta content from this chunk */
  content: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Finish reason (only on final chunk) */
  finishReason?: string;
}

/** Provider capabilities */
export interface ProviderCapabilities {
  /** Maximum context window size in tokens */
  maxContextTokens: number;
  /** Maximum output tokens */
  maxOutputTokens: number;
  /** Whether function calling is supported */
  supportsFunctionCalling: boolean;
  /** Whether streaming is supported */
  supportsStreaming: boolean;
  /** Whether image input is supported */
  supportsVision: boolean;
}

/** AI Provider interface */
export interface AIProvider {
  /** Unique provider identifier */
  readonly id: string;
  /** Human-readable provider name */
  readonly name: string;
  /** Provider capabilities */
  readonly capabilities: ProviderCapabilities;

  /**
   * Send a chat completion request
   * @param request - The completion request parameters
   * @returns The completion response
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Stream a chat completion
   * @param request - The completion request parameters
   * @returns An async iterable of completion chunks
   */
  streamComplete?(request: CompletionRequest): AsyncIterable<CompletionChunk>;

  /**
   * Count tokens in the given text
   * @param text - The text to tokenize
   * @returns The token count
   */
  countTokens(text: string): Promise<number>;

  /**
   * Check if the provider is available and configured
   * @returns True if provider is ready for use
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Abstract base class for AI providers.
 * Provides common functionality that specific providers can extend.
 */
export abstract class BaseProvider implements AIProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: ProviderCapabilities;

  protected apiKey?: string;
  protected baseUrl?: string;

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
  }

  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  abstract countTokens(text: string): Promise<number>;
  abstract isAvailable(): Promise<boolean>;

  /**
   * Validate that the provider configuration is sufficient
   * @throws Error if configuration is missing or invalid
   */
  protected validateConfig(): void {
    if (!this.apiKey && this.requiresApiKey()) {
      throw new Error(
        `Provider "${this.id}" requires an API key. Set it via config or the ` +
        `CODEMIND_${this.id.toUpperCase()}_API_KEY environment variable.`
      );
    }
  }

  /**
   * Whether this provider requires an API key
   */
  protected requiresApiKey(): boolean {
    return true;
  }

  /**
   * Build headers for the HTTP request
   */
  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Estimate token count for text (simple approximation: ~4 chars per token)
   * Providers should override with accurate tokenizers
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/** Configuration for a provider */
export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  extra?: Record<string, unknown>;
}

/** Provider factory type */
export type ProviderFactory = (config: ProviderConfig) => AIProvider;
