/* eslint-disable */

const { execSync } = require("child_process");
const { mkdirSync, rmSync, statSync, mkdtempSync } = require("fs");
const { tmpdir } = require("os");
const { resolve, join } = require("path");

const ESC = "\x1B[";
const RED = ESC + "31;49m";
const RED_BG = ESC + "30;41m";
const RESET = ESC + "0m";

const BUILD_MATRIX = [
  {
    os: "darwin",
    arch: "amd64",
    filename: "primitive-darwin-amd64",
  },
  {
    os: "darwin",
    arch: "arm64",
    filename: "primitive-darwin-arm64",
  },
  {
    os: "linux",
    arch: "amd64",
    filename: "primitive-linux-amd64",
  },
  {
    os: "windows",
    arch: "amd64",
    filename: "primitive-win32-amd64.exe",
  },
];

function main() {
  // Create a temporary directory for compilation
  const vendorDir = resolve(__dirname, "..", "vendor");
  const tmpDir = mkdtempSync(join(tmpdir(), "ipp-"));

  // Remove the directory on exit
  process.on("beforeExit", () => {
    console.log("🚀 Cleaning up...");
    rmSync(tmpDir, { force: true, recursive: true });
  });

  // Clone the repository
  createIfNotExist(vendorDir);

  console.log("📥 Cloning repository...");
  execSync("git clone https://github.com/fogleman/primitive", { cwd: tmpDir });

  // Newer Go versions make it more difficult to compile non-module executables...
  console.log("🔨 Setting up Go module...");
  const buildDir = join(tmpDir, "primitive");
  execSync("go mod init github.com/fogleman/primitive", { cwd: buildDir });
  execSync("go mod tidy", { cwd: buildDir });

  // Cross-compile for each platform
  for (const { os, arch, filename } of BUILD_MATRIX) {
    console.log(`🏗️  Building primitive executable for ${os} (${arch})`);

    const outputPath = resolve(vendorDir, filename);
    execSync(`go build -o "${outputPath}"`, {
      cwd: buildDir,
      env: { ...process.env, GOOS: os, GOARCH: arch },
    });
  }
}

try {
  main();
} catch (err) {
  process.exitCode = 1;
  console.error(
    RED_BG +
      " IPP COMPILE ERROR " +
      RED +
      "\nThere was a problem compiling a required Go dependency.\nYou may not have the Go toolchain installed.\n\nIf you are a user of IPP and received this error, please open an issue on the GitHub repository describing the steps leading to this error:\n" +
      RESET
  );
  console.error(err);
  console.error("");
}

function createIfNotExist(dir) {
  try {
    statSync(dir);
  } catch (err) {
    if (err.code === "NOENT") mkdirSync(dir);
  }
}
