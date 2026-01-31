import {
  Tree,
  formatFiles,
  generateFiles,
  names,
  joinPathFragments,
} from '@nx/devkit';
import * as path from 'path';

export interface ResolverGeneratorSchema {
  name: string;
  module?: string;
  withQuery?: boolean;
  withMutation?: boolean;
  dryRun?: boolean;
}

interface NormalizedOptions extends ResolverGeneratorSchema {
  resolverName: string;
  fileName: string;
  className: string;
  propertyName: string;
  constantName: string;
  outputPath: string;
  module: string;
}

function normalizeOptions(options: ResolverGeneratorSchema): NormalizedOptions {
  const resolverNames = names(options.name);

  const module = options.module || 'graph';
  const outputPath = joinPathFragments('apps', 'backend', module);

  return {
    ...options,
    module,
    resolverName: resolverNames.className,
    fileName: resolverNames.fileName,
    className: resolverNames.className,
    propertyName: resolverNames.propertyName,
    constantName: resolverNames.constantName,
    outputPath,
    withQuery: options.withQuery ?? true,
    withMutation: options.withMutation ?? true,
  };
}

export default async function resolverGenerator(
  tree: Tree,
  options: ResolverGeneratorSchema
): Promise<void> {
  const normalizedOptions = normalizeOptions(options);

  // Ensure the output directory exists
  const outputDir = normalizedOptions.outputPath;

  // Generate files from templates
  generateFiles(tree, path.join(__dirname, 'files'), outputDir, {
    ...normalizedOptions,
    tmpl: '', // Used to strip .template extension
  });

  if (!options.dryRun) {
    await formatFiles(tree);
  }

  console.log(
    `\n✅ Resolver ${normalizedOptions.className} created at ${normalizedOptions.outputPath}`
  );
  console.log(`\nFiles created:`);
  console.log(`  - ${normalizedOptions.fileName}_resolvers.go`);
  console.log(`  - ${normalizedOptions.fileName}_resolvers_test.go`);
  console.log(`\nNext steps:`);
  console.log(`  1. Add the resolver to your gqlgen schema (if using gqlgen)`);
  console.log(`  2. Implement the business logic in the resolver methods`);
  console.log(`  3. Run 'go test ./...' to verify tests pass`);
}
