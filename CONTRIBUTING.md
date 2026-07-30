# Contributing to Codemind

Thank you for your interest in contributing to Codemind! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We want to build a welcoming community.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/codemind.git`
3. **Install** dependencies: `pnpm install`
4. **Build**: `pnpm build`
5. **Create a branch**: `git checkout -b feature/your-feature`

## Development Workflow

### Project Structure

```
packages/
├── core/      # Core engine — providers, pipeline, config
├── review/    # Code review — analysis, rules, reporting
├── pr/        # PR assistant — summarization, generation
├── gen/       # Code generation — templates, specs, building
├── doc/       # Documentation — API docs, README, changelog
├── cli/       # CLI tool — commands, utilities
└── github/    # GitHub integration — webhooks, actions, app
```

### Coding Standards

- **TypeScript** with strict mode enabled
- **JSDoc** comments on all public APIs
- **ESLint** and **Prettier** for code formatting
- **Vitest** for testing
- **pnpm** workspaces for monorepo management

### Before Submitting

```bash
# Run lint
pnpm lint

# Run format check
pnpm format

# Run type check
pnpm typecheck

# Run tests
pnpm test

# Build all packages
pnpm build
```

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code refactoring
- `test:` — Adding tests
- `chore:` — Maintenance

### Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure CI passes
4. Request review from maintainers

## Adding a New AI Provider

1. Create a new provider class extending `BaseProvider` in `packages/core/src/provider/`
2. Implement the required methods: `complete()`, `countTokens()`, `isAvailable()`
3. Register it in `packages/core/src/provider/index.ts`

## Adding Review Rules

1. Add your rule to the appropriate rules file in `packages/review/src/rules/`
2. Follow the `ReviewRule` interface
3. Add patterns for pattern matching
4. Include good/bad examples

## Questions?

Open an issue or start a discussion on GitHub.

Thank you for contributing! 🙏
