import { defineConfig } from "@playwright/test";

export const importAppPorts = {
  correct: 4301,
  "lost-input": 4302,
  "double-action": 4303,
  "confusing-status": 4304,
  "tablet-layout": 4305,
} as const;

export type ImportAppVariant = keyof typeof importAppPorts;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: { browserName: "chromium" },
  webServer: Object.entries(importAppPorts).map(([variant, port]) => ({
    command: `node tests/fixtures/import-app/server.mjs --variant ${variant} --port ${port}`,
    url: `http://127.0.0.1:${port}/__health`,
    reuseExistingServer: !process.env.CI,
  })),
});
