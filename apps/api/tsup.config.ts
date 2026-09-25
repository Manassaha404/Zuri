import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  outDir: "dist",
  noExternal: ["@repo/trpc", "@repo/error", "@repo/services", "@repo/database", "@repo/logger"],
  external: ["bcrypt", "pdf-parse"],
  clean: true,
});
