import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // versão estática antiga, guardada só como referência
    "_legacy-static/**",
  ]),
  {
    rules: {
      // As imagens usam posicionamento/proporção exatos do layout e muitas vêm do
      // painel (upload/data URL); <img> simples mantém o visual idêntico ao do PDF.
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
