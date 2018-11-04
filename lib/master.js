
/* IMPORTS */

const chalk       = require('chalk')  // will be required on demand
const fs          = require('fs');
const path        = require('path');
const readline    = require('readline');
const glob        = require('glob');
const RIBResponse = require(path.join(__dirname, 'response.js'));
const Controller  = require(path.join(__dirname,'controller.js'));
let debug; try { debug = require('debug')('RIBmaster') } catch (err) { debug = () => {} };

let options;

async function Master(passed_options) {
  options = passed_options;
  let response;

  // Initialize helper functions
  init();

  // Verify if input and output paths were specified in options
  // Will throw an error if incorrect, rejecting the promise
  verify_options();

  // Verify whether paths exist with correct permissions
  // Will throw an error if now (async)
  await verify_paths();

  // Fetch all images
  const image_list = await fetch_images();
  await sleep(50);

  // Exit if no images were found
  if (!image_list) {

    response = generate_no_images_response();

  } else {

    await clean_output_path();


    const ctrl = new Controller(image_list, options);
    ctrl.prepare();
    ok('Created ' + ctrl.workers.length + ' threads');
    ctrl.progressEmitter.on('progress', updateProgress);
    print();
    updateProgress(0);

    await ctrl.run();


    ctrl.progressEmitter.removeListener('progress', updateProgress);
    clear();
    raw('Destroying cluster...');
    await ctrl.shutdown();
    await sleep(500);

    // Process the results
    const ctrl_result = ctrl.getResult();

    clear();
    if (ctrl_result.errors.length === 0) {
      ok(ctrl_result.completed.length + ' images exported successfully');
    } else {

      const errors_json = JSON.stringify(ctrl_result.errors);
      fs.writeFileSync(path.join(options.output, 'errors.json'), errors_json);

      if (ctrl_result.errors.length === image_list.length) {
        print();
        error('All images failed to export. This may be an internal error.');
        error('See errors.json for more information');
      } else {
        print();
        error(ctrl_result.errors.length + ' images failed to export. The full log is in errors.json');
      }
    }

    // Show compression stats
    ok(human_size(ctrl_result.raw_bytes) + ' of raw data generated');
    const compression_ratio = Math.round((ctrl_result.uncompressed_bytes - ctrl_result.compressed_bytes) / ctrl_result.uncompressed_bytes * 100);
    if (options.optimize) {
      ok(human_size(ctrl_result.compressed_bytes) + ' of optimized data written, with a ' + compression_ratio + '% compression ratio');
    } else {
      ok(human_size(ctrl_result.uncompressed_bytes) + ' of data written (not optimized)');
    }


    // Write the export manifest
    if (options.manifest) {
      const manifest = {};
      manifest['$schema'] = "https://raw.githubusercontent.com/MarcusCemes/responsive-image-builder/master/%24schema/manifest.json";
      manifest['exports'] = ctrl_result.completed;
      const manifest_json = JSON.stringify(manifest);
      fs.writeFileSync(path.join(options.output, 'manifest.json'), manifest_json);
  
      print();
      ok('List of exports has been written to manifest.json');
    }


    const response_errors = ctrl_result.errors.length === 0 ? null : ctrl_result.errors;

    response = new RIBResponse('OK', 'All images processed', true, false, response_errors);

  }




  print();
  print(chalk.bold.green('Complete.'));
  return response;
}



/* VARIABLES */

/* helpful stdout functions */
let ok        = () => {};  // print ok
let error     = () => {};  // print error
let warning   = () => {};  // print warning
let question  = () => {}; // print question
let raw       = () => {};  // Direct stdout access
let clear     = () => {};  // clearline access
let print     = () => {};  // console.log access


/**
 *  Prints an error to the console, and throws
 * the same error.
 *
 * @param {String} error
 * @throws {Error} A new Error, with the error message
 */
function fail(error) {
  if (options.verbosity !== options.SILENT) {
    print();
    print(chalk.bold.red('   [FAIL] ' + error));
    print();
  }
  throw new RIBResponse('FATAL', error, false, true, null);
}

/**
 * Generate a quick and dirty GUID
 *
 * @returns {String} A dirty GUID
 */
function bad_guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Convert size in bytes (number) to a human readable size
 *
 * @param {Number} size The size in bytes
 * @returns {String} Human readable size e.g. 12GB
 */
function human_size(size) {
  const suffix = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  let pointer = 0;
  while (size >= 1024) {
    pointer++;
    size /= 1024;
  }
  return (Math.round(size * 10) / 10) + suffix[pointer];
}

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}


function mkDirSyncRecursive(dir) {
  let segments = dir.split(path.sep);
  let new_path = '';
  let bypass = false; // Skip fs.existsSync if a directory had to be made
  for (const seg of segments) {
    new_path = ( new_path === '' ? seg : path.join(new_path, seg) ); // Fix Windows drive letters
    if (bypass || (bypass = !fs.existsSync(new_path))) {
      fs.mkdirSync(new_path);
    }
  }
}




/* FUNCTIONS */


/**
 * Initialize the Master node
 */
function init() {
  if (options.verbosity === options.VERBOSE) {
  console.log();
  console.log('         Responsive Image Builder');
  console.log('       Copyright © 2018 Marcus Cemes');
  console.log('       https://github.com/MarcusCemes');
  console.log();
  }


  if (options.verbosity !== options.SILENT) {
  
    // Import terminal colour libary if necessary
    if (options.verbosity === options.ERRORS) {
      error = chalk.bold.red;
      warning = msg => console.log(chalk.bold.hex('#FF851B')(msg));
      question = msg => { console.log(chalk.bold.magenta('? ') + chalk.cyan(msg) + ' y/n') }

    } else if (options.verbosity === options.VERBOSE) {
  
      // Helpful console functions
    print   = console.log;
      ok      = msg => print(chalk.bold.green('     [OK] ') + msg);
      error   = msg => print(chalk.bold.red('  [ERROR] ' + msg));
      question = msg => print(chalk.bold.magenta('? ') + chalk.cyan(msg));
      raw     = msg => process.stdout.write(msg);
      clear   = () => { process.stdout.cursorTo(0); process.stdout.clearLine() };
      warning = msg => print(chalk.bold.hex('#FF851B')('[WARNING] ' + msg));
    }
  
    // For pretty keypress prompts
    if (options.interactive) {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
    }
  }
  
}

/**
 * Verify whether input and output paths were provided in options
 *
 * @returns true
 * @throws Error if paths aren't present
 */
function verify_options() {
  if (!options.input || typeof options.input !== 'string') {
    fail('No input directory provided');
  }
  if (!options.output || typeof options.input !== 'string') {
    fail('No output directory provided');
  }
  return true;
}

/**
 *  Checks whether input and output paths exist
 *
 * @returns true
 * @throws Error if path doesn't exist
 */
async function verify_paths() {
  let fs_test;
  options.input = path.resolve(options.input);
  options.output = path.resolve(options.output);

  raw('Checking input directory...');
  fs_test = fs.existsSync(options.input);
  clear();
  if (!fs_test) {
    warning('Input directory doesn\'t exist');
    question('Would you like to create the directory?');
    if (await prompt()) {
      mkDirSyncRecursive(options.input);
    } else {
      fail('Could not access the input directory');
    }
  }

  raw('Checking output directory...');
  fs_test = fs.existsSync(options.output);
  clear();
  if (!fs_test) {
    warning('Output directory doesn\'t exist');
    question('Would you like to create the directory?');
    if (await prompt()) {
      mkDirSyncRecursive(options.output);
    } else {
      fail('Could not access the output directory');
    }
  }
  
  // Check read/write permissions
  try {
    fs.accessSync(options.input, fs.constants.R_OK);
    ok('Read permissions  ' + chalk.bold.green('✓'));
  }
  catch (err) {
    error(err);
    fail("No read permissions for the input directory");
  }

  try {
    fs.accessSync(options.output, fs.constants.W_OK);

    let bg = bad_guid();
    fs.writeFileSync(path.join(options.output, bg), ''); // Test for write, the ultimate test
    fs.unlinkSync(path.join(options.output, bg));
  
    ok('Write permissions ' + chalk.bold.green('✓'));
  } catch (err) {
    fail('No write permissions for the output directory');
  }
  
  return true;
}

/**
 * Scan the input dircetory recursively, and
 * return a list of all detected image files
 * @returns {Array} of relative image paths
 *
 */
async function fetch_images() {
  raw('Scanning input directory...');
  const input_path = path.resolve(options.input);
  let images = await new Promise((resolve, reject) => glob(path.join(input_path + '/**/*.{jpg,jpeg,png,svg,tiff,webp,gif}'), {absolute: true}, (err, files) => {
    if (err) {
      reject(err);
    } else {
      resolve(files);
    }
  }));

  clear();
  const image_count = images.length;
  if (image_count === 0) {
    warning('Found no images to process.');
    return false;
  }

  ok('Found ' + image_count + ' image(s)');
  return images;
}


/**
 * Update the console with completion percent
 *
 * @param {Number} progress Between 0-1 showing the completion
 */
function updateProgress(progress) {

  const percent = Math.floor(progress*100);
  const size = 25;
  const bars = Math.floor(percent * 25 / 100);
  const empty = size - bars;
  clear();
  raw('     [' + '█'.repeat(bars) + '.'.repeat(empty) + ']  ' + percent + '%');

}

/**
 *  Generate a response with the NOIMG response code
 *
 * @returns A RIB Response
 */
function generate_no_images_response() {
  const manifest_path = path.resolve(path.join(options.output, 'manifest.json'));
  fs.writeFileSync(manifest_path, JSON.stringify({exports:[]}), 'utf8'); // write an empty manifest
  return new Response(
    'NOIMG',
    'No images found to process',
    true,
    false,
    null
  );
}


async function clean_output_path() {
  try {
    const children = fs.readdirSync(options.output);
    if (children.length !== 0) {

      let clear_authorisation = false;
      if (options.clean) {
        clear_authorisation = true
      } else {
        warning('Output directory is not empty!');
        question('Would you like to delete its contents?')
        if (await prompt()) {
          clear_authorisation = true;
        }
      }

      if (clear_authorisation) {

        // Remove the output directory contents
        function rrm_dir(dir_path, root=true) {
          let files;
          try { 
            files = fs.readdirSync(dir_path); 
          }
          catch (err) {
            fail('Failed to clean the output directory.');
          }
          if (files.length > 0)
            for (let i = 0; i < files.length; i++) {
              let filePath = dir_path + '/' + files[i];
              if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
              else
                rrm_dir(filePath, false);
            }
            if (!root) fs.rmdirSync(dir_path);
        }

        rrm_dir(options.output);

        ok('Output directory cleaned ' + chalk.bold.green('✓'));

        return true;

      } else {
        fail('Output is not empty. Safely exiting.')
      }

    }
  } catch (err) {
    fail('Failed to clean output' + (err.error? ': ' + err.error : ''));
  }
}


/**
 * Confirm a choice with an interactive prompt if possible,
 * returning a promise. Will fail immediately if interactive
 * is false, or succeed immediately if force is true.
 * 
 */
async function prompt() {
  if (options.force) {
    print(chalk.bold.green('✓ Approved') + chalk.bold.hex('#FF851B')(' (forced)'));
    print();
    return true;

  } else if (options.verbosity === options.SILENT) {
    return false;
  } else if (options.interactive) {

    process.stdin.resume();

    return new Promise(resolve => {

      let timeout = false;
      let state = 0;

      function blinker() {
        clear();
        if (state === 0) {
          raw(' >  CONFIRM y/n  < ');
        } else {
          raw('  > CONFIRM y/n <  ');
        }
        process.stdout.cursorTo(0);
        state++;
        state %= 2;
      }

      let interval = setInterval(blinker, 1000).unref();
      blinker();
      process.stdin.on('keypress', function keypress(str, key) {

        function exit(state, msg) {
          clearInterval(interval);
          clearTimeout(timeout);
          process.stdin.removeListener('keypress', keypress);
          clear();
          options.verbosity === options.ERRORS ? console.log(msg) : print(msg);
          print();
          resolve(state);
          process.stdin.pause(); // Otherwise the program won't exit when complete
          return;
        }

        if (key && key.name === 'y') {
          exit(true, chalk.bold.green('✓ Approved'));
        } else if (key && key.name === 'n') {
          exit(false, chalk.bold.red('X Rejected'));
        } else {
          clearInterval(interval);
          clearTimeout(timeout);
          timeout = setTimeout( () => interval = setInterval(blinker, 1000).unref() , 500).unref();
          clear();
          raw(chalk.bold.red('  -- BAD KEY --  '));
        }
      });
    });

  } else {
    print(chalk.bold.red('X Rejected') + chalk.bold.hex('#FF851B')(' (not interactive)'));
    print();
    return false;
  }
}


module.exports = Master;
