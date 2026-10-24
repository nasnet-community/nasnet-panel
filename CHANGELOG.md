# Changelog

All notable changes to Nasnet Panel are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Direct foreign mode: an emergency switch that sends VPN-bound traffic straight out of the foreign link while the VPN is down, with an explicit risk acknowledgement. Available on the Internet and VPN pages and shown in the routing graph.

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0]

Initial pre-release. Baseline featureset: dashboard, network management, VPN control, wireless, firewall, router discovery, batch operations with rollback, multi-protocol RouterOS access (REST, RouterOS API, SSH, Telnet), Docker image, and `scripts/install.sh` for RouterOS v7 container deployment.

[Unreleased]: https://github.com/nasnet-community/nasnet-panel/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nasnet-community/nasnet-panel/releases/tag/v0.1.0
