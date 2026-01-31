import { describe, it, expect, beforeEach } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readJson } from '@nx/devkit';
import libraryGenerator from './generator';

describe('library generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Create tsconfig.base.json
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {},
        },
      })
    );
  });

  it('should create library files', async () => {
    await libraryGenerator(tree, {
      name: 'my-lib',
      directory: 'libs/features',
    });

    expect(tree.exists('libs/features/my-lib/project.json')).toBe(true);
    expect(tree.exists('libs/features/my-lib/tsconfig.json')).toBe(true);
    expect(tree.exists('libs/features/my-lib/tsconfig.lib.json')).toBe(true);
    expect(tree.exists('libs/features/my-lib/README.md')).toBe(true);
    expect(tree.exists('libs/features/my-lib/src/index.ts')).toBe(true);
    expect(tree.exists('libs/features/my-lib/package.json')).toBe(true);
  });

  it('should auto-assign correct scope tag based on directory', async () => {
    await libraryGenerator(tree, {
      name: 'test-lib',
      directory: 'libs/features',
    });

    const projectJson = readJson(tree, 'libs/features/test-lib/project.json');
    expect(projectJson.tags).toContain('scope:features');
  });

  it('should assign scope:core for core libraries', async () => {
    await libraryGenerator(tree, {
      name: 'utils',
      directory: 'libs/core',
    });

    const projectJson = readJson(tree, 'libs/core/utils/project.json');
    expect(projectJson.tags).toContain('scope:core');
  });

  it('should assign scope:ui for ui libraries', async () => {
    await libraryGenerator(tree, {
      name: 'buttons',
      directory: 'libs/ui',
    });

    const projectJson = readJson(tree, 'libs/ui/buttons/project.json');
    expect(projectJson.tags).toContain('scope:ui');
  });

  it('should update tsconfig.base.json paths', async () => {
    await libraryGenerator(tree, {
      name: 'my-feature',
      directory: 'libs/features',
    });

    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.paths['@nasnet/features/my-feature']).toEqual([
      'libs/features/my-feature/src',
    ]);
  });

  it('should create correct project name', async () => {
    await libraryGenerator(tree, {
      name: 'network-utils',
      directory: 'libs/core',
    });

    const projectJson = readJson(tree, 'libs/core/network-utils/project.json');
    expect(projectJson.name).toBe('core-network-utils');
  });

  it('should create README with correct import path', async () => {
    await libraryGenerator(tree, {
      name: 'auth',
      directory: 'libs/features',
    });

    const readme = tree.read('libs/features/auth/README.md', 'utf-8');
    expect(readme).toContain('@nasnet/features/auth');
  });

  it('should include build targets in project.json', async () => {
    await libraryGenerator(tree, {
      name: 'test-targets',
      directory: 'libs/features',
    });

    const projectJson = readJson(tree, 'libs/features/test-targets/project.json');
    expect(projectJson.targets.build).toBeDefined();
    expect(projectJson.targets.test).toBeDefined();
    expect(projectJson.targets.lint).toBeDefined();
    expect(projectJson.targets.typecheck).toBeDefined();
  });

  it('should respect dry-run mode for tsconfig update', async () => {
    await libraryGenerator(tree, {
      name: 'dry-test',
      directory: 'libs/features',
      dryRun: true,
    });

    // Files should still be created in tree for preview
    expect(tree.exists('libs/features/dry-test/project.json')).toBe(true);

    // tsconfig paths should NOT be updated in dry-run mode
    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tsconfig.compilerOptions.paths['@nasnet/features/dry-test']).toBeUndefined();
  });

  it('should allow explicit scope override', async () => {
    await libraryGenerator(tree, {
      name: 'shared-utils',
      directory: 'libs/features',
      scope: 'core', // Override to core despite being in features
    });

    const projectJson = readJson(tree, 'libs/features/shared-utils/project.json');
    expect(projectJson.tags).toContain('scope:core');
  });
});
