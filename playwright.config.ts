import { defineConfig } from "@playwright/test";

const clientPort = 15173;
const serverPort = 13001;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  use: {
    baseURL: `http://127.0.0.1:${clientPort}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: `CLIENT_PORT=${clientPort} SERVER_PORT=${serverPort} INFERENCE_PROVIDER=mock npm run dev`,
    url: `http://127.0.0.1:${clientPort}/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
