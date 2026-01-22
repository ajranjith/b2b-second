import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      // Forbid axios and node-fetch - use bffClient instead
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message: "Use bffClient from @/lib/bffClient instead of axios.",
            },
            {
              name: "node-fetch",
              message: "Use bffClient from @/lib/bffClient instead of node-fetch.",
            },
          ],
          patterns: [
            {
              group: ["axios/*"],
              message: "Use bffClient from @/lib/bffClient instead of axios.",
            },
          ],
        },
      ],
    },
  },
  // Restrict @prisma/client imports to lib/prisma.ts only
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/lib/prisma.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Import from @/lib/prisma instead. Direct @prisma/client imports bypass trace logging.",
            },
          ],
        },
      ],
    },
  },
  // Restrict global fetch in route handlers - use bffClient
  {
    files: ["**/app/api/**/*.ts", "**/routes/**/*.ts", "**/services/**/*.ts"],
    ignores: ["**/lib/bffClient.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "Use bffClient from @/lib/bffClient for internal calls. Global fetch bypasses trace context.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
