import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./lib/testing/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    testTimeout: 15_000,
    pool: "threads",
    environment: "node",
    setupFiles: [
      fileURLToPath(new URL("./node_modules/dotenv/config.js", import.meta.url)),
    ],
    exclude: [
      "**/node_modules/**",
      "**/.phase10-tmp/**",
      "**/vendor/**",
      "**/.next/**",
      "**/backup_before_orbit_implementation/**",
      "**/scripts/generate-report-samples.test.ts",
    ],
    include: ["**/*.test.{ts,tsx}"],
  },
});




