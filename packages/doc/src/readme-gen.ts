/**
 * README Generator — generates README.md from project analysis.
 *
 * @module doc/readme-gen
 */

/** Project information */
export interface ProjectInfo {
  /** Package name */
  name: string;
  /** Version */
  version?: string;
  /** Description */
  description: string;
  /** Repository URL */
  repository?: string;
  /** Author */
  author?: string;
  /** License */
  license?: string;
  /** Features */
  features?: string[];
  /** Installation instructions */
  installation?: string;
  /** Usage examples */
  usage?: string;
  /** Configuration */
  configuration?: string;
  /** Contributing guide */
  contributing?: string;
  /** Badges */
  badges?: string[];
}

/** Generator options */
export interface ReadmeOptions {
  /** Template style */
  style?: 'minimal' | 'detailed' | 'project';
  /** Include badges */
  includeBadges?: boolean;
  /** Include table of contents */
  includeTOC?: boolean;
  /** Custom sections */
  customSections?: Record<string, string>;
}

/**
 * README Generator.
 * Creates professional README.md files from project metadata.
 */
export class ReadmeGenerator {
  private options: Required<ReadmeOptions>;

  constructor(options: ReadmeOptions = {}) {
    this.options = {
      style: options.style || 'project',
      includeBadges: options.includeBadges !== false,
      includeTOC: options.includeTOC !== false,
      customSections: options.customSections || {},
    };
  }

  /**
   * Generate a README from project info
   */
  generate(info: ProjectInfo): string {
    const sections: string[] = [];

    // Title
    sections.push(`# ${info.name}`);
    sections.push('');

    // Badges
    if (this.options.includeBadges && info.badges && info.badges.length > 0) {
      sections.push(info.badges.join(' '));
      sections.push('');
    }

    // Description
    if (info.description) {
      sections.push(info.description);
      sections.push('');
    }

    // Table of Contents
    if (this.options.includeTOC) {
      sections.push('## Table of Contents');
      sections.push('');
      sections.push('- [Features](#features)');
      sections.push('- [Installation](#installation)');
      sections.push('- [Usage](#usage)');
      if (info.configuration) sections.push('- [Configuration](#configuration)');
      sections.push('- [Contributing](#contributing)');
      sections.push('- [License](#license)');
      sections.push('');
    }

    // Features
    if (info.features && info.features.length > 0) {
      sections.push('## Features');
      sections.push('');
      for (const feature of info.features) {
        sections.push(`- ${feature}`);
      }
      sections.push('');
    }

    // Installation
    if (info.installation) {
      sections.push('## Installation');
      sections.push('');
      sections.push(info.installation);
      sections.push('');
    }

    // Usage
    if (info.usage) {
      sections.push('## Usage');
      sections.push('');
      sections.push(info.usage);
      sections.push('');
    }

    // Configuration
    if (info.configuration) {
      sections.push('## Configuration');
      sections.push('');
      sections.push(info.configuration);
      sections.push('');
    }

    // Custom sections
    for (const [title, content] of Object.entries(this.options.customSections)) {
      sections.push(`## ${title}`);
      sections.push('');
      sections.push(content);
      sections.push('');
    }

    // Contributing
    if (info.contributing) {
      sections.push('## Contributing');
      sections.push('');
      sections.push(info.contributing);
      sections.push('');
    }

    // License
    if (info.license) {
      sections.push('## License');
      sections.push('');
      sections.push(`${info.name} is released under the ${info.license} license.`);
      sections.push('');
    }

    return sections.join('
');
  }

  /**
   * Generate from a package.json object
   */
  generateFromPackage(pkg: Record<string, unknown>): string {
    return this.generate({
      name: (pkg.name as string) || 'Project',
      version: (pkg.version as string) || '0.0.0',
      description: (pkg.description as string) || '',
      repository: typeof pkg.repository === 'string'
        ? pkg.repository as string
        : (pkg.repository as Record<string, string>)?.url,
      author: typeof pkg.author === 'string'
        ? pkg.author as string
        : (pkg.author as Record<string, string>)?.name,
      license: pkg.license as string,
    });
  }
}
