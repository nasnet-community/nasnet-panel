/**
 * Template Export Tests
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import yaml from 'js-yaml';
import {
  exportTemplateToJSON,
  exportTemplateToYAML,
  exportTemplate,
  exportTemplates,
  downloadTemplate,
  downloadTemplates,
  copyTemplateToClipboard,
  getExportSize,
  generateTemplateId,
} from './template-export';
import type { FirewallTemplate } from '../schemas/templateSchemas';

// ============================================
// TEST FIXTURES
// ============================================

const mockTemplate: FirewallTemplate = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template for unit testing',
  category: 'CUSTOM',
  complexity: 'SIMPLE',
  ruleCount: 1,
  variables: [
    {
      name: 'LAN_INTERFACE',
      label: 'LAN Interface',
      type: 'INTERFACE',
      defaultValue: 'bridge1',
      isRequired: true,
    },
  ],
  rules: [
    {
      table: 'FILTER',
      chain: 'input',
      action: 'accept',
      position: 0,
      properties: {
        inInterface: '{{LAN_INTERFACE}}',
      },
    },
  ],
  isBuiltIn: false,
  version: '1.0.0',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

// ============================================
// EXPORT TO JSON TESTS
// ============================================

describe('exportTemplateToJSON', () => {
  it('should export template to pretty JSON by default', () => {
    const json = exportTemplateToJSON(mockTemplate);

    expect(json).toBeTruthy();
    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).toContain('\n'); // Pretty-printed has newlines
  });

  it('should export template to minified JSON when prettify is false', () => {
    const json = exportTemplateToJSON(mockTemplate, { prettify: false });

    expect(json).toBeTruthy();
    expect(() => JSON.parse(json)).not.toThrow();
    expect(json).not.toContain('\n'); // Minified has no newlines
  });

  it('should sanitize template by default', () => {
    const json = exportTemplateToJSON(mockTemplate);
    const parsed = JSON.parse(json);

    expect(parsed.createdAt).toBeNull();
    expect(parsed.updatedAt).toBeNull();
    expect(parsed.isBuiltIn).toBe(false);
  });

  it('should not sanitize when sanitize is false', () => {
    const json = exportTemplateToJSON(mockTemplate, { sanitize: false });
    const parsed = JSON.parse(json);

    expect(parsed.createdAt).toBeTruthy();
    expect(parsed.updatedAt).toBeTruthy();
  });

  it('should respect custom indent size', () => {
    const json = exportTemplateToJSON(mockTemplate, { indent: 4 });

    expect(json).toContain('    '); // 4-space indent
  });

  it('should preserve all template data', () => {
    const json = exportTemplateToJSON(mockTemplate, { sanitize: false });
    const parsed = JSON.parse(json);

    expect(parsed.id).toBe(mockTemplate.id);
    expect(parsed.name).toBe(mockTemplate.name);
    expect(parsed.description).toBe(mockTemplate.description);
    expect(parsed.variables).toHaveLength(1);
    expect(parsed.rules).toHaveLength(1);
  });
});

// ============================================
// EXPORT TO YAML TESTS
// ============================================

describe('exportTemplateToYAML', () => {
  it('should export template to YAML', () => {
    const yamlContent = exportTemplateToYAML(mockTemplate);

    expect(yamlContent).toBeTruthy();
    expect(() => yaml.load(yamlContent)).not.toThrow();
  });

  it('should sanitize template by default', () => {
    const yamlContent = exportTemplateToYAML(mockTemplate);
    const parsed = yaml.load(yamlContent) as FirewallTemplate;

    expect(parsed.createdAt).toBeNull();
    expect(parsed.updatedAt).toBeNull();
    expect(parsed.isBuiltIn).toBe(false);
  });

  it('should not sanitize when sanitize is false', () => {
    const yamlContent = exportTemplateToYAML(mockTemplate, { sanitize: false });
    const parsed = yaml.load(yamlContent) as FirewallTemplate;

    expect(parsed.createdAt).toBeTruthy();
    expect(parsed.updatedAt).toBeTruthy();
  });

  it('should preserve all template data', () => {
    const yamlContent = exportTemplateToYAML(mockTemplate, { sanitize: false });
    const parsed = yaml.load(yamlContent) as FirewallTemplate;

    expect(parsed.id).toBe(mockTemplate.id);
    expect(parsed.name).toBe(mockTemplate.name);
    expect(parsed.description).toBe(mockTemplate.description);
    expect(parsed.variables).toHaveLength(1);
    expect(parsed.rules).toHaveLength(1);
  });
});

// ============================================
// EXPORT TEMPLATE TESTS
// ============================================

describe('exportTemplate', () => {
  it('should export to JSON format', () => {
    const result = exportTemplate(mockTemplate, 'json');

    expect(result.mimeType).toBe('application/json');
    expect(result.fileName).toContain('.json');
    expect(() => JSON.parse(result.content)).not.toThrow();
  });

  it('should export to YAML format', () => {
    const result = exportTemplate(mockTemplate, 'yaml');

    expect(result.mimeType).toBe('application/x-yaml');
    expect(result.fileName).toContain('.yaml');
    expect(() => yaml.load(result.content)).not.toThrow();
  });

  it('should use template name for filename', () => {
    const result = exportTemplate(mockTemplate, 'json');

    expect(result.fileName).toBe('test-template.json');
  });

  it('should use custom filename when provided', () => {
    const result = exportTemplate(mockTemplate, 'json', { fileName: 'custom-name' });

    expect(result.fileName).toBe('custom-name.json');
  });

  it('should normalize template name to kebab-case', () => {
    const template = { ...mockTemplate, name: 'My Amazing Template' };
    const result = exportTemplate(template, 'json');

    expect(result.fileName).toBe('my-amazing-template.json');
  });
});

// ============================================
// EXPORT TEMPLATES (MULTIPLE) TESTS
// ============================================

describe('exportTemplates', () => {
  const template1 = mockTemplate;
  const template2 = { ...mockTemplate, id: 'template-2', name: 'Template 2' };

  it('should export multiple templates to JSON', () => {
    const result = exportTemplates([template1, template2], 'json');

    expect(result.mimeType).toBe('application/json');
    expect(result.fileName).toContain('.json');

    const parsed = JSON.parse(result.content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('should export multiple templates to YAML', () => {
    const result = exportTemplates([template1, template2], 'yaml');

    expect(result.mimeType).toBe('application/x-yaml');
    expect(result.fileName).toContain('.yaml');

    const parsed = yaml.load(result.content) as FirewallTemplate[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });

  it('should use default filename for multiple templates', () => {
    const result = exportTemplates([template1, template2], 'json');

    expect(result.fileName).toBe('firewall-templates.json');
  });

  it('should use custom filename when provided', () => {
    const result = exportTemplates([template1, template2], 'json', {
      fileName: 'my-templates',
    });

    expect(result.fileName).toBe('my-templates.json');
  });

  it('should sanitize all templates by default', () => {
    const result = exportTemplates([template1, template2], 'json');
    const parsed = JSON.parse(result.content);

    expect(parsed[0].createdAt).toBeNull();
    expect(parsed[1].createdAt).toBeNull();
  });
});

// ============================================
// DOWNLOAD TEMPLATE TESTS
// ============================================

describe('downloadTemplate', () => {
  let createObjectURLSpy: MockInstance;
  let revokeObjectURLSpy: MockInstance;
  let appendChildSpy: MockInstance;
  let removeChildSpy: MockInstance;
  let clickSpy: MockInstance;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    clickSpy = vi.fn();

    // Mock createElement to return a link with a click spy
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          click: clickSpy,
          href: '',
          download: '',
        } as any;
      }
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger download with correct filename', () => {
    downloadTemplate(mockTemplate, 'json');

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should revoke object URL after download', () => {
    vi.useFakeTimers();

    downloadTemplate(mockTemplate, 'json');

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

    vi.useRealTimers();
  });
});

// ============================================
// DOWNLOAD TEMPLATES TESTS
// ============================================

describe('downloadTemplates', () => {
  let createObjectURLSpy: MockInstance;
  let clickSpy: MockInstance;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    clickSpy = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          click: clickSpy,
          href: '',
          download: '',
        } as any;
      }
      return document.createElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger download for multiple templates', () => {
    const templates = [mockTemplate, { ...mockTemplate, id: 'template-2' }];

    downloadTemplates(templates, 'json');

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});

// ============================================
// COPY TO CLIPBOARD TESTS
// ============================================

describe('copyTemplateToClipboard', () => {
  it('should copy template to clipboard', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    await copyTemplateToClipboard(mockTemplate, 'json');

    expect(writeTextSpy).toHaveBeenCalled();
    const copiedContent = writeTextSpy.mock.calls[0][0];
    expect(() => JSON.parse(copiedContent)).not.toThrow();
  });

  it('should fallback to document.execCommand if clipboard API fails', async () => {
    // Mock clipboard API to fail
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard API not available')),
      },
    });

    const execCommandSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true);
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => null as any);
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => null as any);

    await copyTemplateToClipboard(mockTemplate, 'json');

    expect(appendChildSpy).toHaveBeenCalled();
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(removeChildSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});

// ============================================
// GET EXPORT SIZE TESTS
// ============================================

describe('getExportSize', () => {
  it('should format bytes correctly', () => {
    expect(getExportSize('Hello')).toContain('B');
  });

  it('should format kilobytes correctly', () => {
    const content = 'x'.repeat(2048);
    expect(getExportSize(content)).toContain('KB');
  });

  it('should format megabytes correctly', () => {
    const content = 'x'.repeat(2 * 1024 * 1024);
    expect(getExportSize(content)).toContain('MB');
  });

  it('should include decimal places for KB and MB', () => {
    const content = 'x'.repeat(1500);
    const size = getExportSize(content);
    expect(size).toMatch(/\d+\.\d+\sKB/);
  });
});

// ============================================
// GENERATE TEMPLATE ID TESTS
// ============================================

describe('generateTemplateId', () => {
  it('should generate kebab-case ID from name', () => {
    const id = generateTemplateId('My Template Name');

    expect(id).toBe('my-template-name');
  });

  it('should remove special characters', () => {
    const id = generateTemplateId('Template @ Name #1');

    expect(id).toBe('template-name-1');
  });

  it('should handle multiple spaces', () => {
    const id = generateTemplateId('Template    Name');

    expect(id).toBe('template-name');
  });

  it('should remove leading and trailing hyphens', () => {
    const id = generateTemplateId('  Template Name  ');

    expect(id).toBe('template-name');
  });

  it('should add suffix when ID already exists', () => {
    const existingIds = ['my-template'];
    const id = generateTemplateId('My Template', existingIds);

    expect(id).toBe('my-template-1');
  });

  it('should increment suffix until unique', () => {
    const existingIds = ['my-template', 'my-template-1', 'my-template-2'];
    const id = generateTemplateId('My Template', existingIds);

    expect(id).toBe('my-template-3');
  });

  it('should return base ID when no conflicts', () => {
    const existingIds = ['other-template'];
    const id = generateTemplateId('My Template', existingIds);

    expect(id).toBe('my-template');
  });
});
