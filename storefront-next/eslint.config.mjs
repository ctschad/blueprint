import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const config = [
  {
    ignores: [
      ".next/**",
      ".next-dev/**",
      ".venv-litertlm/**",
      "archived-media/**",
      "coverage/**",
      "node_modules/**",
      "public/**",
      "default.profraw",
      "next-env.d.ts",
      "tmp-*.mjs",
      "tsconfig.tsbuildinfo"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@next/next/no-img-element": "off"
    }
  }
];

export default config;
