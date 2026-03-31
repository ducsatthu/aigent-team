import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../src/core/agent-loader.js';

describe('parseFrontmatter', () => {
  it('should parse YAML frontmatter and return data + content', () => {
    const raw = [
      '---',
      'name: Analyze Bundle',
      'description: Analyze JS bundle size',
      'trigger: When adding dependencies',
      'tags: [fe, performance]',
      '---',
      '# Skill: Analyze Bundle',
      '',
      'Some content here.',
    ].join('\n');

    const result = parseFrontmatter(raw);

    expect(result.data.name).toBe('Analyze Bundle');
    expect(result.data.description).toBe('Analyze JS bundle size');
    expect(result.data.trigger).toBe('When adding dependencies');
    expect(result.data.tags).toEqual(['fe', 'performance']);
    expect(result.content).toBe('# Skill: Analyze Bundle\n\nSome content here.');
  });

  it('should return empty data when no frontmatter exists', () => {
    const raw = '# Skill: Analyze Bundle\n\nSome content here.';

    const result = parseFrontmatter(raw);

    expect(result.data).toEqual({});
    expect(result.content).toBe(raw);
  });

  it('should handle empty frontmatter block', () => {
    const raw = '---\n---\n# Content';

    const result = parseFrontmatter(raw);

    expect(result.data).toEqual({});
    expect(result.content).toBe('# Content');
  });

  it('should handle frontmatter with useCases array', () => {
    const raw = [
      '---',
      'name: Story Decomposition',
      'useCases:',
      '  - BA Agent decomposing epics',
      '  - Lead Agent requesting breakdown',
      '---',
      '# Content',
    ].join('\n');

    const result = parseFrontmatter(raw);

    expect(result.data.useCases).toEqual([
      'BA Agent decomposing epics',
      'Lead Agent requesting breakdown',
    ]);
    expect(result.content).toBe('# Content');
  });

  it('should not treat --- in content body as frontmatter', () => {
    const raw = '# Title\n\nSome text\n\n---\n\nMore text';

    const result = parseFrontmatter(raw);

    expect(result.data).toEqual({});
    expect(result.content).toBe(raw);
  });

  it('should handle leading whitespace before frontmatter', () => {
    const raw = '\n---\nname: Test\n---\n# Content';

    const result = parseFrontmatter(raw);

    // gray-matter handles this; our guard checks trimStart()
    expect(result.content).toContain('# Content');
  });
});
