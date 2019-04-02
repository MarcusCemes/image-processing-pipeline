// Responsive Image Builder - Constants
// Contains general configurable constants used by the program

/** File extensions recognized by RIB as images */
export const SUPPORTED_EXTENSIONS = [
  "png",
  "jpeg",
  "jpg",
  "svg",
  "gif",
  "webp",
  "tiff",
  "tif",

  // Same but in uppercase
  "PNG",
  "JPEG",
  "JPG",
  "SVG",
  "GIF",
  "WEBP",
  "TIFF",
  "TIF"
];

/** Used to wrap/centre content in the terminal into a column */
export const WRAP_WIDTH = 40;

/** The trimmed length of shortHash */
export const SHORT_HASH_LENGTH = 8;

/** The maximum failsafe export incrementation before failing */
export const INCREMENT_LIMIT = 64;

/** Errors for the Main and Config class */
export const MAIN_ERRORS = {
  configError: "E000 Bad config"
};

/** Errors for the Preparation class */
export const PREPARATION_ERRORS = {
  generalError: "E100 General preparation error",
  fatalError: "E101 Fatal preparation error",
  outputNotEmptyError: "E102 Output not empty",
  noImagesError: "E103 No images"
};

/** Errors for the Controller class */
export const CONTROLLER_ERRORS = {
  fatalError: "E300 Fatal controller error"
};
