# 🧠 Codemind

**AI-Powered Development Assistant — Code Review, PR Analysis, Code Generation, Documentation Automation**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange)](https://pnpm.io/)
[![Vitest](https://img.shields.io/badge/test-vitest-green)](https://vitest.dev/)

---

> 🧠 智能开发助手 — AI 驱动的代码审查、PR 分析、代码生成、文档自动化工具

Codemind is a comprehensive AI-powered development toolkit designed to streamline your development workflow. It integrates with multiple AI providers (OpenAI, Anthropic, DeepSeek, local models) to provide intelligent code review, automated PR management, code generation, and documentation automation.

## ✨ Features / 功能特性

### 🔍 AI Code Review / AI 代码审查
- **Security scanning** — detect hardcoded secrets, SQL injection, XSS, path traversal
- **Performance analysis** — identify sync operations, memory leaks, inefficient patterns
- **Code smells detection** — flag long functions, deep nesting, magic numbers
- **Best practices** — enforce TypeScript types, error handling, naming conventions
- **SARIF support** — export results in industry-standard format

### 📝 PR Assistant / PR 助手
- **Auto-generate PR descriptions** from git diff
- **Smart summarization** of changes with risk assessment
- **Automated PR review** with inline suggestions
- **Change walker** — systematically navigate through changes

### ⚡ Code Generation / 代码生成
- **Template engine** — extensible code templates with variables and logic
- **Spec parser** — parse JSON/YAML/natural language specs
- **Code builder** — generate TypeScript, JavaScript, Python, and more
- **Built-in templates** — functions, classes, interfaces, React components

### 📚 Documentation Automation / 文档自动化
- **API doc generation** — extract JSDoc and types from source
- **README generator** — create professional READMEs from metadata
- **Changelog generator** — build changelogs from git history
- **Multi-format output** — Markdown, HTML, JSON

### 🔗 GitHub Integration / GitHub 集成
- **Webhook handler** — process GitHub events
- **GitHub Actions** — ready-to-use CI workflows
- **GitHub App** — programmatic API access

## 📦 Architecture / 项目架构

```
codemind/
├── packages/
│   ├── core/         # 核心引擎 — AI 提供商抽象、处理管线、配置管理
│   ├── review/       # 代码审查 — 安全、性能、代码异味、最佳实践
│   ├── pr/           # PR 助手 — 摘要、描述生成、自动审查
│   ├── gen/          # 代码生成 — 模板引擎、规格解析、代码构建
│   ├── doc/          # 文档自动化 — API 文档、README、Changelog
│   ├── cli/          # CLI 工具 — 命令行界面
│   └── github/       # GitHub 集成 — Webhook、Actions、App
```

## 🚀 Quick Start / 快速开始

### Prerequisites / 前置条件
- Node.js >= 18
- pnpm >= 8

### Installation / 安装

```bash
# Clone the repository
git clone https://github.com/Arris-1-a/codemind.git
cd codemind

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Usage / 使用方式

```bash
# Review your code changes
pnpm cli review

# Review with specific options
pnpm cli review --base-ref main --format markdown --output review.md

# Generate PR description
pnpm cli pr generate --base main

# Summarize changes
pnpm cli pr summarize

# Generate code from spec
pnpm cli gen --input spec.json --output ./generated

# Generate API documentation
pnpm cli doc --source ./src --output ./docs/api.md

# Manage configuration
pnpm cli config init
pnpm cli config show
```

### Setup AI Provider / 配置 AI 提供商

```bash
# Set API keys via environment variables
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export DEEPSEEK_API_KEY="sk-..."

# Or configure via codemind config
pnpm cli config init
# Edit .codemind.json
```

### Programmatic Usage / 编程接口

```typescript
import { createProvider, Pipeline } from '@codemind/core';
import { Differ, Analyzer, Reporter } from '@codemind/review';
import { PRGenerator } from '@codemind/pr';

// Create an AI provider
const provider = createProvider('openai', { apiKey: process.env.OPENAI_API_KEY });

// Run a pipeline
const pipeline = new Pipeline(provider);
pipeline.context.addItem({
  id: '1',
  type: 'file',
  content: 'const x = 1;',
  metadata: {},
});

const result = await pipeline.run({
  analyze: { type: 'review' },
  output: { format: 'markdown' },
});

console.log(result.output);
```

## 🔧 Configuration / 配置

Create a `.codemind.json` file in your project root:

```json
{
  "version": "1.0.0",
  "defaultProvider": "openai",
  "providers": {
    "openai": { "model": "gpt-4o", "temperature": 0.3 },
    "anthropic": { "model": "claude-3-5-sonnet-20241022" },
    "deepseek": { "model": "deepseek-chat" },
    "local": { "model": "llama3", "baseUrl": "http://localhost:11434/v1" }
  },
  "review": {
    "security": true,
    "performance": true,
    "codeSmells": true,
    "bestPractices": true
  },
  "cli": {
    "outputFormat": "text",
    "colors": true
  }
}
```

## 🧪 Testing / 测试

```bash
# Run all tests
pnpm test

# Run tests with watch mode
pnpm --filter @codemind/review test:watch

# Run tests for a specific package
pnpm --filter @codemind/core test
```

## 🛠 Development / 开发

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck

# Build all
pnpm build

# Clean build artifacts
pnpm clean
```

## 🤝 Contributing / 贡献

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## 📄 License / 许可证

MIT © 2024 [Arris](https://github.com/Arris-1-a)

---

Made with ❤️ by the Codemind team
