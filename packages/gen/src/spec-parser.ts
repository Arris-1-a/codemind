/**
 * Spec Parser — parses code specifications into structured data for generation.
 *
 * @module gen/spec-parser
 */

/** Code specification */
export interface CodeSpec {
  /** Specification name */
  name: string;
  /** Kind of code to generate */
  kind: 'function' | 'class' | 'interface' | 'type' | 'component' | 'module' | 'api' | 'database';
  /** Programming language */
  language: string;
  /** Description */
  description: string;
  /** Properties/parameters */
  properties: SpecProperty[];
  /** Methods (for classes) */
  methods?: SpecMethod[];
  /** Dependencies */
  imports?: SpecImport[];
  /** Output configuration */
  output?: SpecOutput;
}

/** A property/parameter in a spec */
export interface SpecProperty {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description?: string;
}

/** A method specification */
export interface SpecMethod {
  name: string;
  returnType?: string;
  parameters: SpecProperty[];
  description?: string;
  async?: boolean;
}

/** An import specification */
export interface SpecImport {
  module: string;
  imports: string[];
  defaultImport?: string;
  type?: 'default' | 'named' | 'namespace';
}

/** Output configuration */
export interface SpecOutput {
  directory?: string;
  filename?: string;
  includeTests?: boolean;
  includeDocs?: boolean;
}

/** Parse result */
export interface ParseResult {
  spec: CodeSpec;
  warnings: string[];
  errors: string[];
}

/**
 * Spec Parser.
 * Parses natural language and structured specs into code generation specs.
 */
export class SpecParser {
  /**
   * Parse a JSON specification into a CodeSpec
   * @param jsonSpec - JSON specification string
   * @returns Parse result with spec and any warnings/errors
   */
  parseJSON(jsonSpec: string): ParseResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const raw = JSON.parse(jsonSpec);
      const spec = this.validateAndBuild(raw, warnings, errors);
      return { spec, warnings, errors };
    } catch (e) {
      return {
        spec: this.emptySpec(),
        warnings,
        errors: [...errors, `JSON parse error: ${e instanceof Error ? e.message : String(e)}`],
      };
    }
  }

  /**
   * Parse a YAML specification string
   */
  parseYAML(yamlSpec: string): ParseResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      const raw = this.simpleYAMLParse(yamlSpec);
      const spec = this.validateAndBuild(raw, warnings, errors);
      return { spec, warnings, errors };
    } catch (e) {
      return {
        spec: this.emptySpec(),
        warnings,
        errors: [...errors, `YAML parse error: ${e instanceof Error ? e.message : String(e)}`],
      };
    }
  }

  /**
   * Parse a natural language description into a spec
   */
  parseNaturalLanguage(description: string): ParseResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    const spec: CodeSpec = {
      name: this.extractName(description),
      kind: this.detectKind(description),
      language: this.detectLanguage(description),
      description,
      properties: this.extractProperties(description),
      methods: this.extractMethods(description),
    };

    if (!spec.name) {
      errors.push('Could not determine the component name from description');
    }

    return { spec, warnings, errors };
  }

  /**
   * Detect the kind of code to generate from a description
   */
  detectKind(description: string): CodeSpec['kind'] {
    const lower = description.toLowerCase();
    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('route')) return 'api';
    if (lower.includes('component') || lower.includes('react') || lower.includes('vue')) return 'component';
    if (lower.includes('class') || lower.includes('object')) return 'class';
    if (lower.includes('interface') || lower.includes('type definition')) return 'interface';
    if (lower.includes('database') || lower.includes('table') || lower.includes('schema')) return 'database';
    if (lower.includes('module') || lower.includes('package')) return 'module';
    if (lower.includes('function') || lower.includes('method') || lower.includes('utility')) return 'function';
    return 'function';
  }

  /**
   * Detect language from description
   */
  detectLanguage(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('typescript') || lower.includes('ts')) return 'typescript';
    if (lower.includes('javascript') || lower.includes('js')) return 'javascript';
    if (lower.includes('python') || lower.includes('py')) return 'python';
    if (lower.includes('rust') || lower.includes('rs')) return 'rust';
    if (lower.includes('go') || lower.includes('golang')) return 'go';
    return 'typescript';
  }

  /**
   * Extract name from description
   */
  private extractName(description: string): string {
    // Try to find patterns like "Create a X called Y" or "X named Y"
    const matches = [
      description.match(/(?:called|named|Create a)\s+(\w+)/i),
      description.match(/(?:a|an)\s+(\w+)\s+(?:function|class|component|module)/i),
      description.match(/^(\w+)/),
    ];

    for (const match of matches) {
      if (match?.[1] && match[1].length > 1 && !['a', 'an', 'the', 'create', 'make'].includes(match[1].toLowerCase())) {
        return match[1];
      }
    }

    return 'Unnamed';
  }

  /**
   * Extract properties from description
   */
  private extractProperties(description: string): SpecProperty[] {
    const props: SpecProperty[] = [];

    // Look for property patterns: "with X of type Y", "X: Y", "X (type)"
    const propRegex = /(\w+)\s*(?:\(|:)\s*(\w+)/g;
    let match;
    while ((match = propRegex.exec(description)) !== null) {
      props.push({
        name: match[1],
        type: match[2],
      });
    }

    return props;
  }

  /**
   * Extract methods from description
   */
  private extractMethods(description: string): SpecMethod[] {
    const methods: SpecMethod[] = [];
    return methods;
  }

  /**
   * Validate and build spec from raw data
   */
  private validateAndBuild(
    raw: Record<string, unknown>,
    warnings: string[],
    errors: string[],
  ): CodeSpec {
    if (!raw.name) {
      errors.push('Missing required field: name');
    }
    if (!raw.kind) {
      warnings.push('No kind specified, defaulting to function');
    }

    return {
      name: (raw.name as string) || 'Unnamed',
      kind: (raw.kind as CodeSpec['kind']) || 'function',
      language: (raw.language as string) || 'typescript',
      description: (raw.description as string) || '',
      properties: (raw.properties as SpecProperty[]) || [],
      methods: (raw.methods as SpecMethod[]) || [],
      imports: (raw.imports as SpecImport[]) || [],
      output: raw.output as SpecOutput | undefined,
    };
  }

  /**
   * Simple YAML-like parser
   */
  private simpleYAMLParse(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = content.split('
');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2].trim();
      }
    }

    return result;
  }

  /**
   * Create an empty spec
   */
  private emptySpec(): CodeSpec {
    return {
      name: 'Unnamed',
      kind: 'function',
      language: 'typescript',
      description: '',
      properties: [],
    };
  }
}
