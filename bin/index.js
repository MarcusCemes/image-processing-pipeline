#!/usr/bin/env node

// Show a message and hide cursor while requiring modules
const allowOutput = process.argv.indexOf("errors") === -1 && process.argv.indexOf("silent") === -1;
if (allowOutput && process.argv.indexOf("-V") === -1) {
  process.stdout.write("Just a sec...\r\x1b[?25l");
}

const merge = require("deepmerge");
const program = require("commander");
const cosmiconfig = require("cosmiconfig");
const explorer = cosmiconfig("rib");
const platform = require("os").platform();
const gradient = platform !== "win32" ? require("gradient-string")
  ([{color: '#2193b0', pos: 0},{color: '#6dd5ed', pos: 1}]).multiline : v => v;
const indent = require("indent-string");

function intParser(input) {
  if (typeof input === "string" && input.length > 0) return parseInt(input);
  return undefined;
}

const header = indent(gradient(`   ______   _____ _______
  (, /   ) (, /  (, /    )
    /__ /    /     /---(
 ) /   \\____/__ ) / ____)
(_/    (__ /   (_/ (`, { interpolation: "hsv" }), 10);

program
  .name("rib")
  .description(`${header}

  Responsive Image Builder - https://git.io/fjvL7

  An ultra-fast WebP build pipeline, for the web!\x1b[?25h`) // Show the cursor if help is displayed
  .usage("-i <paths> -o <path> [options]")

  .option("-i, --in <paths>", 'Input paths (separated with three periods "...")')
  .option("-o, --out <path>", "Output path")
  .option("--no-manifest", "Disable manifest export")
  .option("--no-clean", "Disable output folder cleaning before export")
  .option("-l, --flat", "Enable flat export (all images in the same folder)")
  .option("-v, --verbosity [verbosity]", "Change logging level, should be 'verbose', 'errors' or 'silent'")
  .option("-F, --force", "Force overwriting of files without warning")
  .option("-I, --increment", "Increment conflicting exports")
  .option("-t, --threads [number]", "The maximum number of threads to use (0 for all CPU cores)", intParser)
  .option("-f, --fingerprint", "Enable original file fingerprinting (manifest entry)")
  .option("-a, --hash-algorithm [algorithm]", "The fingerprint algorithm to use, such as 'md5'")
  .option("-s, --short-hash", "Trim hashes in the manifest file to only a few characters")
  .option("--no-trace", "Disable placeholder SVG tracing")
  .option("--no-fallback", "Disable fallback format exports")
  .option("--no-webp", "Disable WebP format exports")
  .option("--no-resize", "Disable image resizing (based on export presets)")
  .option("--no-optimize", "Disable image optimization")
  .option("-c, --convert [format]", "Convert the fallback format to the specified format")
  .option("--single-template [template]", "The template to use for file-naming single exports")
  .option("--multiple-template [template]", "The template to sue for file-naming multiple export")
  .option("--trace-template [template]", "The template to sue for SVG traces")

  .parse(process.argv);

allowOutput && process.stdout.write("\x1b[?25l");

// Search for additional configuration
explorer.search()
  .then(result => {
    return result ? result.config : null;
  })
  .catch(error => {
    console.error('An error occurred while searching for configuration');
    console.error(error);
  }).then(config => {

    config = config || {};  // read config
    const CLIConfig = {};   // config from flags

    /** Map the CLI option names to config keys */
    const configMappings = {
      in: null,
      out: null,
      manifest: "exportManifest",
      clean: "cleanBeforeExport",
      flat: "flatExport",
      verbosity: null,
      force: null,
      increment: "incrementConflicts",
      threads: null,
      hashAlgorithm: null,
      shortHash: null,
      fallback: "exportFallback",
      webp: "exportWebp",
      resize: null,
      optimize: null,
      convert: null,
      singleTemplate: "singleExportTemplate",
      multipleTemplate: "multipleExportTemplate",
      fingerprint: null,
      trace: null,
      traceTemplate: null
    }

    for (const prop of Object.keys(configMappings)) {
      if (typeof program[prop] !== "undefined") {
        if (configMappings[prop] === null) {
          CLIConfig[prop] = program[prop];
        } else {
          CLIConfig[configMappings[prop]] = program[prop];
        }
      }
    }

    const finalConfig = merge(config, CLIConfig);

    // special CLI format of input paths

    if (finalConfig.in) finalConfig.in = finalConfig.in.split("...");

    const { responsiveImageBuilder } = require("../");

    // Remove the message now that everything is loaded
    allowOutput && process.stdout.write("\x1b[K\x1b[?25h");

    return { finalConfig, responsiveImageBuilder };

  }).catch(err => {
    process.stderr.write("\x1b[?25h\n\x1b[31m");
    if (err.code === "MODULE_NOT_FOUND") {
      process.stderr.write("A required dependency is not installed\x1b[m\n");
      process.stderr.write("Try running \x1b[33mnpm i\x1b[m\n");
      process.stderr.write("\n" + (err.message || err) + "\n");
    } else {
      process.stderr.write("An error was encountered before the RIB module could be loaded\x1b[m\n");
      process.stderr.write("This problem occurred before execution of the module\n");
      process.stderr.write("\n" + (err.message || err) + "\n");
    }
  }).then(obj => {

    if (!obj) return;

    // Used to avoid a CMD bug with Windows
    // An empty command is executed when stdin raw mode is disabled and stream is paused
    // inside of an asynchronous loop. This signals that process.exit will be called at the end
    process.env['CLI_MODE'] = 1

    // Errors are printed to terminal in CLI mode
    // These are not normally execution errors, but bugs
    const programPromise = obj.responsiveImageBuilder(obj.finalConfig);
    return programPromise;
  }).then(() => {
    process.exit();
  }).catch(err => {
    console.error('The CLI wrapper detected an error during execution\n');
    console.error(err);
    process.exit(1);
  });
