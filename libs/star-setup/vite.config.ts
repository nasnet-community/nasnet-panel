import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import tsconfigPaths from "vite-tsconfig-paths";
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig(() => {
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/libs/star-setup',
    build: {
      outDir: '../../dist/libs/star-setup',
      target: "es2020",
      lib: {
        entry: "./src/index.ts",
        formats: ["es", "cjs"],
        fileName: (format, entryName) =>
          `${entryName}.qwik.${format === "es" ? "mjs" : "cjs"}`,
      },
      rollupOptions: {
        output: {
          preserveModules: false,
        },
        // externalize deps that shouldn't be bundled into the library
        external: [
          /^node:.*/,
          '@builder.io/qwik',
          '@builder.io/qwik-city'
        ],
      },
    },
    plugins: [qwikVite(), tsconfigPaths({ root: "." }), nxViteTsPaths()],
  };
});
