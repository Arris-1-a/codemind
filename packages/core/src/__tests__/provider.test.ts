import { describe, it, expect } from 'vitest';
import {
  OpenAIProvider,
  AnthropicProvider,
  DeepSeekProvider,
  LocalProvider,
  createProvider,
  listProviders,
  registerProvider,
  BaseProvider,
} from '../provider/index.js';

describe('Provider creation', () => {
  it('should create OpenAI provider', () => {
    const provider = createProvider('openai', { apiKey: 'test-key' });
    expect(provider.id).toBe('openai');
    expect(provider.name).toBe('OpenAI');
  });

  it('should create Anthropic provider', () => {
    const provider = createProvider('anthropic', { apiKey: 'test-key' });
    expect(provider.id).toBe('anthropic');
  });

  it('should create DeepSeek provider', () => {
    const provider = createProvider('deepseek', { apiKey: 'test-key' });
    expect(provider.id).toBe('deepseek');
  });

  it('should create Local provider', () => {
    const provider = createProvider('local');
    expect(provider.id).toBe('local');
  });

  it('should throw for unknown provider', () => {
    expect(() => createProvider('unknown')).toThrow('Unknown provider');
  });

  it('should list all providers', () => {
    const providers = listProviders();
    expect(providers).toContain('openai');
    expect(providers).toContain('anthropic');
    expect(providers).toContain('deepseek');
    expect(providers).toContain('local');
  });

  it('should register custom provider', () => {
    class CustomProvider extends BaseProvider {
      id = 'custom';
      name = 'Custom';
      capabilities = {
        maxContextTokens: 1000,
        maxOutputTokens: 500,
        supportsFunctionCalling: false,
        supportsStreaming: false,
        supportsVision: false,
      };
      async complete() {
        return { message: { role: 'assistant', content: 'ok' }, model: 'custom' };
      }
      async countTokens(text: string) { return text.length; }
      async isAvailable() { return true; }
    }

    registerProvider('custom', CustomProvider);
    const provider = createProvider('custom');
    expect(provider.id).toBe('custom');
  });
});

describe('Provider capabilities', () => {
  it('OpenAI should support function calling', () => {
    const provider = new OpenAIProvider({ apiKey: 'test' });
    expect(provider.capabilities.supportsFunctionCalling).toBe(true);
  });

  it('Local provider should not require API key', () => {
    const provider = new LocalProvider();
    expect(provider.capabilities.maxContextTokens).toBeGreaterThan(0);
  });
});
