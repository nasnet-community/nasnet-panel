import * as path from 'path';

import {
  type Tree,
  formatFiles,
  generateFiles,
  names,
  updateJson,
  joinPathFragments,
} from '@nx/devkit';

export interface LibraryGeneratorSchema {
  name: string;
  directory: string;
  scope?: string;
  description?: string;
  dryRun?: boolean;
}

interface NormalizedOptions extends LibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  fileName: string;
  className: string;
  propertyName: string;
  scopeTag: string;
  importPath: string;
}

const DIRECTORY_TO_SCOPE: Record<string, string> = {
  'libs/core': 'core',
  'libs/ui': 'ui',
  'libs/features': 'features',
  'libs/api-client': 'api-client',
  'libs/state': 'state',
  'libs/config-gen': 'config-gen',
};

function normalizeOptions(options: LibraryGeneratorSchema): NormalizedOptions {
  const libNames = names(options.name);

  // Determine scope from directory or explicit option
  const scopeTag = options.scope || DIRECTORY_TO_SCOPE[options.directory] || 'shared';

  // Build project name from directory structure
  const dirParts = options.directory.replace('libs/', '').split('/');
  const projectName = `${dirParts.join('-')}-${libNames.fileName}`;

  const projectRoot = joinPathFragments(options.directory, libNames.fileName);

  // Build import path following @nasnet/{category}/{name} pattern
  const category = options.directory.replace('libs/', '');
  const importPath = `@nasnet/${category}/${libNames.fileName}`;

  return {
    ...options,
    projectName,
    projectRoot,
    fileName: libNames.fileName,
    className: libNames.className,
    propertyName: libNames.propertyName,
    scopeTag,
    importPath,
    description: options.description || `${libNames.className} library`,
  };
}

function updateTsConfigPaths(tree: Tree, options: NormalizedOptions): void {
  const tsConfigPath = 'tsconfig.base.json';

  if (!tree.exists(tsConfigPath)) {
    console.warn('tsconfig.base.json not found, skipping path update');
    return;
  }

  updateJson(tree, tsConfigPath, (json) => {
    const paths = json.compilerOptions?.paths || {};

    // Add path mapping for the new library
    // Pattern: @nasnet/{category}/{name} -> libs/{category}/{name}/src
    const pathKey = options.importPath;
    const pathValue = [`${options.projectRoot}/src`];

    // Only add if not already present
    if (!paths[pathKey]) {
      paths[pathKey] = pathValue;
      json.compilerOptions = json.compilerOptions || {};
      json.compilerOptions.paths = paths;
    }

    return json;
  });
}

export default async function libraryGenerator(
  tree: Tree,
  options: LibraryGeneratorSchema
): Promise<void> {
  const normalizedOptions = normalizeOptions(options);

  // Generate files from templates
  generateFiles(tree, path.join(__dirname, 'files'), normalizedOptions.projectRoot, {
    ...normalizedOptions,
    tmpl: '', // Used to strip .template extension
  });

  // Update tsconfig.base.json paths
  if (!options.dryRun) {
    updateTsConfigPaths(tree, normalizedOptions);
    await formatFiles(tree);
  }

  console.log(
    `\n✅ Library ${normalizedOptions.projectName} created at ${normalizedOptions.projectRoot}`
  );
  console.log(`\nScope tag: scope:${normalizedOptions.scopeTag}`);
  console.log(`Import path: ${normalizedOptions.importPath}`);
  console.log(`\nFiles created:`);
  console.log(`  - project.json`);
  console.log(`  - tsconfig.json`);
  console.log(`  - tsconfig.lib.json`);
  console.log(`  - README.md`);
  console.log(`  - src/index.ts`);
  console.log(`  - package.json`);
}
