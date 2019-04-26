<div align="center">

# Responsive Image Builder

**An ultra-fast WebP image building pipeline, for the web!**
<br><sub><i>The image side of web development should be so much easier by now...</i></sub><br>

</div>

<div align="center">

[![npm][badge-npm]][link-npm]&nbsp;&nbsp;
[![Release][badge-release]][link-release]&nbsp;&nbsp;
[![Travis CI][badge-travis]][link-travis]&nbsp;&nbsp;
[![Node.js][badge-node]][link-node]&nbsp;&nbsp;
[![Typescript][badge-typescript]][link-typescript]&nbsp;&nbsp;
![Make the web lighter][badge-lighter]

<img width="600" src="https://gistcdn.githack.com/MarcusCemes/2d76cf16540d85119d70429cd1ff50e0/raw/665941935f000983c77bbb3142712c7e2bb38fc1/Responsive%20Image%20Builder%20-%20Demo%20%2301.svg" alt="An example of usage">
<br>
<sub><i>Don't let its simplicity fool you. It's powerful.</i></sub>

</div>

## Features

- ⚡ **Fast** - Uses the lightning-quick [libvips image processing library][link-libvips-speed]
- 🔥 **Multithreaded** - Scales to all available CPU cores
- 📦 **Zero configuration** - Change nothing, change everything. You choose.
- 🌍 **Universal** - a flexible image build process that doesn't enforce any principles
- ✂️ **Cross-platform** - Tested on Windows, macOS and Linux
- 😊 **Friendly experience** - telling you what's going on, from start to finish
- ✨ **SVG Tracing** - for [really fancy placeholders][link-traced-svg]

<div align="center">

**Quick Links**<br>
[Getting started](#getting-started) &nbsp;**•**&nbsp;
[Usage](#usage) &nbsp;**•**&nbsp;
[Configuration](#the-configuration-object) &nbsp;**•**&nbsp;
[Manifest](#manifest) &nbsp;**•**&nbsp;
[Optimization](#optimization) &nbsp;**•**&nbsp;
[Fingerprinting](#fingerprinting) &nbsp;**•**&nbsp;
[Troubleshooting](#troubleshooting)

</div>

## Why

A lighter web is now more important than ever, with cloud computing taking off and their [ridiculous bandwidth costs][link-bandwidth-costs]! Next to video, images are the largest payload for videos to provide, incurring significant costs if not done correctly, not to mention extra charges and wait times for the user.

Webpack... Angular... React... PHP... Cloudflare... So many solutions for serving images, some terrible, some paid. What if you just want to serve modern [WebP][link-webp-speed] images with [srcset][link-srcset] optimization, [lazy-loading][link-lazy-sizes] (with low-quality placeholder OR amazing traced-SVGs), fingerprint cache-busting, aggressive compression, while also exporting the original codec for [browsers that are late to the party][link-caniuse] (ahem Safari, Firefox, Edge, ...)?


<p align="center">
Is that really too much to ask?
<br>
That's just all that you <i>can</i> do, RIB can help you with any combination of the above.
</p>

<p align="center"><sub>🎉 Firefox 65 and Edge 18 finally added support for WebP! Global support is now at 74.78% as of March 2019.</sub></p>

### What this does

*Chuck any high-quality originals in a folder, and RIB will non-destructively create a set of web-optimized responsive images for each original image in another folder. No more manual resizing, compressing, "where did I put the original?".*

In it's most basic form. with no additional configuration, RIB will scan a given directory for image files, and export them to a folder of your choosing. The export process consists of creating four different sized images from the source, converting a WebP copy of each size, optimizing them for web use before saving them using unique and predictable files names.

Finally, a [manifest](#manifest) file in [JSON][link-json] format is saved along with the images, containing information about every image's exported sizes, format, accompanying WebP file, final URL, etc...

The resulting manifest file is a few KB of data that lets you easily resolve an image for your client while providing you with a list of available sizes and formats with their resulting name. Each stage is highly configurable, see [configuration](#the-configuration-object).

### Why I like this solution

It follows the [KISS principle][link-kiss]. We tend to over-complicate everything when it comes to website development when usually most things can be done really simply...

Of course, more elaborate websites require complicated design principles to scale better, but they should have a custom build pipeline that suits their needs perfectly (which, incidentally, is how this project came to be).

RIB makes it easy to take a set of high-quality source images and just make them work on the web. Optimized, with several different responsive breakpoints, the assurance of no duplicate sizes or files meaning no wasted space or bandwidth. See the [example](example/) to see what it does.

<p align="center">
  <a href="https://i.ibb.co/GP0NW93/Responsive-Image-Builder.png">
    <img width="600" src="https://i.ibb.co/GP0NW93/Responsive-Image-Builder.png">
  </a>
  <br>
  <sub>This is the ideal <i>flow</i> that RIB aims to achieve, from dev to client</sub>
  <br>
</p>

The client requires some sort of logic to be able to fully benefit from the manifest file. Most browsers now support the `<srcset>` tag which lets the browser choose the best image, based on resolution, DPI, bandwidth, etc. Javascript makes it a lot easier to resolve images but is not required.

I have included [example](extra/) usages for pure Javascript, React and Angular 2+. These are a proof of concept, and may not be up to date with the latest breaking changes, although I do try.

## Getting started

### Prerequisites

RIB requires Node.js, if you're a web developer then you're probably using it already, which is awesome! If not, the installation is small and a vast majority of web tools rely on it, why not give it a try?

<details><summary><b>Node.js installation instructions (click me)</b></summary>
<p>

### Node.js installation

#### <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Windows_logo_-_2012.svg" alt="drawing" height="12"/>&nbsp; Windows
You can download an installer from the [Node.js][link-node] website, or if you are a more advanced IT user you can choose to use [NVM][link-win-nvm] (node version manager) for Windows to mange your installation, allowing you to hot-swap versions.

#### <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="drawing" height="12"/>&nbsp; macOS
You can download an installer from the [Node.js][link-node] website, or if you are a more advanced IT user you can choose to use [NVM][link-nvm] (node version manager) to mange your installation, allowing you to hot-swap versions.

<p align="center"><sub>Node.js can also be installed with <a href="https://brew.sh/">Homebrew</a>, it avoids having to use <i>sudo</i></sub></p>

#### <img src="https://upload.wikimedia.org/wikipedia/commons/3/35/Tux.svg" alt="drawing" height="14"/>&nbsp; Linux

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

<div align="center">

**RIB is a big boy**<br>
Sharp is around ~90MB and this project depends on it. You can always remove RIB when you're done.
<br><sub>SHARP is the Node.js wrapper around the libvips image processing library</sub><br>

</div>

There are two ways to install RIB, as a global CLI tool, or as a local Node.js module that can be imported and executed as a Javascript function. Both download the same package, the only change is where the package is installed on your system and how npm references it.

### 🌍 Global installation (CLI usage)

Open up a terminal session and execute:

```bash
$ npm install --global --production responsive-image-builder
```

This installs RIB globally on the system, making it accessible from the terminal/console/command prompt. This avoids having to write any actual code, instead acting more like an executable.

### 📦 Project installation (Module usage)

Open up a terminal session in your project folder and execute:

```bash
$ npm install --production responsive-image-builder
```

This installs RIB locally in your project. A decent understanding of JavaScript, Node.js and asynchronous programming is required. If this is not what you want, consider the CLI usage instead.

## Usage

### 🌍 Global installation (CLI usage)

If you installed the module globally, RIB is available on your system PATH. You may execute it from the terminal or from a batch/bash script anywhere on your system.

Usage: `rib [options] -i <input_paths> -o <output_path>`

#### Config

When used as a CLI tool, RIB will search for configuration files with [cosmiconfig][link-cosmic-config] and merge them with provided command line flags. The acceptable ways of providing a config file are:

- a `rib` property in `package.json`
- a `.ribrc`, `.ribrc.json`, `.ribrc.yaml` or `.ribrc.js` file in the project root
- a `rib.config.js` file exporting a config object (CommonJS)

<p align="center"><sub>The configuration file is optional, as almost everything can be done with CLI flags</sub></p>

#### Examples
```bash
$ rib  # Requires a config file somewhere
$ rib -i input -o output
$ rib -i folder1...folder2...folder3 -o build
$ rib --no-clean --force --no-webp -i src/img -o dist/img
$ rib -i in -o out --fingerprint --flat --multiple-template "[hash]_[preset].[format]"
```

<p align="center"><sub>The syntax is equivalent on Windows, macOS and Linux, however the path system may vary<br>RIB will try to interpret them as best as it can</sub></p><br>

To see all the available options, run `rib --help`.

### 📦 Project installation (Module usage)

RIB may be imported as an executable function using the new ES6 import syntax. The function returns a [Promise][link-promise] that never rejects.

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

The returned value from RIB is a `IResult` object, which has [Typescript](#typescript) typings. It will look something like:

```typescript
interface IResult {
  success: boolean;
  error?: ProgramError;   // an extended Error object
  exports?: IExport[];    // an array of IExport objects
}
```

## The Configuration Object

The configuration object allows you to customize the export pipeline, from adding fingerprints and format specific settings to customizing the exported filenames.

When used as a module, the configuration is an `IConfig` object passed to the main function as a parameter. When used as a CLI tool, it has to be a JSON/Javascript object specified in one of the [configuration](#config) locations. The only two required keys are `in` and `out`.

Additionally, when using RIB from the command line, you may use any of the *CLI flags* that are listed bellow. They make it extremely easy to quickly to toggle options.

The best way to get a complete API reference is to use the [Typescript](#typescript) typings that are included in this package, it will automatically give you hinting and autocompletion for the configuration object.

| Config key | CLI flag | Description |
|:-------------------------------:|:--------------------------------:|---------------------------------------------------------------------------------------------------------------------------|
| **in** *string[]* | -i, --in <paths> | (REQUIRED) An array of paths to scan for images. For the CLI flag, these paths have to be separated with three periods "..." |
| **out** *string* | -o, --out <path> | (REQUIRED) The output path to export images to |
| exportManifest *boolean* | --no-manifest | Enable/disable writing of the manifest file |
| cleanBeforeExport *boolean* | --no-clean | Empty the output directory beforehand |
| flatExport *boolean* | -l, --flat | Flatten the directory structure, exporting everything into one folder |
| verbosity *string* | -v, --verbosity [string] | "verbose", "errors" or "silent". "silent" disables terminal interactivity |
| force *boolean* | -F, --force | Overwrite output files without failing and clean without confirmation |
| incrementConflicts *boolean* | -i, --increment | Increment file exports if an existing file is already in place. |
| threads *number* | -t, --threads [number] | Maximum number of worker threads to create |
| fingerprint *boolean* | -f, --fingerprint | Pass the source image through a hash function to get the source checksum |
| hashAlgorithm *string* | -a, --hash-algorithm [algorithm] | The algorithm to use for fingerprinting, system-specific (default: "md5") |
| shortHash *boolean* | -s, --short-hash | Trim the hash to save space in the manifest |
| exportFallback *boolean* | --no-fallback | Enable/disable fallback format exports |
| exportWebp *boolean* | --no-webp | Enable/disable WebP export next to fallback format |
| resize *boolean* | --no-resize | Enable/disable image resizing, resulting in a *single* or *multiple* type export *(see [export presets](#export-presets))* |
| optimize *boolean* | --no-optimize | Enable/disable image optimization. |
| convert *string* | --convert [format] | Export the fallback image in this format (e.g. TIFF -> JPEG) |
| exportPresets *IExportPreset[]* | N/A | *See [export presets](#export-presets)* |
| singleExportTemplate *string* | --single-template [template] | Custom file names, supporting [name], [format], [hash] and [shortHash] template literals |
| multipleExportTemplate *string* | --multiple-template [template] | Custom file names, supporting [name], [format], [hash], [shortHash], [preset], [width] and [height] template literals |
| png *IFormatSettings* | N/A |  |
| jpeg *IFormatSettings* | N/A |  |
| svg *IFormatSettings* | N/A |  |
| gif *IFormatSettings* | N/A |  |
| webp *IFormatSettings* | N/A |  |
| tiff *IFormatSettings* | N/A |  |

The last few keys are format-specifc settings. The supported keys for `IFormatSettings` are:

- `exportFallback`
- `exportWebp`
- `resize`
- `optimize`
- `convert`
- `fingerprint`
- `singleExportTemplate`
- `multipleExportTemplate`
- [optimizerSettings](#optimization)
- `exportPresets` (see just bellow)

Don't let the number of options scare you. All of them but two are optional.

### Export Presets

Export presets are used to mark the "responsive breakpoints" when resizing images. Each export preset represents an image size to export. Export presets are only applicable when image resizing is enabled, resulting in a "multiple" type export. In the same sense, an exported image with resizing disabled is referred to as a "single" type export, as its contents get passed-through untouched (useful for vector graphics).

The `exportPresets` property is an array of `IExportPreset` objects. RIB exports as many presets as possible, without resulting in duplicate images/sizes. The first presets in the array get priority over the last ones.

```typescript
interface IExportPreset {
  name: string;      // Name of the preset (for the manifest file)
  width: number;     // Maximum width
  height: number;    // Maximum height
  force?: boolean;   // Export even if it means a duplicate
  default?: boolean; // Add "default: true" to the manifest entry
}
```

<details><summary><b>See the default export presets to get a better idea of how it works (click me)</b></summary>

These are the default export presets used by RIB that are used unless they have been overwritten by your own `exportPresets` property. They give you a pretty good idea on how they are intended to work.

```javascript
const defaultExportPresets = [
  {
    name: "thumbnail",
    height: 16,
    width: 16,
    force: true
  },
  {
    name: "small",
    width: 1280,
    height: 720,
    force: true
  },
  {
    name: "normal",
    width: 1920,
    height: 1080,
    default: true
  },
  {
    name: "large",
    width: 3840,
    height: 2160
  }
];
```

This will attempt to export four sizes, a **thumbnail** (max 16x16, always exported), a **small** image (max 1280x720, always exported), with stretch goals of a **normal** and **large** image if the source image is large enough.

</details>

### Naming exports

The exported image's filed names may be customized using the `singleExportTemplate` and `multipleExportTemplate` options. These options require a `string` with the new filename.

To make the name unique to each export, you must use *template literals*. They are placeholders that will be replaced with relevant data.

The following template literals are supported:

- `[name]` - The original image name
- `[format]` - The exported image's format
- `[preset]` - The preset name that exported the size *(multiple only)*
- `[hash]` - The original image's fingerprint (must be enabled)
- `[shortHash]` - A shorter version of `[hash]`
- `[width]` - The exported image's width *(multiple only)*
- `[height]` - The exported image's height *(multiple only)*

#### Examples

```javascript
config.singleExportTemplate   = "[name].[format]";            // the default value
config.singleExportTemplate   = "[name].[shortHash].[format]";

config.multipleExportTemplate = "[name]_[preset].[format]";  // the default value
config.multipleExportTemplate = "[hash].[format]";
```

## Manifest

The manifest file is an extremely useful JSON encoded object that contains information about all of the completed exports. It can be quickly loaded by the client to view a list of available images and sizes, used to select the best available image size and format and calculate its corresponding URL.

As always, the structure of the manifest file is included in the [Typescript](#typescript) typings. It looks something like this:

```typescript
interface IManifest {
  exports: IExport[];
}

interface IExport {
  original: {               // original image
    name: string;           // original image name
    fullName: string;       // original image dir + name
    extension: string;      // original image extension
    fingerprint?: string;   // original image checksum
  };
  export: {
    fallback: boolean;      // fallback was exported
    webp: boolean;          // webp was exported
    relativeDir: string;    // relative dir containing the exports
    format: string;         // fallback format (doubles as the extension)
    single?: {
      name: string;         // single export image name (e.g. SVG)
    };
    multiple?: IExportSize[]; // multiple export sizes (e.g. JPEG)
  };
}

interface IExportSize {
  name: string;   // image name of the exported size (filename)
  preset: string; // preset name that exported the preset
  width: number;  // width of the image
  height: number; // height of the image
  default?: true; // marked as default? (see exportPresets)
}
```

The manifest file was designed to remain relatively compact without making it impossible to decode. If you want further compression, you can re-process the manifest file with your own script, such as doing [object normalization][link-normalize] for lightning-fast image access based on the fingerprint (for example), removing any arrays and any form of slow recursion.

gzip or Brotli should be able to compress the file extremely well, however, making it pointless to shorten properties, etc. (LZMA2 can compress a 87KB manifest file to only 3.5KB! Brotli will be similar)


<details><summary>😢 Help! I don't understand!</summary>
<p>
Take the following manifest.json file:


```json
{
  "exports": [
    {
      "original": {
        "name": "header",
        "fullName": "header",
        "extension": ".svg",
        "fingerprint": "c7c454f6"
      },
      "export": {
        "format": "svg",
        "fallback": true,
        "webp": false,
        "relativeDir": "img/",
        "single": {
          "name": "header"
        }
      }
    },
    {
      "original": {
        "name": "wildlife",
        "fullName": "wildlife",
        "extension": ".jpg",
        "fingerprint": "7f5d4e26"
      },
      "export": {
        "format": "jpeg",
        "fallback": true,
        "webp": true,
        "relativeDir": "img/",
        "multiple": [{
            "name": "wildlife_thumbnail",
            "preset": "thumbnail",
            "width": 16,
            "height": 11
          },
          {
            "name": "wildlife_small",
            "preset": "small",
            "width": 1080,
            "height": 720
          },
          {
            "name": "wildlife_normal",
            "preset": "normal",
            "width": 1620,
            "height": 1080,
            "default": true
          },
          {
            "name": "wildlife_large",
            "preset": "large",
            "width": 3240,
            "height": 2160
          }
        ]
      }
    }
  ]
}

```

This manifest file means that two source images were exported into nine images total, that can be found in the `img/` folder.

- `header.svg`  *(could be any size, it doesn't really matter)*
- `wildlife_thumbnail.jpeg` + `wildlife_thumbnail.webp`  *(16x11)*
- `wildlife_small.jpeg` + `wildlife_small.webp`  *(1080x720)*
- `wildlife_normal.jpeg` + `wildlife_normal.webp`  *(1620x1080)*
- `wildlife_large.jpeg` + `wildlife_large.webp`  *(3240x2160)*

The `webp: true` property meant that each export had a corresponding `.webp` image with the same base name. The `IExport.export.single` and `IExport.export.multiple` properties are mutually exclusive, only one of them will appear in the final export.

</p>
</details>

## Fingerprinting

As of v3.0.0, Responsive Image Builder now supports image fingerprinting. When explicitly enabled, the original image will be passed through a hash function. The resulting hash will then be available in the image's manifest entry, and also as a template literal when customizing exported files names.

For people new to the concept of hash functions, all you need to know is that enabling fingerprinting will produce a short string of letters and numbers (hexadecimal) that is unique to the source image, hence the term "fingerprint". As long as you never modify the image, its corresponding hash will never change, making it a great way to find a particular image in the manifest file, no matter where you save the image!

The default hash algorithm used by Responsive Image Builder is `md5`, due to its widespread usage and general compatibility, as well as being one of the fastest options. Any other crypto function that is installed on your system can be used. To see a list of available algorithms, execute `openssl list -digest-algorithms` in a terminal.

#### Example

```bash
$ rib -i in -o out --fingerprint
```

This will enable fingerprinting, adding a new property to the `original` group of each export.

```json
"fingerprint": "5ae7554b55577da995b890e63ecf48ed"  # A standard fingerprint
"fingerprint": "5ae7554b"                          # When using --short-hash
```

## SVG Placeholders

RIB supports [potrace][link-potrace] to create a beautiful SVG placeholder. It can be used like [this][link-traced-svg] as a tiny (2-6KB) placeholder until you have downloaded the full high quality image. In some ways it provides a more pleasing experience than a blurred 8x8 thumbnail.

SVGs are vector graphics that scale to any resolution, it only contains primitive shapes that represents strong edges/contrasts in the source image.

By default, RIB will create a traced image for every non-SVG export. You can customize the name of this traced image using the `traceTemplate` config option.

The `traceOptions` configuration property will pass down all options to [potrace][link-potrace], this lets you change the colour and complexity of the image.

**Example**

```javascript
rib({
  traceOptions: {
    color: 'lightgray',
    optTolerance: 0.4,
    turdSize: 100,
    turnPolicy: potrace.Potrace.TURNPOLICY_MAJORITY
  }
})
```

<p align="center"><sub>You may need to import the potrace library, or used hard-coded constant values</sub></p>

## Typescript

Since v2.0.0, the entire project has been rewritten in Typescript. This not only provides more robust compilation with less chance of stupid errors but also provides strong typings for practically all function parameters and returns.

What does this mean for you? When using a modern editor like [Visual Studio Code][link-vscode], you will benefit from autocompletion, type-checking, object property hinting and helpful descriptions of config keys and what functions do *as you type*.

Even without a modern editor, you can consult the generated `*.d.ts` TS Typings files for the most up-to-date API usage and descriptions.

## Optimization

Image optimization uses *pngquant*, *mozjpeg*, *svgo* and *gifsicle* to reduce the output image size as much as possible. By default, it's very aggressive, and also very slow. In most situations, it will take more time than the resize process. If `optimize` is set to `false`, the optimize will be removed from the export pipeline. The image will then be saved directly from SHARP using default codec settings.

You can override all of the optimizer settings by specifying the `optimizerSettings` key in the configuration object (must be under one of the `png`, `jpeg`, `svg`, `gif` or `webp` keys).

See [imagemin-pngquant](https://www.npmjs.com/package/imagemin-pngquant), [imagemin-mozjpeg](https://www.npmjs.com/package/imagemin-mozjpeg), [imagemin-svgo](https://www.npmjs.com/package/imagemin-svgo) and [imagemin-gifsicle](https://www.npmjs.com/package/imagemin-gifsicle) for the available optimization options. For WebP, you must use the [SHARP WebP settings](https://sharp.dimens.io/en/stable/api-output/#webp) instead, as `imagemin-webp` seems to have compatibility issues with libvips 😞.

Usually WebP provides a ~40% difference in file reduction, however, you may need to play around with the optimizer settings to achieve this. I have chosen some opinionated settings to try to achieve web-type compression. Specifying an empty object `{}` as the `optimizerSettings` for the codec (in the config) will override the default settings and revert to the plugin defaults.

### Performance

Since v2.0.0,  RIB has been rewritten from the ground up to be more efficient than previous versions. Instead of writing vast quantities of raw image data to memory buffers for every operation, the new version leverages the performance of Node.js streams, reducing the memory footprint without sacrificing any speed.

The entire export process is quite literally a pipeline, with various stream modifiers (such as resizing, webp, optimizing) being attached in a modular way. The end is piped to a temporary file using a `WriteStream`. Once all streams have closed successfully, the temporary files are renamed (committed) to their intended destination.

#### Benchmark

To see how fast sharp/libvips on its own is, click [here](https://sharp.pixelplumbing.com/en/stable/performance/).

##### Test environment

- AMD Ryzen 2700X (8C/16T) @ 4.00GHz
- Windows 10 Pro, 2x8GB DDR4 @ 2933MHz, Crucial SDD (~500MB/s)
- Responsive Image Builder on Node.js v11.12.0

##### The Task

Input: 1024 JPEG images (3888x2592, 2.58MB each, 2.64GB total)

Output: 4096 JPEG images and 4096 WebP images, using the default Responsive Image Builder settings.

##### Results

Responsive Image Builder completed the task in 6 minutes and 23 seconds, creating just 737MB of optimized data.
Each UHD image took about 374ms to process, with a total throughput of around 6.89MB/s at the start of the pipeline.

And of course, at the end of the pipeline are beautifully compressed images.

## Converting

Converting is used to change the format of the image before entering the pipeline. This is done using the `convert` option.

Converting allows you to, for example, convert high-quality TIFF image files into JPEG (and the accompanying WebP image), which is far more compatible, without the need to convert the original yourself.

## Troubleshooting

See the [wiki][link-wiki] for the troubleshooting guide. If you cannot find your answer there, try opening an issue.

## Contributing

If you have a bug, issue or a feature request, open a [new issue][link-issues] using the provided template.

If you would like to contribute directly, see [contributing][link-contributing] to learn how to make changes and submit a Pull Request.

Responsive Image Builder uses [Travis CI][link-travis] and [semantic-release][link-semantic-release] to test the master and develop branches and publish any significant changes immediately to npm and GitHub.

<div align="center">

[![Code of Conduct][badge-coc]][link-coc]

![Travis-CI-master][badge-travis-master] &nbsp; ![Travis-CI-develop][badge-travis-develop]

</div>

## Built With

* [Node.js](https://nodejs.org) - Powered by Chrome's V8 Javascript engine
* [SHARP](https://github.com/lovell/sharp) - A fantastic Node.js wrapper around the [libvips](https://github.com/jcupitt/libvips) library
* [Dynamic Terminal](https://github.com/marcuscemes/dynamic-terminal) - My own terminal renderer

### Milestones

- v1.0.0 - First release of the RIB library concept
- v2.0.0 - Project rewrite using TypeScript
- v2.1.0 - Better WebP optimization, codec conversion
- v3.0.0 - Better manifest and performance, fingerprinting

See [changelog][link-changelog].

### Todo

Stretch goals for the next feature release. Completed goals are removed after the following feature release.

- [ ] If not cleaning, merge *manifest.json* with existing
- [ ] Support "synchronize" mode where only missing images are exported
- [ ] Add filename reservation for consistent incrementation
- [ ] Try to remove avoidable dependencies such as Ajv
- [ ] Redesign controller for better worker management
  - [ ] Detect fork failure
- [ ] Experiment with performance (hyperthreading, half cores, cpu monitoring)
- [x] Add exportOriginalCodec option (now `exportFallback`)
- [x] Add support for imagemin-webp [REVERTED DUE TO BUG]
- [x] Avoid double-compressing a file when optimizer is enabled
- [x] Add codec conversion support (e.g. TIFF -> JPEG) (`convert` option)
- [x] Add checksum to manifest for better image searching (`fingerprint` option)
- [x] Add example with new WebP optimizer and better optimizer settings
- [x] Add support for pre-load traced SVGs

### Quirks

 - If non-image files are detected in the output folder, the user is warned and asked to confirm the clean
 - Ctrl+C and interrupt signals are intercepted once, the program will attempt to gracefully close as soon as the currently running jobs are complete. A second interrupt will instantly quit the program.

## Authors

* **Marcus Cemes** ([@MarcusCemes][link-marcuscemes]) - *Project Owner* - [Website](https://mastermovies.co.uk/)

<!-- BADGES -->
[badge-npm]:https://img.shields.io/badge/npm-CB3837.svg?style=for-the-badge&logo=npm
[badge-release]:https://img.shields.io/github/release/MarcusCemes/responsive-image-builder.svg?style=for-the-badge&color=FF851B
[badge-travis]:https://img.shields.io/badge/Travis_CI--FFDC00.svg?style=for-the-badge&logo=travis
[badge-node]:https://img.shields.io/badge/Node.js--339933.svg?style=for-the-badge&logo=node.js
[badge-typescript]:https://img.shields.io/badge/Typescript--0074D9.svg?style=for-the-badge&logo=typescript
[badge-lighter]:https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=for-the-badge

[badge-coc]:https://img.shields.io/badge/Code%20of-Conduct-ff69b4.svg?style=for-the-badge
[badge-travis-master]:https://img.shields.io/travis/com/MarcusCemes/responsive-image-builder/master.svg?label=MASTER&logo=travis&style=for-the-badge
[badge-travis-develop]:https://img.shields.io/travis/com/MarcusCemes/responsive-image-builder/develop.svg?label=DEVELOP&logo=travis&style=for-the-badge

<!-- LINKS -->
[link-npm]:https://www.npmjs.com/package/responsive-image-builder
[link-release]:https://github.com/MarcusCemes/responsive-image-builder/releases/latest
[link-travis]:https://travis-ci.com/MarcusCemes/responsive-image-builder
[link-node]:https://nodejs.org
[link-typescript]:https://www.typescriptlang.org
[link-coc]:https://github.com/MarcusCemes/responsive-image-builder/blob/master/.github/CODE_OF_CONDUCT.md
[link-issues]:https://github.com/MarcusCemes/responsive-image-builder/issues
[link-contributing]:https://github.com/MarcusCemes/responsive-image-builder/blob/master/.github/CONTRIBUTING.md
[link-changelog]:https://github.com/MarcusCemes/responsive-image-builder/blob/master/CHANGELOG.md
[link-marcuscemes]:https://github.com/MarcusCemes
[link-wiki]:https://github.com/MarcusCemes/responsive-image-builder/wiki/

[link-libvips-speed]:https://github.com/jcupitt/libvips/wiki/Speed-and-memory-use
[link-traced-svg]:https://using-gatsby-image.gatsbyjs.org/traced-svg/
[link-webp-speed]:https://developers.google.com/speed/webp/
[link-srcset]:https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images
[link-lazy-sizes]:https://github.com/aFarkas/lazysizes
[link-caniuse]:https://caniuse.com/#feat=webp
[link-bandwidth-costs]:https://news.ycombinator.com/item?id=11301085
[link-json]:https://en.wikipedia.org/wiki/JSON
[link-kiss]:https://en.wikipedia.org/wiki/KISS_principle
[link-win-nvm]:https://github.com/coreybutler/nvm-windows
[link-nvm]:https://github.com/creationix/nvm
[link-cosmic-config]:https://github.com/davidtheclark/cosmiconfig
[link-promise]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[link-normalize]:https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape
[link-vscode]:https://code.visualstudio.com/
[link-pngquant]:https://www.npmjs.com/package/imagemin-pngquant
[link-mozjpeg]:https://www.npmjs.com/package/imagemin-mozjpeg
[link-svgo]:https://www.npmjs.com/package/imagemin-svgo
[link-gifsicle]:https://www.npmjs.com/package/imagemin-gifsicle
[link-semantic-release]:https://github.com/semantic-release/semantic-release
[link-potrace]:https://github.com/tooolbox/node-potrace