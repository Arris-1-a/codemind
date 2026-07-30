/**
 * @codemind/core — AI-Powered Development Assistant Core Engine
 *
 * Provides the foundation for all codemind packages:
 * - Multi-provider AI abstraction (OpenAI, Anthropic, DeepSeek, local)
 * - Processing pipeline (Context → Analyze → Transform → Output)
 * - Configuration management
 *
 * @packageDocumentation
 */

// Provider
export {
  AIProvider,
  BaseProvider,
  OpenAIProvider,
  AnthropicProvider,
  DeepSeekProvider,
  LocalProvider,
  createProvider,
  listProviders,
  registerProvider,
} from './provider/index.js';
export type {
  ProviderConfig,
  ProviderCapabilities,
  ProviderFactory,
  ChatMessage,
  MessageRole,
  CompletionRequest,
  CompletionResponse,
  TokenUsage,
  CompletionChunk,
} from './provider/index.js';

// Pipeline
export {
  Pipeline,
  ContextManager,
  Analyzer,
  Transformer,
  OutputHandler,
} from './pipeline/index.js';
export type {
  PipelineConfig,
  PipelineResult,
  ContextItem,
  ContextType,
  ContextMetadata,
  ContextOptions,
  ContextProvider,
  AnalyzeOptions,
  AnalyzeResult,
  TransformFn,
  TransformOptions,
  OutputFormat,
  OutputDestination,
  OutputOptions,
  OutputResult,
} from './pipeline/index.js';

// Config
export { ConfigLoader, DEFAULT_CONFIG } from './config/index.js';
export type {
  CodemindConfig,
  ReviewConfig,
  PRConfig,
  GenerationConfig,
  DocConfig,
  CLIConfig,
  GitHubConfig,
} from './config/index.js';
