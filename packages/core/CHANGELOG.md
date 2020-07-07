# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.2] - 2020-07-07
### Added
- Built-in resize pipe now checks for duplicate formats and removes them (configurable)
- New testing utilities for mocking

### Changed
- Improved formatting

### Fixed
- The type for Pipeline to allow for single or array returns


## [1.0.1] - 2020-06-14
### Added
- Better tests and slight rework of the module

## [1.0.0] - 2020-06-06

First release of the @rib/core package

### Added
- A new core implementation of the pipeline
- Built-in pipes convert, resize and passthrough
