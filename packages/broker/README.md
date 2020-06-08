<!-- PROJECT LOGO -->
<br />
<div align="center">

  <!--
  <a href="https://github.com/MarcusCemes/image-processing-pipeline">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Image Processing Pipeline</h3>
  -->

  <h2 align="center">Image Processing Pipeline</h2>
  <i>Formally known as Responsive Image Builder</i>

  <div align="center">
    <br />
    A modern parallel image processing pipeline
    <br />
    <a href="https://marcus-cemes.gitbook.io/image-processing-pipeline/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/MarcusCemes/image-processing-pipeline/issues">Report Bug</a>
    ·
    <a href="https://github.com/MarcusCemes/image-processing-pipeline/issues">Request Feature</a>
    <br />
    <br />
  </div>

[![npm][badge-npm]][link-npm]&nbsp;&nbsp;
[![Release][badge-release]][link-release]&nbsp;&nbsp;
[![Node.js][badge-node]][link-node]&nbsp;&nbsp;
[![Typescript][badge-typescript]][link-typescript]&nbsp;&nbsp;
![Make the web lighter][badge-lighter]

</div>

<!-- ABOUT THE PROJECT -->

## About The Project

<div align="center">
  <img width="600" alt="Product screenshot" src="https://gistcdn.githack.com/MarcusCemes/9b4a3bbfefdae55e435d5fc98d3df062/raw/2499e76d587db2d5d65466b10c7f8432b11e720a/responsive-image-builder-demo-2.svg" alt="An example of usage">
</div>

At its highest level, Image Processing Pipeline is a CLI tool that helps you automate your website's image build process in a **non destructive** way, with **speed** and **quality** in mind.

It supports several image transformations that can easily be defined in a YAML pipeline syntax, from resizing/converting the image codec to generating tiny SVG placeholders.

To learn why you should optimize your website's images, see the motivation section in the [documentation][link-docs].

### Name change

The v4.0.0 rewrite fundamentally changed how the tool works. To set it apart from the old version, and to better reflect the new functionality, this project has changed its name from **Responsive Image Builder** to **Image Processing Pipeline**.

If you prefer, you may continue to use the old unmaintained version [here][link-legacy].

### Built With

- [Node.js](https://nodejs.org/en/) ([TypeScript][link-typescript])
- [libvips](https://github.com/libvips/libvips) ([sharp][link-sharp])
- And lots of other helpful tools

## Getting started

<div align="center">

**There is some fantastic documentation for this library, go and check it out!**

[![Read the documentation][badge-docs]][link-docs]

</div>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

Marcus Cemes - [@MarcusCemes](https://twitter.com/MarcusCemes)

Project Link: [https://github.com/MarcusCemes/image-processing-pipeline](https://github.com/MarcusCemes/image-processing-pipeline)

<!-- BADGES -->

[badge-npm]: https://img.shields.io/badge/npm-CB3837.svg?style=for-the-badge&logo=npm
[badge-release]: https://img.shields.io/github/release/MarcusCemes/image-processing-pipeline.svg?style=for-the-badge&color=FF851B
[badge-travis]: https://img.shields.io/badge/Travis_CI--FFDC00.svg?style=for-the-badge&logo=travis
[badge-node]: https://img.shields.io/badge/Node.js--339933.svg?style=for-the-badge&logo=node.js
[badge-typescript]: https://img.shields.io/badge/Typescript--0074D9.svg?style=for-the-badge&logo=typescript
[badge-lighter]: https://img.shields.io/badge/Make_the_web-lighter-7FDBFF.svg?style=for-the-badge
[badge-docs]: https://img.shields.io/badge/Documentation--007ACC.svg?style=for-the-badge&logo=read-the-docs

<!-- LINKS -->

[link-npm]: https://www.npmjs.com/package/image-processing-pipeline
[link-release]: https://github.com/MarcusCemes/image-processing-pipeline/releases/latest
[link-node]: https://nodejs.org
[link-typescript]: https://www.typescriptlang.org
[link-docs]: https://marcus-cemes.gitbook.io/image-processing-pipeline/
[link-legacy]: https://github.com/MarcusCemes/image-processing-pipeline/tree/legacy
[link-sharp]:https://github.com/lovell/sharp