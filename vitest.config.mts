import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Booking and order stores live on globalThis, so keep each test file in its own process.
    pool: "forks",
    unstubEnvs: true,
    testTimeout: 30_000,
  },
});
