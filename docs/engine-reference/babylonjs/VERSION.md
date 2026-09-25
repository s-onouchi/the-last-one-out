# Babylon.js — Version Reference

| Field | Value |
|-------|-------|
| **Engine Version** | Babylon.js 9.5 |
| **Release Date** | March 2026 (9.0 series); 9.5 minor in May 2026 |
| **Project Pinned** | 2026-05-03 |
| **Last Docs Verified** | 2026-05-03 |
| **LLM Knowledge Cutoff** | January 2026 |

## Knowledge Gap Warning

The LLM's training data likely covers Babylon.js up to ~7.x. Versions 8.0 (March 2025)
and 9.0 (March 2026) introduced significant changes that the model does NOT know about.
Always cross-reference this directory before suggesting Babylon.js API calls.

In particular: AudioEngine v2 (8.0 default-disabled change), USDz import (8.0),
WebXR depth sensing (8.0), Inspector v2 (9.0), Node Particle Editor (9.0),
NodeMaterial v2 (9.0), Clustered Lighting (9.0), Frame Graph (9.0),
OpenPBR (9.0), Floating Origin / Large World Rendering (9.0),
WebGPU production-ready path (9.0) all post-date the cutoff.

## Post-Cutoff Version Timeline

| Version | Release | Risk Level | Key Theme |
|---------|---------|------------|-----------|
| 8.0 | March 2025 | HIGH | AudioEngine v2 (opt-in), USDz loader, WebXR depth sensing, Node Geometry Editor |
| 9.0 | March 2026 | HIGH | Clustered Lighting, Inspector v2, Node Particle Editor, Frame Graph, OpenPBR, Floating Origin, animation retargeting, WebGPU production-ready |
| 9.1 - 9.5 | Mar-May 2026 | MEDIUM | Incremental improvements, performance fixes, minor API additions |

## Verified Sources

- Official docs: https://doc.babylonjs.com/
- API reference (TypeDoc): https://doc.babylonjs.com/typedoc/
- What's New: https://doc.babylonjs.com/whats-new
- Breaking changes: https://doc.babylonjs.com/breaking-changes/
- Framework Versions: https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers
- Changelog: https://github.com/BabylonJS/Babylon.js/blob/master/CHANGELOG.md
- 9.0 announcement (Microsoft Developer Blog): https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/
- 9.0 OpenPBR & engine updates: https://blogs.windows.com/windowsdeveloper/2026/04/02/part-3-babylon-js-9-0-openpbr-and-additional-engine-updates/
- 8.0 audio engine breaking change: https://forum.babylonjs.com/t/audio-engine-breaking-change-for-babylon-js-8-0/56012
- npm @babylonjs/core: https://www.npmjs.com/package/@babylonjs/core
- WebGPU support status: https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus

## Minor Version Policy

This project pins to a Babylon.js **minor** version (currently 9.5). Patch updates
within 9.5.x are auto-acceptable; 9.6 → ... requires updating this file and
re-verifying all module references.

To upgrade: run `/setup-engine upgrade 9.5 [target]` and follow the guided flow.
