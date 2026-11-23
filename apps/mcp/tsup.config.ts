import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  outDir: "dist",
  noExternal: [
    "@repo/error",
    "@repo/services",
    "@repo/database",
    "@repo/logger",
  ],
  external: ["bcrypt"],
  clean: true,
});
