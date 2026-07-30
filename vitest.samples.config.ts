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
    pool: "threads",
    environment: "node",
    setupFiles: [
      fileURLToPath(new URL("./node_modules/dotenv/config.js", import.meta.url)),
    ],
    include: ["scripts/generate-report-samples.test.ts"],
  },
});

