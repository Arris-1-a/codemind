/**
 * Provider module — exports all AI provider implementations.
 *
 * @module provider
 */

export { AIProvider, BaseProvider, ProviderConfig, ProviderFactory } from './base.js';
export type {
  ChatMessage,
  MessageRole,
  CompletionRequest,
  CompletionResponse,
  TokenUsage,
  CompletionChunk,
  ProviderCapabilities,
} from './base.js';
export { OpenAIProvider } from './openai.js';
export { AnthropicProvider } from './anthropic.js';
export { DeepSeekProvider } from './deepseek.js';
export { LocalProvider } from './local.js';

import type { AIProvider, ProviderConfig } from './base.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { DeepSeekProvider } from './deepseek.js';
import { LocalProvider } from './local.js';

/** Provider registry map */
const PROVIDER_REGISTRY: Record<string, new (config?: ProviderConfig) => AIProvider> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  deepseek: DeepSeekProvider,
  local: LocalProvider,
};

/**
 * Create a provider instance by ID
 * @param providerId - The provider identifier (openai, anthropic, deepseek, local)
 * @param config - Provider configuration
 * @returns An AI provider instance
 */
export function createProvider(providerId: string, config: ProviderConfig = {}): AIProvider {
  const ProviderClass = PROVIDER_REGISTRY[providerId];
  if (!ProviderClass) {
    throw new Error(
      `Unknown provider: "${providerId}". Available providers: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`,
    );
  }
  return new ProviderClass(config);
}

/**
 * List all available provider IDs
 */
export function listProviders(): string[] {
  return Object.keys(PROVIDER_REGISTRY);
}

/**
 * Register a custom provider
 * @param id - Unique provider ID
 * @param providerClass - Provider constructor
 */
export function registerProvider(
  id: string,
  providerClass: new (config?: ProviderConfig) => AIProvider,
): void {
  PROVIDER_REGISTRY[id] = providerClass;
}
