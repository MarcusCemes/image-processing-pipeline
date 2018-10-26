#! /usr/bin/env node

const program = require('commander');

program
  .version('1.0.0')
  .option('-i, --input <path>', 'Folder containing the images')
  .option('-o, --output <path>', 'Folder to output images to')
  .option('-e, --exports <path>', 'Path to JSON encoded export presets')
  .option('--no-interactive', 'Disable stdin interaction')
  .option('-f, --force', 'Enable forced execution (DANGEROUS!)')
  .option('-c, --clean', 'Empty the output folder beforehand')
  .option('-t, --max-threads <number>', 'Maximum number of threads to create', parseInt)
  .option('--shy', 'Talk less (errors only)')
  .option('-s, --silent', 'Disable all stdout output')
  .option('--no-manifest', 'Don\'t generate a manifest.json')
  .parse(process.argv);


const config = {};

if (typeof program.input !== 'undefined') config.input = program.input;
if (typeof program.output !== 'undefined') config.output = program.output;
if (typeof program.exports !== 'undefined') {
  try {
    const fs = require('fs');
    if (fs.statSync(program.exports).isFile) {
      config.exports = JSON.parse(fs.readFileSync(program.exports));
    }
  } catch (err) {
    throw new Error('Could not decode the exports JSON file');
  }
}
if (typeof program.interactive !== 'undefined') config.interactive = program.interactive;
if (typeof program.force !== 'undefined') config.force = program.force
if (typeof program.clean !== 'undefined') config.clean = program.clean;
if (typeof program.maxThreads !== 'undefined' && !isNaN(program.maxThreads)) config.max_threads = program.maxThreads;
if (typeof program.shy !== 'undefined') config.verbosity = 1;
if (typeof program.silent !== 'undefined') config.verbosity = 0;
if (typeof program.manifest !== 'undefined') config.manifest = program.manifest;

const rib = require('../lib/index.js');

rib(config).catch(console.log);
