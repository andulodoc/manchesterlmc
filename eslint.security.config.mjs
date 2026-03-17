import security from "eslint-plugin-security";

export default [
  security.configs.recommended,
  {
    files: ["netlify/functions/**/*.mjs"],
    plugins: { security },
    rules: {
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-new-buffer": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "error",
    },
  },
];
