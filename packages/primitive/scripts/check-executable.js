/* eslint-disable */

const { arch, platform } = require("os");
const { existsSync } = require("fs");
const { join, resolve } = require("path");

const ESC = "\x1B[";
const YELLOW = ESC + "31;33m";
const RESET = ESC + "0m";

const VENDOR_DIR = resolve(__dirname, "..", "vendor");

if (!existsSync(join(__dirname, "../.no-postinstall")) && !existsSync(getExecutable())) {
  console.log(
    YELLOW +
      "WARNING: @ipp/primitive could not find a pre-compiled executable for your target system.\nYou can either try compiling the executable yourself (see scripts/build-vendor.js), or open an issue on the repository." +
      RESET
  );
}

function getExecutable() {
  const a = getArch();
  const p = platform();
  const e = p === "win32" ? ".exe" : "";

  return join(VENDOR_DIR, `primitive-${p}-${a}${e}`);
}

function getArch() {
  const a = arch();
  switch (a) {
    case "x32":
      return "amd";

    case "x64":
      return "amd64";

    default:
      return a;
  }
}
