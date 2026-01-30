import lint from "@cartercree/eslint-config/configs/typescript.js";

export default [
  ...lint,
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
  },
  // ...rest of config
];
