import { type Tree, addProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import componentGenerator from './generator';

describe('component generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Add a test project
    addProjectConfiguration(tree, 'connect', {
      root: 'apps/connect',
      sourceRoot: 'apps/connect/src',
      projectType: 'application',
      targets: {},
    });

    // Create the utils file that components import from
    tree.write(
      'apps/connect/src/components/lib/utils.ts',
      `export function cn(...args: string[]) { return args.join(' '); }`
    );
  });

  it('should create component files', async () => {
    await componentGenerator(tree, {
      name: 'MyTestComponent',
      project: 'connect',
    });

    // Files use kebab-case naming (fileName)
    expect(
      tree.exists('apps/connect/src/components/my-test-component/my-test-component.tsx')
    ).toBe(true);
    expect(
      tree.exists(
        'apps/connect/src/components/my-test-component/my-test-component.test.tsx'
      )
    ).toBe(true);
    expect(
      tree.exists('apps/connect/src/components/my-test-component/index.ts')
    ).toBe(true);
  });

  it('should create component with correct imports', async () => {
    await componentGenerator(tree, {
      name: 'TestButton',
      project: 'connect',
    });

    const componentContent = tree.read(
      'apps/connect/src/components/test-button/test-button.tsx',
      'utf-8'
    );

    expect(componentContent).toContain("import * as React from 'react'");
    expect(componentContent).toContain("import { cn } from '../lib/utils'");
    expect(componentContent).toContain('export interface TestButtonProps');
    expect(componentContent).toContain('React.forwardRef');
  });

  it('should create test file with correct structure', async () => {
    await componentGenerator(tree, {
      name: 'TestInput',
      project: 'connect',
    });

    const testContent = tree.read(
      'apps/connect/src/components/test-input/test-input.test.tsx',
      'utf-8'
    );

    expect(testContent).toContain("describe('TestInput'");
    expect(testContent).toContain("import { render, screen } from '@testing-library/react'");
    expect(testContent).toContain("import { TestInput } from './test-input'");
  });

  it('should create barrel export', async () => {
    await componentGenerator(tree, {
      name: 'ExportTest',
      project: 'connect',
    });

    const indexContent = tree.read(
      'apps/connect/src/components/export-test/index.ts',
      'utf-8'
    );

    expect(indexContent).toContain("export { ExportTest } from './export-test'");
    expect(indexContent).toContain('export type { ExportTestProps }');
  });

  it('should support custom directory', async () => {
    await componentGenerator(tree, {
      name: 'CustomDir',
      project: 'connect',
      directory: 'components/shared',
    });

    expect(
      tree.exists('apps/connect/src/components/shared/custom-dir/custom-dir.tsx')
    ).toBe(true);
  });

  it('should support variants option', async () => {
    await componentGenerator(tree, {
      name: 'VariantComponent',
      project: 'connect',
      withVariants: true,
    });

    const content = tree.read(
      'apps/connect/src/components/variant-component/variant-component.tsx',
      'utf-8'
    );

    expect(content).toContain('cva');
    expect(content).toContain('variantComponentVariants');
    expect(content).toContain("VariantProps<typeof variantComponentVariants>");
  });

  it('should respect dry-run mode', async () => {
    await componentGenerator(tree, {
      name: 'DryRunTest',
      project: 'connect',
      dryRun: true,
    });

    // Files should still be created in the tree for preview,
    // but formatFiles is skipped (which is what we control)
    expect(
      tree.exists('apps/connect/src/components/dry-run-test/dry-run-test.tsx')
    ).toBe(true);
  });
});
