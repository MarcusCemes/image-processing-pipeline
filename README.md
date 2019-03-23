
<h1 align="center">Responsive Image Builder</h1>

<p align="center">
  <b>An ultra-fast WebP image building pipeline, for the web!</b>
  <br>
  <sub><i>The image side of web development should be so much easier by now...</i></sub>
</p>
<p align="center">
  <a alt="Link to NPM" href="https://www.npmjs.com/package/responsive-image-builder"><img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat-square&logo=npm"></a>
  <img src="https://img.shields.io/badge/Responsive_Image_Builder-__🔨-FFDC00.svg?style=flat-square">
  <img src="https://img.shields.io/github/license/marcuscemes/responsive-image-builder.svg?style=flat-square">
  <img src="https://img.shields.io/badge/project%20size-~90MB-0074D9.svg?style=flat-square">
  <img src="https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=flat-square">

  <img width="600" src="https://gistcdn.githack.com/MarcusCemes/2d76cf16540d85119d70429cd1ff50e0/raw/665941935f000983c77bbb3142712c7e2bb38fc1/Responsive%20Image%20Builder%20-%20Demo%20%2301.svg" alt="An example of usage">
  <br>
  <sub><i>Don't let its simplicity fool you. It's powerful.</i></sub>
</p>

## Features

- ⚡ **Fast** - Uses the lightning fast [libvips image processing library](https://github.com/jcupitt/libvips/wiki/Speed-and-memory-use)
- 🔥 **Multithreaded** - Scales to all available CPU cores
- 📦 Zero configuration - works **right out of the box**
- 🌍 **Universal** - a flexible image build process that doesn't enforce standards
- ✂️ **Cross platform** - Tested on Windows, macOS and Linux
- 😊 **Friendly experience** - telling you what's going on, from start to finish

<p align="center">
  <br>
  <b>Quick Links</b>
  <br>
  <a href="#why">Why</a>
  •
  <a href="#getting-started">Getting started</a>
  •
  <a href="#usage">Usage</a>
  •
  <a href="#the-configuration-object">Configuration</a>
  •
  <a href="#manifest">Manifest</a>
  •
  <a href="#typescript">Typescript</a>
</p>

## Why

Webpack... Angular... React... PHP... Cloudflare... So many solutions for serving images, some terrible, some paid. What if you just want to serve modern [WebP](https://developers.google.com/speed/webp/) images with srcset optimization, lazy-loading (with low-quality placeholder) and the original codec for [browsers that are late to the party](https://caniuse.com/#feat=webp) (ahem Safari, Firefox, Edge, ...)?

<p align="center">Is that really too much to ask?</p>

<p align="center"><sub>🎉 Firefox 65 and Edge 18 finally added support for WebP! Global support is now at 74.78% as of March 2019.</sub></p>

### What does this do

1. Collects all images in specified input paths
2. Intelligently resizes them into several responsive breakpoints using [Lanczos3](https://blog.idrsolutions.com/2016/01/generate-good-quality-thumbnails-in-java-lancsoz3-image-downscaling/)
3. Encodes each size in WebP and the original codec
4. Passing them through an aggressive optimizer
5. Saves them to an output folder
6. Creates a *manifest.json* file with all successful exports and sizes

<sub>All of these stages are configurable</sub>

This makes it possible to serve optimized images, regardless of the screen while making it possible to implement cache-busting (all images are known during build) with the assurance of no duplicate images, therefore no wasted space or bandwidth. Using the default configuration, each image will create 8 web-optimized images (4 sizes, 2 codecs). [See the result](example/) for yourself.

<p align="center">
  <a href="https://i.ibb.co/GP0NW93/Responsive-Image-Builder.png">
    <img width="600" src="https://i.ibb.co/GP0NW93/Responsive-Image-Builder.png">
  </a>
  <br>
  <sub>This is the ideal <i>flow</i> that RIB aims to achieve, from dev to client</sub>
  <br>
</p>

It's up to the client to implement logic to fetch the best image. I have included [example](extra/) usages for Vanilla Javascript, React and Angular 2+, although bear in mind that they are a proof of concept and may not work with the latest *manifest.json* structure.

RIB can be used as a pipeline during the build process, piping all images from one folder into another, with options to preserve or flatten the directory structure, merge with existing files, read and consolidate several input paths, etc. Simply run the Node.js module or CLI tool to update the exports. The goal is to create a universal, simple export folder and manifest file. This can be your final destination that you upload through FTP or just a pipe in your cache-busting deployment build-chain.


## Getting started

### Prerequisites

RIB is very easy to get up and running. It requires an installation of Node.js, if you're a Web Developer than it is extremely likely you are using Node.js and NPM already. A vast majority of web tools rely on it.

<details><summary><b>Node.js installation instructions (click me)</b></summary>
<p>

### Node.js installation

#### <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg" alt="drawing" height="12"/>  Windows
You can download an installer from the [Node.js](https://nodejs.org/) website, or if you are more advanced you can choose to use [NVM](https://github.com/coreybutler/nvm-windows) (node version manager) for Windows to mange your installation, allowing you to hot-swap versions.

#### <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="drawing" height="12"/>  macOS
You can download an installer from the [Node.js](https://nodejs.org/) website, or if you are more advanced you can choose to use [NVM](https://github.com/creationix/nvm) (node version manager) to mange your installation, allowing you to hot-swap versions.

<p align="center"><sub>Node.js can also be installed with <a href="https://brew.sh/">Homebrew</a>, it avoids having to use <i>sudo</i></sub></p>

#### <img src="https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg" alt="drawing" height="14"/>  Linux

You guys know what you're doing. You're playing with big boy stuff. Here's a script to help you get started:


```bash
# Install NVM
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash

# RESTART TERMINAL

# Install the latest version of node
$ nvm install node
$ nvm use node

# Install responsive-image-builder
$ npm i -g --production responsive-image-builder
```

-----
</p>
</details>

<br>

<p align="center">
<b>RIB is a big boy</b>
<br>
SHARP is around ~90MB, and this project depends on it. You can always remove RIB when you're done.
<br>
<sub>SHARP is the Node.js wrapper around the libvips image processing library</sub>
</p>

There are two ways to install RIB, as a global CLI tool, or as a local Node.js module that can be imported and executed as a Javascript function.

### 🌍 Global installation (CLI usage)

Open up a terminal session and execute:
```bash
$ npm install --global --production responsive-image-builder
```
This installs RIB globally on the system, enabling you to use the tool in CLI (command line) mode. This avoids having to write any actual code. Instead, it acts more like a program you can execute from the command line.

### 📦 Project installation (Module usage)

Open up a terminal session in your project folder and execute:
```bash
$ npm install --production responsive-image-builder
```
This installs RIB locally in your project. A decent understanding of JavaScript, Node.js and asynchronous programming is required. If this is not what you want, consider the CLI usage instead.

## Usage

### 🌍 Global installation (CLI usage)

If you installed the module globally, RIB is available on your system PATH. You may execute it from the terminal or from a batch/bash script.

Usage: `rib [options] -i <input_paths> -o <output_path>`

#### Config

When used as a CLI tool, RIB will search for configuration files with [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) and merge them with provided command line flags. The acceptable ways of providing a config file are:
- a `rib` property in `package.json`
- a `.ribrc`, `.ribrc.json`, `.ribrc.yaml` or `.ribrc.js` file in the project root
- a `rib.config.js` file exporting a config object (CommonJS)

<p align="center"><sub>The configuration file is optional, as almost everything can be done with CLI flags</sub></p>

#### Examples
```bash
$ rib  # Requires a config file somewhere
$ rib -i input -o output
$ rib -i folder1..folder2 -o build
$ rib --no-clean --force --no-webp -i src/img -o dist/img
```

<p align="center"><sub>The syntax is equivalent on Windows, macOS and Linux, however the path system may vary</sub></p><br>

To see all the available options, run `rib --help`.

### 📦 Project installation (Module usage)

RIB may be imported as an executable function, using the new ES6 import syntax. The function returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that resolves into a `Result` object (see [Typescript](#typescript)), and never rejects.

```javascript
// Legacy import
const { responsiveImageBuilder } = require("responsive-image-builder");

// ES Module import (marked as experimental in Node.js docs)
import { responsiveImageBuilder } from "responsive-image-builder";

const config = {
  in: "../in/",
  out: "../out/"
};

// Promise .then usage
responsiveImageBuilder(config)
  .then(result => {
    if (!result.error) {
      console.log("Complete");
    } else {
      console.error("Build failed");
    }
  });

// async/await usage
(async () => {
  const result = await responsiveImageBuilder(config);
  if (!result.error) {
    console.log("Complete");
  } else {
    console.error("Build failed");
  }
})();
```

The `Result` object is defined in the [Typescript](#typescript) typings. It will look something like this:

```typescript
interface Result {
  success: boolean;
  error?: ProgramError;
  exports?: Export[];
}
```

## The Configuration Object

The configuration object is used to tell RIB how it should execute. When used as a module, the config is a Javascript object that is passed as an argument to the main function. When used as a CLI tool, it's a JSON/Javascript object in the config file. The only two required keys are `in` and `out`.

All keys in the configuration object have [Typescript](#typescript) typings that will automatically be picked up by software like VS Code's Intellisense for helpful autocompletion. These provide descriptions of the keys, as well as their accepted types. The config object will also be verified during runtime for inconsistencies.

|    config key     |    CLI flag     | description                                                                                                                                                         |
| :---------------: | :-------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|      **in**       |    -i, --in     | (REQUIRED) An array of paths to scan for images. For the CLI flag, these paths have to be separated with two periods ".."                                           |
|      **out**      |    -o, --out    | (REQUIRED) The output path where to export images                                                                                                                   |
|    exportWebp     |    --no-webp    | Whether to export WebP images or only keep the original codec (default: true)                                                                                       |
|  exportManifest   |  --no-manifest  | Whether to export a manifest.json file (default: true)                                                                                                              |
| cleanBeforeExport |   --no-clean    | Whether to remove all files from the output folder before running. If any non-images files are present, the user will be asked to confirm the clean (default: true) |
|    flatExport     |   -f, --flat    | Ignores the directory structure of input paths, and exports all images to the root of the output folder (default: false)                                            |
|     verbosity     | -v, --verbosity | "verbose", "errors" or "silent" (default: "verbose")                                                                                                                |
|       force       |   -F, --force   | Authorizes file overwriting and overrides the clean confirmation prompt. Allows for complete automation without user input (default: false)                         |
|      threads      |  -t, --threads  | The maximum number of threads to use. Bear in mind that Node.js may use more threads for IO ops, hyperthreading, etc... 0 for unlimited (default: 0)                |
|      resize       |   --no-resize   | Whether to resize pictures (default: true)                                                                                                                          |
|     optimize      |  --no-optimize  | Whether to optimize pictures (default: true)                                                                                                                        |
|   exportPresets   |       N/A       | An object that describes the export pipeline (default: *see below*)                                                                                                 |
|        png        |       N/A       | PNG specific settings                                                                                                                                               |
|       jpeg        |       N/A       | JPEG specific settings                                                                                                                                              |
|        gif        |       N/A       | GIF specific settings (default: no resize, no optimize)                                                                                                             |
|        svg        |       N/A       | SVG specific settings (default: no resize, no optimize)                                                                                                             |
|       webp        |       N/A       | WebP specific settings                                                                                                                                              |

**Note:** The supported keys for codec specific settings are:

- exportOriginal
- exportWebp
- resize
- optimize
- [optimizerSettings](#optimization)
- exportPresets

### Export Presets

These describe the resizing pipeline. The `exportPresets` property is an array of ExportPreset objects. Each image will be tested for each exportPreset. The image will only be resized to that preset if its own dimensions fit into the ones specified by the preset and the dimensions have not already been selected for export.

```typescript
interface ExportPreset {
  name: string;      // Name of the export (for the manifest file)
  width: number;     // Maximum width
  height: number;    // Maximum height
  force?: boolean;   // Export even if it means a duplicate
  default?: boolean; // Add "default: true" to the manifest entry
}
```

By default there are 4 presets:

- 16x16 - thumbnail - forced
- 1280x720 - small - forced
- 1920x1080 - normal
- 3840x2160 - large

This means that a large 4K image will have 4 resized exports, while a small avatar may have only 2. This number doubles when exportWebp is enabled.

## Manifest

The manifest file is an extremely useful JSON encoded object that contains information about all of the completed exports. It can be quickly loaded by the client to view a list of available images and sizes, and used to select the best available image and it's corresponding URL.

The structure of the manifest file is available in the [Typescript](#typescript) typings. It looks something like this:

```typescript
interface IManifest {
  exports: IExport[];
}

interface IExport {
  name: string;
  fullName: string;
  extension: string;
  sizes?: IExportSize[];
  webp: boolean;
}

interface IExportSize {
  name: string;
  width: number;
  height: number;
  default?: true;
}
```

Decoding the manifest file can be a little tricky. It's designed to be as compact as possible, making it possible for the client to download the whole image database without a large overhead.

The export `name` property lets you easily find an image in the manifest. It's equal to the basename of the original filename of the image.

The `fullName` property is like the name property, but it instead of just the basename it will also give you the relative directory structure,
which in essence gives you the full resolvable URL location of the image (without the extension). In larger projects, it may be better to resolve
images by `fullName` rather than `name`, guaranteeing uniqueness (not possible to have two files with the same name in the same directory).

Each export can either be a *single* type export, or a *multiple* type export. This depends on the presence of the `sizes` key on the export.

If `sizes` is not present on the export object, the resulting image url will be `export.fullName + export.extension`.

If `sizes` is present, there are multiple exports. Each exportSize object points to one file, constructed as `export.fullName + "_" + exportSize.name + export.extension`.

If `webp` is true, then each image also has a corresponding webP export. For every image path resolved using the methods listed above, the webp can be resolved by suffixing `".webp"` instead of `export.extension` to the end of the path.

#### Example exported file names
```typescript
vector.svg          // the sizes property is not present

picture_small.jpeg  // the export size name is "small"
picture_small.webp  // webp is true (enabled)

banner.png          // webp is false, and sizes is undefined
```

<details><summary>😢 Help! I don't understand!</summary>
<p>
Take the following manifest.json file:


```json
{
  "exports": [
    {
      "name": "vector",
      "fullName": "img/vector",
      "extension": ".svg",
      "webp": false
    },
    {
      "name": "picture",
      "fullName": "img/picture",
      "extension": ".jpeg",
      "webp": true,
      "sizes": [
        {
          "name": "small",
          "width": 1280,
          "height": 720
        },
        {
          "name": "large",
          "width": 1920,
          "height": 1080,
          "default": true
        }
      ]
    }
  ]
}
```

This simply means that there are 5 exported files under the `img/` folder:

- vector.svg          (could be any size, it doesn't really matter)
- picture_small.jpeg  (1280x720)
- picture_small.webp  (1280x720)
- picture_large.jpeg  (1920x1080)
- picture_large.webp  (1920.1080)

The `webp: true` property meant that each export had a corresponding `.webp` image with the same base name, while the absence of `sizes: [...]` on the vector image means that it only has one export, and doesn't require the underscore naming system.

</p>
</details>

## Typescript

In previous versions of RIB I maintained JSON schemas for the configuration objects and program responses. The project has now been rewritten using Typescript, and all the configuration parameters have enforced types and explanations.

Using an editor like [Visual Studio Code](https://code.visualstudio.com/), you can benefit from autocompletion, type-checking, object property hinting and helpful descriptions of config keys and functions as you type.

Even without modern editor, you can consult the generated `*.d.ts` typing files for correct API usage.

## Optimization

Image optimization uses *pngquant*, *mozjpeg*, *svgo* and *gifsicle* to reduce the output image size as much as possible. By default, it's very aggressive, and also very slow. In most situations it will take more time than the resize process. If `optimize` is set to `false`, then the image will be saved directly from SHARP using default codec settings, instead of being sent to the optimizer first.

You can override all of the optimizer settings by specifying the `optimizerSettings` key in the configuration object (must be under on of the `png`, `jpeg`, `svg`, `gif` or `webp` keys).

See [imagemin-pngquant](https://www.npmjs.com/package/imagemin-pngquant), [imagemin-mozjpeg](https://www.npmjs.com/package/imagemin-mozjpeg), [imagemin-svgo](https://www.npmjs.com/package/imagemin-svgo) and [imagemin-gifsicle](https://www.npmjs.com/package/imagemin-gifsicle) for the available optimization options. For WebP, you must use the [SHARP configuration object](https://sharp.dimens.io/en/stable/api-output/#webp) instead, as `imagemin-webp` seems to have compatibility issues with libvips.

Usually WebP provides a ~40% difference in file reduction, however you may need to play around with the optimizer settings to achieve this. I have chosen some opinionated settings to try to achieve web-type compression. Specifying a an empty object `{}` as the `optimizerSettings` for the codec (in the config) will override the default settings and revert to the plugin defaults.

### Performance

RIB has been rewritten from the ground up to be more efficient than previous versions. Instead of writing vast quantities of raw image data to memory buffers for every operation, the new version leverages the performance of Node.js streams, reducing the memory footprint without sacrificing any speed.

For each image job, a tree-like stream network (that is referred to as a pipeline in this documentation) is created that flows data from the source image, through the resize and optimizer stream modifiers before being redirected back to the disk. This allows image data to flow through the network as needed until all write streams close, small packets at a time.

On a high-end system, you may expect to process a thousand high-quality 4K images a minute with the default program configuration.

## Development

Responsive Image Builder uses [Travis CI](https://travis-ci.com/MarcusCemes/responsive-image-builder) to run tests on all pushed changes, automatically deploying to npm when a significant operational change is made and all the tests have passed.
Please make sure that your contributions pass tests before submitting a Pull Request, and that your commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.3/) specification.

<p align="center">
  <a href="https://travis-ci.com/MarcusCemes/responsive-image-builder/branches">
    <img src="https://img.shields.io/travis/com/MarcusCemes/responsive-image-builder/master.svg?label=MASTER&logo=travis&style=for-the-badge" alt="Build Status - master">
  </a>
  &nbsp;&nbsp;
  <a href="https://travis-ci.com/MarcusCemes/responsive-image-builder/branches">
    <img src="https://img.shields.io/travis/com/MarcusCemes/responsive-image-builder/develop.svg?label=DEVELOP&logo=travis&style=for-the-badge" alt="Build Status - develop">
  </a>
</p>

## Errors

It's hard to make short error messages easy to understand. You can find a description of the error here.

RIB error codes are formatted as the letter E, followed by three digits.

<details><summary><b>Error codes (click me)</b></summary>

### Main

Contains the primary program logic

#### E100 No images

No images were found in the input paths that were provided to the program. Perhaps you mistyped the input paths, or the image extension was not recognized.

### Preparation

This is the preparatory phase used to verify the execution environnement, check that paths exist, write access, etc.

#### E200 General preparation error

This could mean that any one of the pre-execution checks failed. The terminal or the returned `Result` object should yield more information.

#### E201 Fatal preparation error

An error was thrown and caught in the main preparation logic from which the program can not recover from. The terminal or the `Result` object should yield more information.

#### E202 Output not empty

Important files were detected in the output folder, and the user aborted the clean when prompted to confirm the action. Simply authorize the clean or use the `force` option.

### Controller

The controller is in charge of the worker cluster and handles job delegation.

All errors are passed through the the Main class.

### Thread errors

These errors are thrown by the image processing thread.

#### E500 No valid codec to export

Both the original codec and the WebP codec exports were disabled, so there was nothing to export.
This may be a codec specific issue (such as with SVGs) in the configuration.

#### E501 - Save error, image exists

The image could not be saved to disk because the file already exists. This may be caused by trying to export two images with the same name but a different extension. Either clean the directory beforehand, set force to `true` or use the synchronize option to ignore existing files.

#### E502 - Image not found

An unlikely error, the image disappeared since the input directory was scanned during preparation. Check that nothing else is accessing the directory while RIB is running.

#### E503 - Not a file

An unlikely error. The path for the image was no longer a file.

</details>

## Built With

* [NodeJS](https://nodejs.org) - Powered by Chrome's V8 Javascript engine
* [SHARP](https://github.com/lovell/sharp) - A fantastic Node.js wrapper around the [libvips](https://github.com/jcupitt/libvips) library
* [Dynamic Terminal](https://github.com/marcuscemes/dynamic-terminal) - My very own terminal logging library

### Milestones

- v1.0.0 - First release of the RIB library concept
- v2.0.0 - Project rewrite using TypeScript
- v2.1.0 - Better WebP optimization, codec conversion

### Todo

- [ ] If not cleaning, merge *manifest.json* with existing
- [ ] Support "synchronize" mode where only missing images are exported
- [ ] Add checksum to manifest for better image searching
- [ ] Add example with new WebP optimizer and better optimizer settings
- [x] Add exportOriginalCodec option
- [x] Add support for imagemin-webp [REVERTED DUE TO BUG]
- [x] Avoid double-compressing a file when optimizer is enabled
- [x] Add codec conversion support (e.g. TIFF -> JPEG)

### Quirks

 - If non-image files are detected in the output folder, the user is warned and asked to confirm the clean
 - Ctrl+C and interrupt signals are intercepted once, the program will attempt to gracefully close as soon as the current running jobs are complete. A second interrupt will instantly quit the program.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/MarcusCemes/responsive-image-builder/tags).

## Authors

* **Marcus Cemes** - *Project Owner* - [Website](https://mastermovies.co.uk/) - [GitHub](https://github.com/MarcusCemes)

## License

This project is licensed under the **Apache 2.0** License - see the [LICENSE.md](LICENSE.md) file for details


<!-- -- HIDDEN SECTION --

npms.io doesn't support HTML-tags when analyzing a README.md, and markdown images don't support centering.
Badges and other score-related items are re-declared here as markdown.

[![npm](https://img.shields.io/badge/npm-CB3837.svg?style=flat-square&logo=npm)](https://www.npmjs.com/package/responsive-image-builder)

![Project name](https://img.shields.io/badge/Responsive_Image_Builder-__🔨-FFDC00.svg?style=flat-square)

![Size](https://img.shields.io/badge/project%20size-~90MB-0074D9.svg?style=flat-square)

![License](https://img.shields.io/github/license/marcuscemes/responsive-image-builder.svg?style=flat-square)

![Make the web lighter](https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=flat-square)

[![Build Status - master](https://img.shields.io/travis/com/MarcusCemes/responsive-image-builder/master.svg?label=MASTER&logo=travis&style=for-the-badge)](https://travis-ci.com/MarcusCemes/responsive-image-builder/branches)

[![Build Status - develop](https://img.shields.io/travis/com/MarcusCemes/responsive-image-builder/develop.svg?label=DEVELOP&logo=travis&style=for-the-badge)](https://travis-ci.com/MarcusCemes/responsive-image-builder/branches)

-->