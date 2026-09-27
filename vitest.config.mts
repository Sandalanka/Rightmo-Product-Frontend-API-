import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    // "server-only" throws outside Next's server bundle; server modules are unit-tested directly here.
    alias: { "server-only": fileURLToPath(new URL("./tests/utils/empty.ts", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
