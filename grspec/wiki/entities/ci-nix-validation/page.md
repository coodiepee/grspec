---
title: "CI Nix Validation"
type: entity
created: 2026-05-22
updated: 2026-05-22
confidence: high
sources:
  - grspec/specs/ci-nix-validation/spec.md
  - flake.nix
  - .github/workflows/ci.yml
related:
  - "[[cross-platform-paths]]"
---

# CI Nix Validation

Nix CI validation ensures that Nix users can reliably install and use grspec via the Nix flake. It prevents regressions in Nix support by testing builds and the `update-flake.sh` script on every pull request and push to main.

## What It Validates

- **Nix Flake Build** — Builds the package using `nix build` to verify the flake.nix is valid
- **Update Script** — Tests the `update-flake.sh` maintenance script for correctness
- **Reproducibility** — Ensures builds are reproducible across environments

## CI Integration

Runs as a GitHub Actions workflow alongside the main CI pipeline. Failures block merging to main, ensuring Nix support is always functional.
