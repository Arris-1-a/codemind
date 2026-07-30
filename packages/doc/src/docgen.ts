/**
 * DocGen — API documentation generator from TypeScript source code.
 *
 * @module doc/docgen
 */

/** Parsed export from source code */
export interface ParsedExport {
  /** Export name */
  name: string;
  /** Export kind */
  kind: 'function' | 'class' | 'interface' | 'type' | 'const' | 'enum' | 'variable';
  /** JSDoc comment */
  jsdoc?: string;
  /** Source file */
  sourceFile: string;
  /** Line number */
  line: number;
  /** Parameters (for functions) */
  parameters?: ParsedParam[];
  /** Return type (for functions) */
  returnType?: string;
  /** Properties (for interfaces/types) */
  properties?: ParsedProperty[];
  /** Methods (for classes) */
  methods?: ParsedMethod[];
  /** Extends (for classes/interfaces) */
  extends?: string;
  /** Is exported as default */
  isDefault?: boolean;
  /** Is async */
  isAsync?: boolean;
}

/** Function parameter */
export interface ParsedParam {
  name: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
  description?: string;
}

/** Property */
export interface ParsedProperty {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
}

/** Method */
export interface ParsedMethod {
  name: string;
  returnType?: string;
  parameters: ParsedParam[];
  jsdoc?: string;
  isAsync?: boolean;
  isStatic?: boolean;
}

/** Documentation output */
export interface DocumentOutput {
  /** Module name */
  module: string;
  /** Exports */
  exports: ParsedExport[];
  /** Generated timestamp */
  generatedAt: string;
}

/** Generator options */
export interface DocGenOptions {
  /** Output format */
  format?: 'markdown' | 'html' | 'json';
  /** Include table of contents */
  toc?: boolean;
  /** Include source code examples */
  includeExamples?: boolean;
  /** Custom title */
  title?: string;
}

/**
 * API Documentation Generator.
 * Parses TypeScript source files and generates documentation.
 */
export class DocGenerator {
  private options: Required<DocGenOptions>;

  constructor(options: DocGenOptions = {}) {
    this.options = {
      format: options.format || 'markdown',
      toc: options.toc !== false,
      includeExamples: options.includeExamples || false,
      title: options.title || 'API Documentation',
    };
  }

  /**
   * Generate documentation from source code
   * @param sourceFiles - Map of filename to source content
   * @returns Generated documentation string
   */
  generate(sourceFiles: Map<string, string>): string {
    const exports: ParsedExport[] = [];

    for (const [filename, content] of sourceFiles) {
      const parsed = this.parseSource(filename, content);
      exports.push(...parsed);
    }

    const doc: DocumentOutput = {
      module: this.options.title,
      exports,
      generatedAt: new Date().toISOString(),
    };

    switch (this.options.format) {
      case 'html': return this.generateHTML(doc);
      case 'json': return this.generateJSON(doc);
      case 'markdown':
      default: return this.generateMarkdown(doc);
    }
  }

  /**
   * Parse a single TypeScript source file
   */
  parseSource(filename: string, content: string): ParsedExport[] {
    const exports: ParsedExport[] = [];

    // Parse exported functions
    const funcRegex = /(?:(\/\*\*[\s\S]*?\*\/)\s*)?(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+?))?\s*\{/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const [, jsdoc, name, paramsStr, returnType] = match;
      exports.push({
        name,
        kind: 'function',
        jsdoc: jsdoc ? jsdoc.trim() : undefined,
        sourceFile: filename,
        line: this.getLineNumber(content, match.index),
        parameters: this.parseParams(paramsStr),
        returnType: returnType?.trim(),
        isAsync: content.slice(Math.max(0, match.index - 10), match.index).includes('async'),
        isDefault: content.slice(Math.max(0, match.index - 30), match.index).includes('default'),
      });
    }

    // Parse exported classes
    const classRegex = /(?:(\/\*\*[\s\S]*?\*\/)\s*)?(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      const [, jsdoc, name, extendsCls] = match;
      exports.push({
        name,
        kind: 'class',
        jsdoc: jsdoc ? jsdoc.trim() : undefined,
        sourceFile: filename,
        line: this.getLineNumber(content, match.index),
        extends: extendsCls,
        methods: [],
      });
    }

    // Parse exported interfaces
    const interfaceRegex = /(?:(\/\*\*[\s\S]*?\*\/)\s*)?(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+?))?\s*\{([^}]*)\}/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const [, jsdoc, name, extendsIf, body] = match;
      exports.push({
        name,
        kind: 'interface',
        jsdoc: jsdoc ? jsdoc.trim() : undefined,
        sourceFile: filename,
        line: this.getLineNumber(content, match.index),
        extends: extendsIf?.trim(),
        properties: this.parseProperties(body),
      });
    }

    // Parse exported types
    const typeRegex = /(?:(\/\*\*[\s\S]*?\*\/)\s*)?(?:export\s+)?type\s+(\w+)\s*=\s*([^;]+);/g;
    while ((match = typeRegex.exec(content)) !== null) {
      const [, jsdoc, name, typeDef] = match;
      exports.push({
        name,
        kind: 'type',
        jsdoc: jsdoc ? jsdoc.trim() : undefined,
        sourceFile: filename,
        line: this.getLineNumber(content, match.index),
      });
    }

    return exports;
  }

  /**
   * Parse function parameters
   */
  private parseParams(paramsStr: string): ParsedParam[] {
    if (!paramsStr.trim()) return [];

    return paramsStr.split(',').map((param) => {
      const trimmed = param.trim();
      const optional = trimmed.includes('?');
      const parts = trimmed.replace('?', '').split(':');
      return {
        name: parts[0].trim(),
        type: parts[1]?.trim(),
        optional,
      };
    });
  }

  /**
   * Parse interface/type properties
   */
  private parseProperties(body: string): ParsedProperty[] {
    const props: ParsedProperty[] = [];
    const lines = body.split('
');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;

      const match = trimmed.match(/(\w+)(\?)?:\s*(.+?);?$/);
      if (match) {
        props.push({
          name: match[1],
          type: match[3]?.replace(/;$/, '').trim(),
          optional: !!match[2],
        });
      }
    }

    return props;
  }

  /**
   * Get line number for a character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('
').length;
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdown(doc: DocumentOutput): string {
    const lines: string[] = [];

    lines.push(`# ${this.options.title}`);
    lines.push('');
    lines.push(`> Generated at ${doc.generatedAt}`);
    lines.push('');

    if (this.options.toc && doc.exports.length > 0) {
      lines.push('## Table of Contents');
      lines.push('');
      for (const exp of doc.exports) {
        const kind = exp.kind[0].toUpperCase();
        lines.push(`- [${kind}] [${exp.name}](#${exp.name.toLowerCase()})`);
      }
      lines.push('');
    }

    for (const exp of doc.exports) {
      lines.push(`## ${exp.name}`);
      lines.push('');
      lines.push(`- **Kind:** \`${exp.kind}\``);
      lines.push(`- **Source:** \`${exp.sourceFile}:${exp.line}\``);

      if (exp.extends) {
        lines.push(`- **Extends:** \`${exp.extends}\``);
      }
      if (exp.isAsync) {
        lines.push(`- **Async:** yes`);
      }
      if (exp.returnType) {
        lines.push(`- **Returns:** \`${exp.returnType}\``);
      }

      lines.push('');

      if (exp.jsdoc) {
        const cleaned = exp.jsdoc
          .replace(/\/\*\*/g, '')
          .replace(/\*\//g, '')
          .replace(/^\s*\*\s?/gm, '')
          .trim();
        if (cleaned) {
          lines.push(cleaned);
          lines.push('');
        }
      }

      // Parameters table
      if (exp.parameters && exp.parameters.length > 0) {
        lines.push('### Parameters');
        lines.push('');
        lines.push('| Name | Type | Required | Default |');
        lines.push('| --- | --- | --- | --- |');
        for (const p of exp.parameters) {
          lines.push(`| ${p.name} | \`${p.type || 'any'}\` | ${p.optional ? 'No' : 'Yes'} | ${p.defaultValue || '-'} |`);
        }
        lines.push('');
      }

      // Properties table
      if (exp.properties && exp.properties.length > 0) {
        lines.push('### Properties');
        lines.push('');
        lines.push('| Name | Type | Required |');
        lines.push('| --- | --- | --- |');
        for (const p of exp.properties) {
          lines.push(`| ${p.name} | \`${p.type}\` | ${p.optional ? 'No' : 'Yes'} |`);
        }
        lines.push('');
      }
    }

    return lines.join('
');
  }

  /**
   * Generate HTML documentation
   */
  private generateHTML(doc: DocumentOutput): string {
    const parts: string[] = [];
    parts.push('<!DOCTYPE html><html><head><meta charset="utf-8">');
    parts.push(`<title>${doc.module}</title>`);
    parts.push('<style>body{font-family:system-ui;max-width:960px;margin:auto;padding:2em}');
    parts.push('table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}');
    parts.push('th{background:#f0f0f0}</style></head><body>');
    parts.push(`<h1>${doc.module}</h1>`);
    parts.push(`<p>Generated at ${doc.generatedAt}</p>`);

    for (const exp of doc.exports) {
      parts.push(`<h2 id="${exp.name}">${exp.name}</h2>`);
      parts.push(`<p><strong>${exp.kind}</strong> in <code>${exp.sourceFile}:${exp.line}</code></p>`);
    }

    parts.push('</body></html>');
    return parts.join('
');
  }

  /**
   * Generate JSON documentation
   */
  private generateJSON(doc: DocumentOutput): string {
    return JSON.stringify(doc, null, 2);
  }
}
