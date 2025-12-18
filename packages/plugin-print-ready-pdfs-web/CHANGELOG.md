# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-12-18

### Fixed

- Fixed Webpack 5 compatibility issue where Node.js module imports (`module`, `path`, `fs`, `url`) caused build failures in Angular 17+ and other Webpack 5 environments ([#11471](https://github.com/imgly/ubq/issues/11471))

## [1.1.0] - 2025-12-03

### Added

- Export `Logger` class for controlling log verbosity
- Export `LogLevel` type for TypeScript users

### Changed

- Library is now silent by default (log level set to `warn` instead of `info`)
- Ghostscript WASM module suppresses stdout/stderr output by default

### Fixed

- Eliminated Ghostscript warnings about PDF 1.5 features ("Can't use Object streams", "Can't use an XRef stream") by disabling `-dWriteObjStms` and `-dWriteXRefStm` when targeting PDF 1.4 compatibility

## [1.0.0] - 2025-10-21

### Changed

- Promoted to stable release

## [0.1.0-rc.1] - 2025-10-16

### Added

- Initial release candidate for Print-Ready PDFs plugin
- Full PDF/X-3:2003 compliance with RGB to CMYK conversion
- Three bundled ICC profiles:
  - FOGRA39 (ISO Coated v2) - European printing standard
  - GRACoL 2013 - US commercial printing standard
  - sRGB IEC61966-2.1 - Digital/web distribution
- Custom ICC profile support for specialized printing requirements
- Function overloading for batch PDF processing
- Configurable OutputIntent metadata (identifier and description)
- Transparency flattening control (enabled by default for PDF/X-3 compliance)
- Browser-based PDF processing (100% client-side, no server required)
- Node.js compatibility

### Notes

- This is a release candidate for testing and feedback
- Source code available at: https://github.com/imgly/plugins
- Ghostscript WASM components are AGPL-3.0 licensed
- Client-side execution model minimizes AGPL compliance concerns
- For commercial licensing guidance, consult legal counsel or contact IMG.LY support
