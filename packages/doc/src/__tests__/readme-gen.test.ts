import { describe, it, expect } from 'vitest';
import { ReadmeGenerator } from '../readme-gen.js';

describe('ReadmeGenerator', () => {
  it('should generate a README', () => {
    const gen = new ReadmeGenerator();
    const readme = gen.generate({
      name: 'test-project',
      description: 'A test project',
      features: ['Feature 1', 'Feature 2'],
      license: 'MIT',
    });
    expect(readme).toContain('# test-project');
    expect(readme).toContain('A test project');
    expect(readme).toContain('Feature 1');
    expect(readme).toContain('MIT');
  });

  it('should generate from package.json', () => {
    const gen = new ReadmeGenerator();
    const readme = gen.generateFromPackage({
      name: 'mypkg',
      description: 'My awesome package',
      version: '2.0.0',
      license: 'Apache-2.0',
    });
    expect(readme).toContain('# mypkg');
    expect(readme).toContain('My awesome package');
  });

  it('should include table of contents by default', () => {
    const gen = new ReadmeGenerator();
    const readme = gen.generate({
      name: 'test',
      description: 'Test',
      features: ['f1'],
    });
    expect(readme).toContain('Table of Contents');
  });
});
