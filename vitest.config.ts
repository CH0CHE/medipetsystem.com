import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/modules/auth/**",
        "src/modules/platform-admin/**",
        "src/lib/security/**",
        "src/lib/auth/**",
      ],
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 75,
        functions: 85,
      },
    },
  },
});
