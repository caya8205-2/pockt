import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'pockt.test.db',
    },
    globalSetup: './tests/global-setup.ts',
  },
});
