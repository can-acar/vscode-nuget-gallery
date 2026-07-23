# Change Log

All notable changes to the "vscode-nuget-manager" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This project is a fork of [pcislo/vscode-nuget-gallery](https://github.com/pcislo/vscode-nuget-gallery), forked at upstream version 1.2.6. For changes prior to the fork, see the upstream changelog.

## [Unreleased]

### Added

- Search packages across all configured sources at once
- Support for embedded package icons

### Changed

- Refined package search behaviour and action buttons
- `vscode:prepublish` now always produces a minified production build

### Fixed

- "Settings" and "Report Problem" buttons now appear in the NuGet panel title bar
- `skipRestore` no longer skips restore by default on fresh installs (the setting defaulted to a truthy string)
- Repository and issue-reporting links now point to the actual GitHub repository

### Removed

- Telemetry (OpenTelemetry / New Relic trace export inherited from upstream)

## [1.0.1]

### Added

- .NET protocol host for NuGet feed queries (source discovery, search, package details)
- Webview localization (English, Turkish)

### Changed

- Rebranded the extension to "VS Code NuGet Manager"

## [1.0.0]

Initial release of the fork, based on upstream version 1.2.6.

### Added

- Redesigned gallery UI
- Project-scoped package actions and per-project dropdown
