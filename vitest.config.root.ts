import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['functions/lib/**', 'functions/node_modules/**', 'node_modules/**'],
  },
});
