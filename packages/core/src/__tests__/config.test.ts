import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigLoader, DEFAULT_CONFIG } from '../config/index.js';

describe('ConfigLoader', () => {
  let loader: ConfigLoader;

  beforeEach(() => {
    loader = new ConfigLoader();
  });

  it('should have default config', () => {
    const config = loader.getConfig();
    expect(config.version).toBe('1.0.0');
    expect(config.defaultProvider).toBe('openai');
    expect(config.providers.openai).toBeDefined();
  });

  it('should load environment variables', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.CODEMIND_PROVIDER = 'anthropic';
    
    loader.loadFromEnv();
    const config = loader.getConfig();
    
    expect(config.providers.openai.apiKey).toBe('test-key');
    expect(config.defaultProvider).toBe('anthropic');
    
    delete process.env.OPENAI_API_KEY;
    delete process.env.CODEMIND_PROVIDER;
  });

  it('should get provider config', () => {
    const providerConfig = loader.getProviderConfig('openai');
    expect(providerConfig.model).toBeDefined();
  });

  it('should merge partial config', () => {
    loader.setConfig({ defaultProvider: 'local' });
    const config = loader.getConfig();
    expect(config.defaultProvider).toBe('local');
    // other settings should be preserved
    expect(config.providers.openai).toBeDefined();
  });
});
