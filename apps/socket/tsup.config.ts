import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  outDir: "dist",
  noExternal: ["@repo/trpc", "@repo/error", "@repo/services", "@repo/database", "@repo/logger", "@repo/socket"],
  external: ["bcrypt"],
  clean: true,
});
