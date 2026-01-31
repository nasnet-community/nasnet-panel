import {
  Tree,
  formatFiles,
  generateFiles,
  names,
  readProjectConfiguration,
  joinPathFragments,
} from '@nx/devkit';
import * as path from 'path';

export interface ComponentGeneratorSchema {
  name: string;
  project: string;
  directory?: string;
  withVariants?: boolean;
  withForwardRef?: boolean;
  dryRun?: boolean;
}

interface NormalizedOptions extends ComponentGeneratorSchema {
  projectRoot: string;
  componentDirectory: string;
  fileName: string;
  className: string;
  propertyName: string;
}

function normalizeOptions(
  tree: Tree,
  options: ComponentGeneratorSchema
): NormalizedOptions {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const projectRoot = projectConfig.sourceRoot || `${projectConfig.root}/src`;

  const componentNames = names(options.name);
  const directory = options.directory || 'components';

  const componentDirectory = joinPathFragments(
    projectRoot,
    directory,
    componentNames.fileName
  );

  return {
    ...options,
    projectRoot,
    componentDirectory,
    fileName: componentNames.fileName,
    className: componentNames.className,
    propertyName: componentNames.propertyName,
    withVariants: options.withVariants ?? false,
    withForwardRef: options.withForwardRef ?? true,
  };
}

export default async function componentGenerator(
  tree: Tree,
  options: ComponentGeneratorSchema
): Promise<void> {
  const normalizedOptions = normalizeOptions(tree, options);

  // Generate files from templates
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    normalizedOptions.componentDirectory,
    {
      ...normalizedOptions,
      name: normalizedOptions.className,
      fileName: normalizedOptions.fileName,
      tmpl: '', // Used to strip .template extension
    }
  );

  if (!options.dryRun) {
    await formatFiles(tree);
  }

  console.log(
    `\n✅ Component ${normalizedOptions.className} created at ${normalizedOptions.componentDirectory}`
  );
  console.log(`\nFiles created:`);
  console.log(`  - ${normalizedOptions.className}.tsx`);
  console.log(`  - ${normalizedOptions.className}.test.tsx`);
  console.log(`  - index.ts`);
}
