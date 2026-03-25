import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'bin/cli.ts',
  },
  format: ['esm'],
  dts: { entry: 'src/index.ts' },
  splitting: true,
  clean: true,
  target: 'node18',
  banner: ({ format }) => {
    if (format === 'esm') {
      return {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
      };
    }
    return {};
  },
});
