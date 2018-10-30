# Responsive Image Builder
![MasterMovies RIB](https://img.shields.io/badge/MasterMovies-RIB-blue.svg?style=flat-square) 
[![Link to npm](https://img.shields.io/badge/🔗-npm-CB3837.svg?style=flat-square)](https://www.npmjs.com/package/responsive-image-builder)
![GitHub](https://img.shields.io/github/license/marcuscemes/responsive-image-builder.svg?style=flat-square)
![npm bundle size (minified)](https://img.shields.io/bundlephobia/min/responsive-image-builder.svg)
![Make_the_web lighter](https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=flat-square)

An ultra-fast WebP image building pipeline, for the web.

A CLI tool and NodeJS module built into one, letting you quickly resize and compress high-resolution images into several sizes in its original format AND the new WebP codec.

<p align="center">
  <img src="./img/responsive-image-builder.png" alt="Command line example"
       width="654" height="458">
</p>


## Table of contents

<!--ts-->
README NOT COMPLETE
<!--te-->

## Why?
Webpack... Angular... React... PHP... Cloudflare... So many solutions for serving images, some terrible, some paid. What if you just want to *serve modern WebP images with srcset optimization and lazy-loading*, with fallback codecs (*ahem Safari, Firefox, Edge, ...*)? Is that really to much to ask?

This is the EASIEST solution I found, offering cache-busting responsive WebP goodness, with lanczos3 downscaling, and NO server-processing! And it's free!

Oh... Did I mention it's INTELLIGENT? Never upscale! Never fetch duplicate images! The browser will fetch the BEST image from a manifest file (containing all the availiable sizes) that is generated with this tool.

## Getting Started

This is a tool designed to be used during the build process. It uses one of the fastest image downscaling libraries available, [SHARP](https://github.com/lovell/sharp), which used C++ behind the scenes. RIB mearly streamlines the image building pipeline.

It's not magic, it's not automatic. This does mean however that it gives you more freedom! The best tools are those that allow you to design the build process, not everybody has NodeJS backend servers who's sole purpose is to serve an Angular app... See [Where's the magic?](#where's-the-magic) for ideas on how to use this effectively.
 
### Prerequisites

First of all, you *will* need an installation of NodeJS. Although the hard work is done on C++, the interface uses NodeJS. Plus, it gives you a very easy way to install the package!

### Installing

First, install `responsive-image-builder`:

```sh
$ npm install --save-dev responsive-image-builder
```

That's it! You may now `require` the module in any NodeJS script.

```javascript
const rib = require('responsive-image-builder');
rib( {input: 'path/to/input', output: '/path/to/output'} );
```

You can also add it as an NPM script in your package.json

```json
scripts: {
    "rib": "rib -i /path/to/input -o /path/to/output"
}
```

If you want global access from any working directory, add the `-g` flag before the NPM installation for the full CLI companion tool:

```sh
$ npm i -g -D responsive-image-builder
$ rib -i /path/to/input -o /path/to/output
```

The CLI tool runs a script that requires the module, and passes the command-line arguments as a Javscript {Object} to the module, just like the example above.

### Stuck?

Use `-h` or `--help` to display all accepted arguments. The NodeJS module will also show hints for the configuration object when using a modern editor like Visual Studio Code.

```sh
$ rib --help
```
## Usage

Executing `rib({...});` will return a promise. It can be a long task... You can use this module sycronously with `await rib({...});` or with a callback function `rib({...}).then(() => { ... });`.

Here's a list of arguments/configuration values that can be used:

| CLI Flag                   | NodeJS Config Key     | Description                                                                                                                 |
|----------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------------|
| -i, --input <path>         | input \[string\]        | ```(required)``` path to the folder containing the images                                                                   |
| -o, --output <path>        | output \[array\]        | ```(required)``` path to output images to                                                                                   |
| -e, --exports <file>       | exports \[string\]      | [SEE EXPORTS](#exports) CLI: File with JSON  NodeJS: Export preset object                                                   |
| --no-interactive           | interactive \[boolean\] | ```(default: true)```Interactive command line prompts for deleting, overwriting or creating authorisation                   |
| -f, --force                | force \[boolean\]       | ```(default: false)``` DANGEROUS! Delete, create or overwrite files without asking! Make sure you're using the right paths! |
| -c, --clean                | clean \[boolean\]       | ```(default: false)``` Delete the output directory's contents without asking                                                |
| -t, --max-threads <number> | max_threads \[number\]  | ```(default: 0)``` The number of threads to use. 0 will use all cores available                                             |
| --shy                      | verbose = 1           | Only report errors                                                                                                          |
| -s, --silent               | verbose = 2           | No STDOUT output at all. Careful... The program may wait for input without you knowing.                                     |
| N/A                        | verbose = 3 (default) | The default verbosity option, including the banner and progress bar.                                                        |
| --no-manifest              | manifest \[boolean\]    | ```(default: true)``` Write a manifest.json summary in the output directory                                                 |

#### Example

```sh
rib -i path_a -o -path_b --shy -t 8 
```

is the same as doing:

```javascript
rib({
    input: "path_a",
    output: "path_b",
    verbose: 1,
    max_threads: 8
});
```
### Exports

Export presets are what the images are resized to. The default export preset is:

```javascript
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
```

This generates a 8x8 thumbnail and a 'small' image, with a 'medium' and 'large' image when possible (no duplicate or upscaled images).

The name of the preset is used to suffix the exported image: ```image_large.webp```

The ```width``` and ```height``` specify the box that the image should fit in.

The ```default: true``` property should *only be given to one image*. It tags the export in the ```manifest.json``` file so that it may be used as a fallback src property.

The ```force: true``` property means the size will be exported regardless of duplicate images.

This will generate at maximum 8 files, and at minimum 4 (WebP + original in four sizes). It provides a good example of what can be achieved.

⚠️ *Order the presets from small to large to prevent duplicates. Each export is compared to the previous when deciding whether it should be included.*

### Where's the magic?

When using [Modernizr](https://modernizr.com/) and [Webpack](https://webpack.js.org/), you can ```require('manifest.json')```. During the build process, the JSON file will be automatically be *inlined* in the javascript bundle. How cool is that? Modernizr can quickly check for WebP support, and you can then fetch the *BEST* image for your beautiful visitor, and even construct a ```srcset``` property based on each image's unique exports.

#### A step further...

Using the latest version of Angular, using HTML ```<img>``` tags is still nasty.

### Some notes on resources

memory

## Built With

* [NodeJS](https://nodejs.org) - The web framework used
* [SHARP](https://github.com/lovell/sharp) - Dependency Management

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Marcus Cemes** - *Project Owner* - [Website](https://mastermovies.co.uk/) - [GitHub](https://github.com/MarcusCemes)

## License

This project is licensed under the **Apache 2.0** License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [SHARP](https://github.com/lovell/sharp) is amazing. It's the workhorse behind this script.
* [Chalk](https://github.com/chalk/chalk) for providing pretty colours.