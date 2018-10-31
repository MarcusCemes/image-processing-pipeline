/**
 *
 *
 */
const RIBConfig = function() {

  //TODO safe mode

  this.$schema = "https://raw.githubusercontent.com/MarcusCemes/responsive-image-builder/master/%24schema/config.json";

  this.input = null, // the directory containing all the source images
  this.output = null, // the directory to output images to
  this.manifest = true, // export a manifest.json with all exported images
  this.clean = false, // remove verything in output before starting. This can be overridden with options.force

  this.SILENT = 0
  this.ERRORS = 1;
  this.VERBOSE = 2;

  this.interactive = true, // if false, throws an error when requiring confirmation. Override with option "force"
  this.force = false, // Blindly accept any interactive prompt to create/delete any files/folders. USE ONLY IF YOU KNOW WHAT YOU ARE DOING
  this.verbosity = this.VERBOSE, // VERBOSE, ERRORS or SILENT
  this.max_threads = 0, // Maximum number of threads to create, or 0 for cores availiable

  // Default image export presets
  // To avoid duplicate exports, these should be in order of image sizes,
  // from smallest to largest!
  this.exports = [{
      name: 'thumbnail',
      width: 8,
      height: 8,
      force: true
    },
    {
      name: 'small',
      width: 1280,
      height: 720,
      force: true
    },
    {
      name: 'normal',
      width: 1920,
      height: 1080,
      default: true
    },
    {
      name: 'large',
      width: 3840,
      height: 2160
    }
  ]


  this.parse = function(options) {
    if (options) {
      for (const key of Object.keys(options)) {
        this[key] = options[key];
      }
    }
    if (!verify_schema()) throw new Error('Bad options passed. Refer to the options schema');
  }

  // TODO
  function verify_schema() {
    return true;
  }

}

module.exports = RIBConfig;