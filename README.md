<br />
<div align="center">

  <a href="https://github.com/MarcusCemes/image-processing-pipeline">
    <img src="https://ipp.vercel.app/img/logo.svg" alt="Logo" width="80" height="80">
  </a>
  <h3 align="center">Image Processing Pipeline</h3>

  <div align="center">
    <br />
    <span align="center">An image build orchestrator for the modern web</span>
    <br />
    <a href="https://ipp.vercel.app" align="center"><strong>Website »</strong></a>
    <br /><br />
    <span  align="center">
      <a href="https://github.com/MarcusCemes/image-processing-pipeline/issues">Report Bug</a>
      ·
      <a href="https://github.com/MarcusCemes/image-processing-pipeline/issues">Request Feature</a>
    </span>
    <br /><br />
  </div>

[![npm][badge-npm]][link-npm]&nbsp;&nbsp;
[![Code coverage][badge-coverage]][link-coverage]&nbsp;&nbsp;
[![Node.js][badge-node]][link-node]&nbsp;&nbsp;
[![Typescript][badge-typescript]][link-typescript]&nbsp;&nbsp;
![Make the web lighter][badge-lighter]

</div>

> **Image Processing Pipeline** is a platform-agnostic modular collection of packages that aims to glue together various image libraries into and configurable automated pipeline.

### Philosophy

Images make your websites pop, but they are also the largest asset that you serve to your client. Correctly optimising images provides a much better experience, by not wasting your visitors' bandwidth, battery and making the navigation of your website smoother.

At its highest level, Image Processing Pipeline is a command line tool that helps you **automate** your website's image build process in a **non-destructive** way, with **speed** and **quality** in mind. At a lower level, it is a modular set of functions that can be integrated into any existing backend service.

### How it works

Image Processing Pipeline is built on top of three key concepts:

#### 🌴 Pipeline

At the heart is a user-defined **pipeline**. A pipeline is a collection of **pipes** that can be assembled in any tree-like pattern, along with any additional options and an optional **save key** that will mark the pipe's output for export.

#### 🔨 Pipe

Pipes are **simple asynchronous** functions that take a **source** image and output any number of **formats**. Pipes can apply any transformation to the source image, such as resizing, compressing or converting the image.

#### 🔖 Metadata

Every image is accompanied by a **metadata** object, which is a collection of key-value pairs that describe the image. Pipes may modify an image's metadata object, which can later be used to customise the output filename or to create an image **manifest** file.

### Features

- ⚡ **Fast** - Uses the amazing libvips image processing library
- 🔥 **Parallel** - Scales to any amount of available cores
- 💎 **Lanczos3** - Quality-first image down-scaling algorithm
- 📦 **Works out of the box** - Uses a sane default configuration
- 🌍 **Universal** - Designed to works anywhere without lock-in
- ✂️ **Cross-platform** - Tested on Windows, macOS and Linux
- 😊 **Friendly** - an easy to use CLI experience

## Getting started

### Prerequisites

- Node.js v10.8 or higher
- npm

### Installation

> It is recommended to install IPP as a dependency of your project, this is just an example to quickly try it out

To give IPP a go on the command line, you will need to install the CLI package:

```bash
$ npm i -g @ipp/cli
```

This will add IPP to your path. Find a folder of images, and give it a go:

```bash
$ ipp -i folder/with/images -o output/folder
```

### Configuration

In order to get the most out of IPP you need to set up a configuration file with all of your persistent values. This can be in your `package.json`, or in a file named `.ipprc`, `.ipprc.yml` or `.ipprc.json`.

Then all you need to do is run `ipp` from the terminal!

<sub>.ipprc.yml</sub>

```yaml
# These will be the folders that will get processed,
# relative to the current working directory
input: folder/with/images
output: folder/with/images

# Remove this part to disable manifest generation
manifest:
  source:
    p: path
    x: "hash:8"
  format:
    w: width
    h: height
    f: format
    p: path
    x: "hash:8"

# Here is where you customise the pipeline
# This is what the default pipeline looks like
pipeline:
  - pipe: resize
    options:
      breakpoints:
        - name: sm
          resizeOptions:
            width: 480
        - name: md
          resizeOptions:
            width: 720
        - name: lg
          resizeOptions:
            width: 1920
        - name: xl
          resizeOptions:
            width: 3840
    save: "[name]-[breakpoint][ext]"
    then:
      - pipe: convert
        options:
          format: webp
        save: "[name]-[breakpoint][ext]"
```

### Ready for more?

Check out the [website][link-website] for complete documentation on how to use Image Processing Pipeline.

## Contributing

Contributions are what makes the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
<br />
<sub>Built with ❤︎ by Marcus Cemes</sub>
</div>

<!-- BADGES -->

[badge-npm]: https://img.shields.io/badge/npm-CB3837.svg?style=for-the-badge&logo=npm
[badge-node]: https://img.shields.io/badge/Node.js--339933.svg?style=for-the-badge&logo=node.js
[badge-typescript]: https://img.shields.io/badge/Typescript--0074D9.svg?style=for-the-badge&logo=typescript
[badge-lighter]: https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=for-the-badge
[badge-coverage]: https://img.shields.io/codecov/c/github/MarcusCemes/image-processing-pipeline?style=for-the-badge

<!-- LINKS -->

[link-npm]: https://www.npmjs.com/org/ipp
[link-node]: https://nodejs.org
[link-typescript]: https://www.typescriptlang.org
[link-coverage]: https://codecov.io/gh/MarcusCemes/image-processing-pipeline
[link-website]: https://ipp.vercel.app
