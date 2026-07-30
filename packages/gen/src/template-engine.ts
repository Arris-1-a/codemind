/**
 * Template Engine — renders code templates with variables and conditions.
 *
 * @module gen/template-engine
 */

/** Template variable */
export interface TemplateVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
}

/** A code template */
export interface Template {
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Template language */
  language: string;
  /** Template variables */
  variables: TemplateVariable[];
  /** Template content */
  content: string;
  /** Optional filename pattern */
  filename?: string;
}

/** Template render options */
export interface RenderOptions {
  /** Variable values */
  variables: Record<string, string | number | boolean | string[]>;
  /** Whether to trim whitespace */
  trim?: boolean;
  /** Indent size */
  indentSize?: number;
}

/** Template directive types */
type DirectiveType = 'if' | 'else' | 'elseif' | 'for' | 'end';

/**
 * Template Engine.
 * Renders code templates with variable substitution and logic.
 */
export class TemplateEngine {
  private templates: Map<string, Template> = new Map();

  /**
   * Register a template
   */
  register(template: Template): void {
    this.templates.set(template.name, template);
  }

  /**
   * Get a template by name
   */
  get(name: string): Template | undefined {
    return this.templates.get(name);
  }

  /**
   * List all registered templates
   */
  list(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Delete a template
   */
  delete(name: string): boolean {
    return this.templates.delete(name);
  }

  /**
   * Render a template with variables
   * @param templateName - Name of the registered template
   * @param options - Render options
   * @returns Rendered content
   */
  render(templateName: string, options: RenderOptions): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: "${templateName}"`);
    }
    return this.renderContent(template.content, options);
  }

  /**
   * Render raw template content with variables
   * @param content - Raw template content
   * @param options - Render options
   * @returns Rendered content
   */
  renderContent(content: string, options: RenderOptions): string {
    let result = content;

    // Simple variable substitution: {{variable}}
    result = result.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      const value = options.variables[name];
      if (value === undefined) {
        return `{{${name}}}`;
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
    });

    // Conditional blocks: {{#if variable}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, condition, body) => {
        const value = options.variables[condition];
        if (value) return body;
        return '';
      },
    );

    // Unless blocks: {{#unless variable}}...{{/unless}}
    result = result.replace(
      /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
      (_, condition, body) => {
        const value = options.variables[condition];
        if (!value) return body;
        return '';
      },
    );

    // Loop blocks: {{#each items}}...{{/each}}
    result = result.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (_, itemName, body) => {
        const items = options.variables[itemName];
        if (Array.isArray(items)) {
          return items.map((item) => body.replace(/\{\{this\}\}/g, String(item))).join('');
        }
        return '';
      },
    );

    // Trim if requested
    if (options.trim) {
      result = result.trim();
    }

    return result;
  }

  /**
   * Validate that all required variables are provided
   * @param templateName - Template to validate
   * @param variables - Provided variables
   * @returns List of missing required variables
   */
  validate(templateName: string, variables: Record<string, unknown>): string[] {
    const template = this.templates.get(templateName);
    if (!template) {
      return [`Template "${templateName}" not found`];
    }

    return template.variables
      .filter((v) => v.required && variables[v.name] === undefined)
      .map((v) => v.name);
  }

  /**
   * Create a template from a specification object
   */
  createFromSpec(spec: {
    name: string;
    description: string;
    language: string;
    variables: TemplateVariable[];
    content: string;
    filename?: string;
  }): Template {
    const template: Template = {
      name: spec.name,
      description: spec.description,
      language: spec.language,
      variables: spec.variables,
      content: spec.content,
      filename: spec.filename,
    };
    this.register(template);
    return template;
  }

  /**
   * Get suggested filename for a rendered template
   */
  getFilename(templateName: string, options: RenderOptions): string {
    const template = this.templates.get(templateName);
    if (!template || !template.filename) {
      return `${templateName}.${template?.language || 'ts'}`;
    }
    return this.renderContent(template.filename, options);
  }

  /**
   * Export all templates to JSON
   */
  exportAll(): string {
    return JSON.stringify(
      Array.from(this.templates.values()).map((t) => ({
        name: t.name,
        description: t.description,
        language: t.language,
        filename: t.filename,
        variables: t.variables,
      })),
      null,
      2,
    );
  }
}

/** Built-in templates */
export const BUILTIN_TEMPLATES: Template[] = [
  {
    name: 'ts-function',
    description: 'TypeScript function',
    language: 'typescript',
    variables: [
      { name: 'name', required: true, description: 'Function name' },
      { name: 'returnType', defaultValue: 'void', description: 'Return type' },
      { name: 'params', required: true, description: 'Function parameters' },
      { name: 'body', defaultValue: '', description: 'Function body' },
      { name: 'export', defaultValue: 'true', type: 'boolean', description: 'Export the function' },
      { name: 'async', defaultValue: 'false', type: 'boolean' },
    ],
    filename: '{{name}}.ts',
    content: `{{#if export}}export {{/if}}{{#if async}}async {{/if}}function {{name}}({{params}}): {{returnType}} {
  {{body}}
}`,
  },
  {
    name: 'ts-class',
    description: 'TypeScript class',
    language: 'typescript',
    variables: [
      { name: 'name', required: true },
      { name: 'extends', description: 'Parent class' },
      { name: 'implements', description: 'Interfaces' },
      { name: 'body', defaultValue: '' },
      { name: 'export', defaultValue: 'true', type: 'boolean' },
    ],
    filename: '{{name}}.ts',
    content: `{{#if export}}export {{/if}}class {{name}}{{#if extends}} extends {{extends}}{{/if}}{{#if implements}} implements {{implements}}{{/if}} {
  {{body}}
}`,
  },
  {
    name: 'ts-interface',
    description: 'TypeScript interface',
    language: 'typescript',
    variables: [
      { name: 'name', required: true },
      { name: 'extends', description: 'Parent interface' },
      { name: 'properties', required: true },
      { name: 'export', defaultValue: 'true', type: 'boolean' },
    ],
    filename: '{{name}}.ts',
    content: `{{#if export}}export {{/if}}interface {{name}}{{#if extends}} extends {{extends}}{{/if}} {
  {{properties}}
}`,
  },
  {
    name: 'react-component',
    description: 'React functional component',
    language: 'typescript',
    variables: [
      { name: 'name', required: true },
      { name: 'props', defaultValue: 'Record<string, never>' },
      { name: 'body', defaultValue: 'return <div>{{name}}</div>;' },
      { name: 'export', defaultValue: 'true', type: 'boolean' },
    ],
    filename: '{{name}}.tsx',
    content: `import React from 'react';

interface {{name}}Props {
  {{props}}
}

{{#if export}}export {{/if}}function {{name}}({}: {{name}}Props): React.ReactElement {
  {{body}}
}`,
  },
];
