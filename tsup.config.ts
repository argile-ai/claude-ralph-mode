import { defineConfig } from "tsup";

export default defineConfig([
  // CLI entry with shebang
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node18",
    shims: true,
    splitting: false,
    treeshake: true,
    minify: false,
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  // Library entry without shebang
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: false, // Don't clean, cli already built
    sourcemap: true,
    target: "node18",
    shims: true,
    splitting: false,
    treeshake: true,
    minify: false,
  },
]);
