import type { Config } from "jest";

const config: Config = {
  verbose: true,
  silent: false,
  testEnvironment: "node",
  preset: "ts-jest/presets/default-esm",
  roots: ["<rootDir>"],
  testMatch: ["**/*.spec.ts"],
  moduleDirectories: ["node_modules", "test"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "@/(.*)": "<rootDir>/src/$1",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov"],
  setupFiles: ["dotenv/config"],
  // coverageThreshold: {
  //   global: {
  //     branches: 50, // 90,
  //     functions: 50, // 95,
  //     lines: 50, // 95,
  //     statements: 50, // 95,
  //   },
  // },
  testTimeout: 30000, // Add global timeout here
  // To help avoid exhausting all the available fds.
  maxWorkers: 1,
};

export default config;
