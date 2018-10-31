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
- [Why?](#why?)
- [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installing](#installing)
  * [Stuck?](#stuck?)
- [Usage](#usage)
    + [Example](#example)
  * [Exports](#exports)
  * [Where's the magic?](#where's-the-magic?)
    + [A step further... (use case)](#a-step-further...-(use-case))
  * [Some notes on resources](#some-notes-on-resources)
- [JSON Schemas](#json-schemas)
- [Built With](#built-with)
- [Versioning](#versioning)
- [Authors](#authors)
  * [TODO](#todo)
- [License](#license)
- [Acknowledgments](#acknowledgments)
<!--te-->

## Why?
Webpack... Angular... React... PHP... Cloudflare... So many solutions for serving images, some terrible, some paid. What if you just want to *serve modern WebP images with srcset optimization and lazy-loading*, with fallback codecs (*ahem Safari, Firefox, Edge, ...*)? Is that really too much to ask?

This is the EASIEST solution I found, offering cache-busting responsive WebP goodness, with lanczos3 downscaling, and NO server-processing! And it's free!

Oh... Did I mention it's INTELLIGENT? Never upscale! Never fetch duplicate images! The browser will fetch the BEST image from a manifest file (containing all the available sizes) that is generated with this tool.

## Getting Started

This is a tool designed to be used during the build process. It uses one of the fastest image downscaling libraries available, [SHARP](https://github.com/lovell/sharp), which used C++ behind the scenes. RIB merely streamlines the image building pipeline.

It's not magic, it's not a fully-fledged standardized process, it's more of a build-script tool. This does mean, however, that it gives you more freedom! The best tools are those that allow you to design the build process, not everybody has NodeJS backend servers whose sole purpose is to serve an Angular app... See [Where's the magic?](#where's-the-magic) for ideas on how to use this effectively.
 
### Prerequisites

First of all, you *will* need an installation of NodeJS. Although the hard work is done on C++, SHARP's interface uses NodeJS. Plus, it gives you a very easy way to install the package!

### Installing

First, install `responsive-image-builder`:

```sh
$ npm install --save-dev responsive-image-builder
```

That's it! You may now `require` the module in any NodeJS script:

```javascript
const rib = require('responsive-image-builder');
rib({ input: 'path/to/input', output: '/path/to/output' });
```

You can also add it as an NPM script in your ```package.json```, so that you can simply use ```npm run rib`` inside your repository:

```json
scripts: {
    "rib": "node bin/parse-cli.js -i /path/to/input -o /path/to/output"
}
```

If you want global access from any working directory, add the `-g` flag during the NPM installation for the full CLI companion tool:

```sh
$ npm i -g -D responsive-image-builder
$ rib -i /path/to/input -o /path/to/output
```

### Stuck?

Use `-h` or `--help` to display all accepted arguments. The NodeJS module will also show hints for the configuration object when using a modern editor like Visual Studio Code. See [Usage](#usage) for a full list of accepted options.

```sh
$ rib --help
```
## Usage

RIB may be used from the command line, or as a NodeJS module. For examples, see [Getting Started](#installing). The TypeScript-like syntax is:

```typescript
const rib = require('responsive-image-builder');
const configuration = new RIBConfig({...});
const promise: Promise<RIBResponse> = rib(configuration: (RIBConfig|Object));
```

Executing `rib({...});` will return a promise. It can be a long wait... You can use this module syncronously with `await rib({...});` or with a callback function `rib({...}).then(() => {...});`.  The promise resolves into a RIBResponse summary (see [lib/reponse.js](tree/master/lib/response.js)).

Here's a list of arguments/configuration values that can be used. If something is missing, a full list of options is available in the configuration class under ```lib/config.js```.

| CLI flag                   | config key              | default value | description                                                                                              |
|----------------------------|-------------------------|---------------|----------------------------------------------------------------------------------------------------------|
| -i, --input \<path\>         | input \[string\]        | ```null```    | **(required)** Path to the folder containing the images                                                |
| -o, --output \<path\>        | output \[array\]        | ```null```    | **(required)** Path to folder where images are output                                                  |
| -e, --exports \<path\>       | exports \[object\]      | RIBConfig.exports   | [SEE EXPORTS](#exports) **CLI**: Path to file with JSON  **NodeJS**: "Preset" object                     |
| --no-interactive           | interactive \[boolean\] | ```true```    | Interactive command line prompts for deleting, overwriting or creating authorisation                     |
| -f, --force                | force \[boolean\]       | ```false```   | **DANGEROUS!** Delete, create or overwrite files without asking! Make sure you're using the right paths! |
| -c, --clean                | clean \[boolean\]       | ```false```   | Delete the output directory's contents without asking                                                    |
| -t, --max-threads \<number\> | max_threads \[number\]  | ```0```       | The number of threads to use. 0 will use all cores available                                             |
| --shy                      | verbose = 1             | ```3```       | Only report errors                                                                                       |
| -s, --silent               | verbose = 2             | ```3```       | No STDOUT output at all. Careful... The program may wait for input without you knowing.                  |
|                            | verbose = 3             | ```3```       | The default verbosity option, including the banner and progress bar.                                     |
| --no-manifest              | manifest \[boolean\]    | ```true```    | Write a manifest.json summary in the output directory                                                    |

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

⚠️ *Order the presets from small to large to prevent duplicates. Each export is compared to the previous when deciding whether it should be processed.*

### Where's the magic?

When using [Modernizr](https://modernizr.com/) and Angular's configuration of [Webpack](https://webpack.js.org/) (for example), you can ```require('manifest.json')```. During the build process, the JSON file will be automatically *inlined* in the javascript bundle. How cool is that? *Modernizr* can quickly check for WebP support, and you can then fetch the **BEST** image for your beautiful visitor, and even construct a ```srcset``` property based on each image's unique exports. (8x8 thumbnails are so small, they are also inlined! Awesome!)

#### A step further... (use case)

This is my experience with Angular, it's a little tacky. When using the latest version of Angular, HTML ```<img>``` tags are pretty nasty. Angular (as of 2018) uses a complicated Webpack configuration that adds a hashed "fingerprint" to the image filename during the build for cache-busting purposes. CSS image URLs are automatically transformed to the new fingerprinted image, but not ```<img src="...">``` URLs. That sucks.

One little secret in Angular is that you can have access to Webpack's ```require``` function by declaring it as an existing global variable:

```typescript
declare var require: any;
```

```require``` has the ability to return the fingerprinted image's URL. It does this by keeping a list of original filenames and the hashed version after building. For example, ```require('image.jpg')``` will return the string ```"image<hash>.jpg"``` if the file was included during the build process. How do you force all images to be included by Webpack's build process if they are not hardcoded? The ```require``` function will take hard-coded paths, and treat the variables as a wildcard. ```require('/path/to/' + image)``` will include ALL FILES in /path/to/ during the build process. It's magic, isn't it?

Angular lets you bind the ```[src]``` property to a javascript (string) variable, this can be done by calling a function. My solution is to create an ```ImageService``` Angular service that handles image requests. It returns an object with a bindable property (objects are always referenced and never duplicated) when called, (for example ```[src]="image_service.fetch('image.jpg').src"```), storing it until WebP support has been decided asynchronously. The stored "shared" objects are then updated with the correct ```src``` and ```srcset``` properties, updating ```<img>```s in real-time.

An example of the ImageService class can be found under [/extra/image.service.ts](tree/master/extra/image.service.ts).

### Some notes on resources

NodeJS is not the most optimized of languages. Like most other languages, memory management is handled by the Garbage Collector. It doesn't run very often, either... RIB does image operations on raw image data for the best quality, leveraging memory to reduce I/O disk operations. Large images may use a lot of RAM, which isn't immediately deallocated, even after the variable is unreferenced as soon as possible. In some cases, NodeJS will use *all* RAM available (up to 12GB on 16 threads!), before realising that it should run the GC to deallocate stale memory. There's not much I can do here without sacrificing performance and/or quality. If this is a problem, consider limiting the script's memory somehow... If you have suggestions, post them in the issues section.

## JSON Schemas

The RIBConfig object, RIBResponse object and manifest.json file conforms to [https://json-schema.org/](https://json-schema.org/)'s drafts. The respective schemas under available in ./$schema/. 


## Built With

* [NodeJS](https://nodejs.org) - The web framework used
* [SHARP](https://github.com/lovell/sharp) - Dependency Management

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/MarcusCemes/responsive-image-builder/tags). 

## Authors

* **Marcus Cemes** - *Project Owner* - [Website](https://mastermovies.co.uk/) - [GitHub](https://github.com/MarcusCemes)

### TODO

+ Image compression

## License

This project is licensed under the **Apache 2.0** License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledegments

* [SHARP](https://github.com/lovell/sharp) is amazing. It's the workhorse behind this script.
* [Chalk](https://github.com/chalk/chalk) for providing pretty colours.