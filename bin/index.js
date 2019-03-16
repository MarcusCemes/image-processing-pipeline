#!/usr/bin/env node

// Show a message and hide cursor while requiring modules
process.stdout.write("Just a sec...\r\x1b[?25l");

const merge = require("deepmerge");
const program = require("commander");
const cosmiconfig = require("cosmiconfig");
const explorer = cosmiconfig("rib");
const loudRejection = require('loud-rejection');
const { responsiveImageBuilder } = require("../");

loudRejection(error => {
  process.stdout.write("An asynchronous promise encountered an error during execution\n");
  console.log(error);
});

function intParser(input) {
  if (typeof input === "string" && input.length > 0) return parseInt(input);
  return undefined;
}

process.stdout.write("\x1b[?25h");

// Remove the message now that everything is loaded
process.stdout.write("\x1b[K\x1b[?25h");

program
  .version(require("../package.json").version)
  .name("rib")
  .description(`               ______   _____ _______
              (, /   ) (, /  (, /    )
                /__ /    /     /---(
             ) /   \\____/__ ) / ____)
            (_/    (__ /   (_/ (

  Responsive Image Builder - https://git.io/fjvL7

  An ultra-fast WebP build pipeline, for the web!`) // Show the cursor if help is displayed
  .usage("-i <paths> -o <path> [options]")
  .option("-i, --in <paths>", 'Input paths (separated with two periods "..")')
  .option("-o, --out <path>", "Output path")

  .option("--no-webp", "Disable WebP exports")
  .option("--no-manifest", "disable manifest export")
  .option("--no-clean", "Disable output cleaning before export")
  .option("-f, --flat", "Enable flat export (all images in root folder)")

  .option("-v, --verbosity", "Change logging level, should be 'verbose', 'errors' or 'silent'")
  .option("-F, --force", "Force clean without prompt and overwriting of images")

  .option("-t, --threads [number]", "Threads to use (0 for unlimited)", intParser)
  .option("--no-resize", "Disable image resizing (global)")
  .option("--no-optimize", "Disable image optimization (global)")
  .option("--webp-quality [number]", "WebP encoding quality (1-100)", intParser)
  .option("--webp-alpha-quality [number]", "WebP alpha channel quality (0-100)", intParser)
  .parse(process.argv);

process.stdout.write("\x1b[?25l");

// Search for additional configuration
explorer.search()
  .then(result => {
    return result ? result.config : null;
  })
  .catch(error => {
    console.error('An error occurred while searching for configuration');
    console.error(error);
  }).then(config => {

    config = config || {};

    const CLIConfig = {};
    if (typeof program.in !== "undefined")         CLIConfig.in                = program.in;
    if (typeof program.out !== "undefined")        CLIConfig.out               = program.out;
    if (typeof program.webp !== "undefined")       CLIConfig.exportWebp        = program.webp;
    if (typeof program.manifest !== "undefined")   CLIConfig.exportManifest    = program.manifest;
    if (typeof program.clean !== "undefined")      CLIConfig.cleanBeforeExport = program.clean;
    if (typeof program.flat !== "undefined")       CLIConfig.flatExport        = program.flat;
    if (typeof program.verbosity !== "undefined")  CLIConfig.verbosity         = program.verbosity;
    if (typeof program.force !== "undefined")      CLIConfig.force             = program.force;
    if (typeof program.threads !== "undefined")    CLIConfig.threads           = program.threads;
    if (typeof program.resize !== "undefined")     CLIConfig.resize            = program.resize;
    if (typeof program.optimize !== "undefined")   CLIConfig.optimize          = program.optimize;
    if (typeof program.webpQuality !== "undefined")      CLIConfig.webpQuality      = program.webpQuality;
    if (typeof program.webpAlphaQuality !== "undefined") CLIConfig.webpAlphaQuality = program.webpAlphaQuality;

    const finalConfig = merge(config, CLIConfig);

    if (finalConfig.in) finalConfig.in = finalConfig.in.split("..");


    return { finalConfig, responsiveImageBuilder };

  }).catch(err => {
    process.stderr.write("\x1b[?25h\n\x1b[31m");
    if (err.code === "MODULE_NOT_FOUND") {
      process.stderr.write("A required dependency is not installed\x1b[m\n");
      process.stderr.write("Try running \x1b[33mnpm i\x1b[m\n");
      process.stderr.write("\n" + (err.message || err) + "\n");
    } else {
      process.stderr.write("An error was encountered before the RIB module could be loaded\x1b[m\n");
      process.stderr.write("    This problem occurred before execution of the module\n");
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
    return obj.responsiveImageBuilder(obj.finalConfig);
  }).then(() => process.exit()).catch(err => {
    console.error('The CLI tool detected an error during execution\n');
    console.error(err);
    process.exit(1);
  });
