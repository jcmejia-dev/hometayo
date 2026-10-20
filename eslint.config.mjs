import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["components/rental-workspace.tsx"],
    rules: {
      "react-hooks/purity": "off",
    },
  },
  {
    files: ["components/rental-center.tsx"],
    rules: {
      // load() only commits state after awaited fetches; this rule reports the
      // effect's indirect async loader call as a synchronous state update.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "apps/mobile/**"]),
]);
