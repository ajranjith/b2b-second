#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const binary = path.resolve(
  projectRoot,
  "node_modules",
  ".bin",
  isWindows ? "eslint.cmd" : "eslint",
);

const args = ["."];
const result = spawnSync(binary, args, {
  stdio: "inherit",
  cwd: projectRoot,
  shell: isWindows,
});

if (result.error) {
  console.error("Failed to run ESLint:", result.error);
}

const exitCode = result.status ?? 1;
process.exit(exitCode);
