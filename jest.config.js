/**
 * Image Processing Pipeline - Copyright (c) Marcus Cemes
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  preset: "ts-jest",

  testEnvironment: "node",

  roots: ["<rootDir>/packages", "<rootDir>/tests"],

  collectCoverageFrom: ["packages/*/src/**/*.ts"],

  testPathIgnorePatterns: ["node_modules"],
  coveragePathIgnorePatterns: ["node_modules", "index.ts"],

  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },

  moduleNameMapper: {
    "^@ipp/(.*)$": "<rootDir>/packages/$1/src",
  },
};
