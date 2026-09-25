# Babylon.js — npm Packages Reference

Last verified: 2026-09-25 | Engine: Babylon.js 9.28

> **Status: STUB** — basic package index. Detailed per-package guides will be
> added under `packages/*.md` as those packages are adopted by the project.

This file maps the official `@babylonjs/*` scoped npm packages to their purpose.
**Always use scoped imports**, never the UMD `babylonjs` package. See
`current-best-practices.md` for import discipline.

## Core Packages

| Package | Purpose | When Needed |
|---|---|---|
| `@babylonjs/core` | Engine, scene graph, cameras, lights, meshes, materials, render pipelines | Always |
| `@babylonjs/loaders` | Asset format importers (glTF, OBJ, STL, SPLAT, BVH; FBX 9.12.1+; OpenUSD `.usd/.usda/.usdc/.usdz` 9.26+) | Loading 3D assets |
| `@babylonjs/serializers` | Scene/glTF export | Saving scenes or exporting to glTF |
| `@babylonjs/materials` | Extra materials beyond core PBR/Standard (water, terrain, fire, sky, etc.) | When extra material types are needed |
| `@babylonjs/post-processes` | Extra post-process effects beyond core pipeline | Specialized post effects |
| `@babylonjs/procedural-textures` | Procedural texture library (noise, marble, etc.) | Procedural texture generation |

## UI Packages

| Package | Purpose |
|---|---|
| `@babylonjs/gui` | 2D/3D in-scene UI (ADT, Controls, Holographic UI) |
| `@babylonjs/gui-editor` | Visual GUI editor runtime (for embedding the editor) |

## Tooling Packages

| Package | Purpose | Production-Safe? |
|---|---|---|
| `@babylonjs/inspector` | Runtime debug/inspection panel | ❌ Dev only — ~5MB gzip |
| `@babylonjs/node-editor` | Node Material Editor (NME) | ❌ Dev only |
| `@babylonjs/node-geometry-editor` | Node Geometry Editor | ❌ Dev only |
| `@babylonjs/node-particle-editor` | Node Particle Editor (9.0) | ❌ Dev only |
| `@babylonjs/node-render-graph-editor` | Node Render Graph (Frame Graph) editor | ❌ Dev only |

## Physics Packages

| Package | Purpose | Notes |
|---|---|---|
| `@babylonjs/havok` | Havok Physics WASM runtime | Recommended; iOS < 16.4 incompatible (see `modules/physics.md`) |

For Cannon-es V1 fallback, use the standalone `cannon-es` package and Babylon's
built-in `CannonJSPlugin`.

## Add-ons

| Package | Purpose |
|---|---|
| `@babylonjs/addons` | Add-ons bundle (e.g. atmosphere, MSDF text renderer, `MultiTexture` 9.26.1) |
| `@babylonjs/ktx2decoder` | KTX2 texture decoding support (array + uncompressed KTX2 since 9.18.1) |
| `@babylonjs/accessibility` | Accessibility support for Babylon.js scenes |
| `@babylonjs/viewer` | Babylon Viewer (simplified "load and display a model" use case) — not for games |

## Current npm Versions (checked 2026-09-25)

| Package | Latest | Published |
|---|---|---|
| `@babylonjs/core`, `loaders`, `materials`, `gui`, `gui-editor`, `inspector`, `serializers`, `post-processes`, `procedural-textures`, `node-editor`, `node-geometry-editor`, `node-particle-editor`, `node-render-graph-editor`, `addons`, `ktx2decoder`, `accessibility`, `viewer` | 9.28.0 | 2026-09-24 |
| `@babylonjs/havok` | 1.3.14 | 2026-07-29 (1.3.13: 2026-06-22; 1.3.12: 2026-03-16) — no release notes published (github.com/BabylonJS/havok has no releases); changes unverified |

`@babylonjs/loaders` 9.28.0 declares `peerDependencies: { "@babylonjs/core": "^9.0.0" }` —
npm will NOT stop you mixing minors, so the pinning rule below is on you.
Ignore the stale `preview` / `alpha` dist-tags on npm (5.0.0-rc / 6.34.0-alpha / 8.48.1-preview).

Source: `curl -s https://registry.npmjs.org/@babylonjs/<name>` (`dist-tags.latest`, `time`).

## Version Discipline

All `@babylonjs/*` packages must be pinned to the same minor version as
`@babylonjs/core` (upstream releases every package at the same version, every
release — even unchanged ones). Mismatched versions cause subtle and hard-to-diagnose runtime
errors. Use `npm ls @babylonjs/core` to verify a single resolved version.

Pinning recommendation:

```jsonc
// package.json
{
  "dependencies": {
    "@babylonjs/core": "9.28.x",
    "@babylonjs/gui": "9.28.x",
    "@babylonjs/loaders": "9.28.x"
  }
}
```

Upstream's own docs recommend a caret range (`^9.28.0`) to track weekly minors;
this project deliberately pins the minor (`9.28.x`) so upgrades go through
`/setup-engine upgrade` and this reference is re-verified.

## Source Documents

- Framework Versions: https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers
- ESM/npm setup: https://doc.babylonjs.com/setup/frameworkPackages/npmSupport
- @babylonjs/core npm: https://www.npmjs.com/package/@babylonjs/core
- npm registry metadata: https://registry.npmjs.org/@babylonjs/core, https://registry.npmjs.org/@babylonjs/havok
