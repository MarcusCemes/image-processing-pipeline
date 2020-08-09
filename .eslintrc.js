/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  root: true,

  env: {
    node: true,
    es6: true,
  },

  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "header"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
  ],

  rules: {
    "@typescript-eslint/no-use-before-define": OFF,
    "@typescript-eslint/no-explicit-any": OFF,

    "react/prop-types": OFF,

    "header/header": [
      ERROR,
      "block",
      [
        "*",
        " * Image Processing Pipeline - Copyright (c) Marcus Cemes",
        " *",
        " * This source code is licensed under the MIT license found in the",
        " * LICENSE file in the root directory of this source tree.",
        " ",
      ],
    ],
  },

  settings: {
    react: {
      pragma: "React",
      version: "16.8",
    },
  },
};
