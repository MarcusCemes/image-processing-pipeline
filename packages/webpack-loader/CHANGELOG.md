# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2020-09-03

### Added

- More available metadata, such as the path, extension, source directory, ...
- Interpolates the save key and adds to metadata
- ES module output support

### Changed

- Cleaned up webpack options
- Updated tests

### Fixed

- Options JSON Schema

## [1.0.1] - 2020-08-30

### Fixed

- Metadata handling, adding of `path` and `save` keys, added failing test

## [1.0.0] - 2020-08-30

First release of the @rib/webpack package

### Added

- An implementation of a webpack loader for IPP
- Supports simple exports and manifest exports
