# Babylon.js — Version Reference

| Field | Value |
|-------|-------|
| **Engine Version** | 9.28.0 |
| **Installed at pin time** | 9.28.0 (`npm ls @babylonjs/core`, 2026-09-25) — matches the pinned Engine Version, no gap. |
| **Release Date** | 9.0.0: 2026-03-26; 9.28.0: 2026-09-24 (npm publish dates) |
| **Project Pinned** | 2026-09-25 |
| **Last Docs Verified** | 2026-09-25 |
| **LLM Knowledge Cutoff** | May 2026 |

## Knowledge Gap Warning

The LLM's training data likely covers Babylon.js up to ~8.x / early 9.x. 9.0
(March 2026) sits roughly at the edge of the cutoff; the 9.x minors released
after it — and in particular everything from 9.6 (May 2026) through 9.28
(September 2026) — are post-cutoff and the model does NOT know about them.
Always cross-reference this directory before suggesting Babylon.js API calls.

Treat the 9.0 feature set as "near cutoff, verify": AudioEngine v2 (8.0),
Inspector v2 (9.0), Node Particle Editor (9.0), NodeMaterial v2 (9.0),
Clustered Lighting (9.0), Frame Graph (9.0), OpenPBR (9.0), Large World
Rendering / Floating Origin (9.0).

Treat the following as definitely post-cutoff (details in `breaking-changes.md`):
the `@babylonjs/core/pure` barrel and explicit `Register*()` side-effect model
(9.8+), TC39 Stage 3 decorators (breaking for code that applies Babylon
decorators, 9.15), camera `InputMapper` / framerate-independent camera movement
(9.8 / 9.12.1), FBX and OpenUSD loaders in `@babylonjs/loaders`, `RootMotionClip`
/ `RootMotionController` (9.28), `FSR1RenderingPipeline` (9.21.1), GUI
`FlexPanel` + em/rem units (9.26), and the WebXR additions of 9.16–9.24
(persistent anchors, room capture, depth sensing pause/resume, haptics,
viewport scaling, tracked sources, WebGPU XR plumbing).

## Installed-Version Gap Warning

The warning above is one-directional — it covers the **model** knowing less than
this pin. The reverse gap is real too: this reference can sit **ahead of the
installed `@babylonjs/*` packages**, and an agent citing it correctly then emits
APIs that do not exist in `node_modules` (e.g. `@babylonjs/core/pure`, which does
not exist in 9.5). **Check `Installed at pin time` above, and `npm ls
@babylonjs/core`, before trusting a version-qualified claim** — `NOT DETERMINED`
means the gap is unknown, not absent.

## Post-Cutoff Version Timeline

| Version | Release | Risk Level | Key Theme |
|---------|---------|------------|-----------|
| 8.0 | March 2025 | LOW | AudioEngine v2 (opt-in), WebXR depth sensing, Node Geometry Editor — likely in training data |
| 9.0 | 2026-03-26 | MEDIUM | Near cutoff. Clustered Lighting, Inspector v2, Node Particle Editor, Frame Graph, OpenPBR (alpha), Large World Rendering, Geospatial Camera, animation retargeting |
| 9.1 - 9.5 | 2026-04-02 → 2026-04-30 | MEDIUM | Incremental improvements, performance fixes, minor API additions |
| 9.6 - 9.14 | 2026-05-07 → 2026-06-25 | HIGH | Pure barrel / tree-shaking (9.8), camera `InputMapper` (9.8), Smart Assets + `.babylonproj` (9.7 / 9.9.1), texture repetition breaking (9.7), `maxStepHeight` on character controller (9.7), AudioV2 distance-only spatial mode (9.8) and waveform analyzer (9.11), framerate-independent Free/Fly camera (9.12.1), FBX loader first shipped in `@babylonjs/loaders` (9.12.1), `HtmlTexture` / HTML-in-Canvas (9.14) |
| 9.15 - 9.19 | 2026-07-02 → 2026-07-30 | HIGH | **TC39 Stage 3 decorators (official breaking change, 9.15)**; `.pure` split side-effect regressions fixed in 9.16.0 / 9.17.1 / 9.19.0; `KHR_gaussian_splatting` (9.16); WebGPU-XR plumbing (9.16); Havok world-region options (9.19.1) |
| 9.20 - 9.25 | 2026-08-06 → 2026-09-03 | HIGH | FSR 1 upscaling pipeline (9.21.1), WebXR: WebGPU quad layers + CPU depth (9.20.1), persistent anchors / room capture / semantic labels (9.23), depth-sensing pause/resume, haptics, viewport scaling, tracked sources (9.24), white balance in image processing (9.24) |
| 9.26 - 9.28 | 2026-09-10 → 2026-09-24 | HIGH | OpenUSD WASM loader (9.26), GUI `FlexPanel` + em/rem units (9.26), FBX loader overhaul (9.26.1), dithered tile fade plugin, mesh blending post-process (9.26.x), `KHR_interactivity` export (9.27), occlusion query visibility API (9.27.1), root motion (9.28) |

Release dates are npm publish dates of `@babylonjs/core` (`curl -s https://registry.npmjs.org/@babylonjs/core`).

## Verified Sources

- Official docs: https://doc.babylonjs.com/ (docs source: https://github.com/BabylonJS/Documentation)
- API reference (TypeDoc): https://doc.babylonjs.com/typedoc/
- What's New: https://doc.babylonjs.com/whats-new (as of 2026-09-25 its latest summary entry is 9.0.0; use the CHANGELOG for 9.1+)
- Breaking changes: https://doc.babylonjs.com/breaking-changes/ (source: https://github.com/BabylonJS/Documentation/blob/master/content/breaking-changes.md)
- Tree-shaking with pure imports: https://doc.babylonjs.com/setup/frameworkPackages/es6Support/treeShaking
- Framework Versions: https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers
- Changelog: https://github.com/BabylonJS/Babylon.js/blob/master/CHANGELOG.md
- 9.0 announcement (Microsoft Developer Blog): https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/
- 9.0 OpenPBR & engine updates: https://blogs.windows.com/windowsdeveloper/2026/04/02/part-3-babylon-js-9-0-openpbr-and-additional-engine-updates/
- 8.0 audio engine breaking change: https://forum.babylonjs.com/t/audio-engine-breaking-change-for-babylon-js-8-0/56012
- npm @babylonjs/core: https://www.npmjs.com/package/@babylonjs/core
- WebGPU support status: https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus

## Minor Version Policy

Babylon.js ships a new **minor** every Thursday from master, with patch releases
in between; older minors are **not** back-patched (a fix in 9.28.x will not land
in 9.27.x). Upstream guarantees no public-API breaking changes between minors
except when forced by browser API changes — but the 9.15 decorator migration is
an officially documented exception (see `breaking-changes.md`), so re-verify on
every minor bump. (Source: Framework Versions page above.)

This project pins to a Babylon.js **minor** version (currently 9.28). Patch
updates within 9.28.x are auto-acceptable; 9.29 → ... requires updating this
file and re-verifying all module references.

To upgrade: run `/setup-engine upgrade 9.28 [target]` and follow the guided flow.
