# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.2] - 2019-03-20
### Added
- Started keeping a changelog
- semantic-release integration with Travis CI for automatic deployment to GitHub and NPM

### Removed
- standard-version (and other version-related package.json scripts)

### Changed
- docs:(readme) will now trigger a patch release

### Fixed
- Badges are now recognized by the npms.io scoring algorithm

## [2.0.1] - 2019-03-16
### Changed
- Improved README
- Fixed links
- Added new demo image

### Fixed
- Absolute path conflict with `tiny-glob`

## [2.0.0] - 2019-03-16

#### Responsive Image Builder has been re-written from the ground up!

It took a while, but here it is! Bear in mind that this is a major update, introducing many BREAKING CHANGES. The readme has been re-written, give it a quick check to see what's changed and how to use the new API.

The TODO list has been extended with future goals, if you have another idea for improvement then why not fork the project and submit a Pull Request?

### Added
- Typescript
- ES Module import support (tree-shaking is now "possible")
- More image optimizers
- Better documentation
- TODO list
- Travis CI script

### Changed
- Better configuration
- Better performance with Node.js streams

## [1.1.3] - 2018-11-11
### Fixed
- Fixed bug where GIFs would fail to copy from nested directories

## [1.1.2] - 2018-11-08
### Changed
- Use `fs-extra` in favour of `fs`

### Fixed
- Fix bug on UNIX systems when copying from nested directories

## [1.1.1] - 2018-11-04
### Added
- Angular example on how to use the library

## [1.1.0] - 2018-11-04
### Added
- Image optimization

## [1.0.3] - 2018-11-03
First release

[Unreleased]: https://github.com/marcuscemes/responsive-image-builder/compare/v2.0.2...HEAD
[2.0.2]: https://github.com/marcuscemes/responsive-image-builder/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/marcuscemes/responsive-image-builder/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/marcuscemes/responsive-image-builder/compare/v1.1.3...v2.0.0
[1.1.3]: https://github.com/marcuscemes/responsive-image-builder/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/marcuscemes/responsive-image-builder/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/marcuscemes/responsive-image-builder/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/marcuscemes/responsive-image-builder/compare/v1.0.3...v1.1.0
[1.0.3]: https://github.com/marcuscemes/responsive-image-builder/compare/v0.0.1...v1.0.3