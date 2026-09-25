# Babylon.js — npm Packages Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

> **Status: STUB** — basic package index. Detailed per-package guides will be
> added under `packages/*.md` as those packages are adopted by the project.

This file maps the official `@babylonjs/*` scoped npm packages to their purpose.
**Always use scoped imports**, never the UMD `babylonjs` package. See
`current-best-practices.md` for import discipline.

## Core Packages

| Package | Purpose | When Needed |
|---|---|---|
| `@babylonjs/core` | Engine, scene graph, cameras, lights, meshes, materials, render pipelines | Always |
| `@babylonjs/loaders` | Asset format importers (glTF, OBJ, STL, USDz) | Loading 3D assets |
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

## Physics Packages

| Package | Purpose | Notes |
|---|---|---|
| `@babylonjs/havok` | Havok Physics WASM runtime | Recommended; iOS < 16.4 incompatible (see `modules/physics.md`) |

For Cannon-es V1 fallback, use the standalone `cannon-es` package and Babylon's
built-in `CannonJSPlugin`.

## Add-ons

| Package | Purpose |
|---|---|
| `@babylonjs/addons` | Community add-ons bundle |

## Version Discipline

All `@babylonjs/*` packages must be pinned to the same minor version as
`@babylonjs/core`. Mismatched versions cause subtle and hard-to-diagnose runtime
errors. Use `npm ls @babylonjs/core` to verify a single resolved version.

Pinning recommendation:

```jsonc
// package.json
{
  "dependencies": {
    "@babylonjs/core": "9.5.x",
    "@babylonjs/gui": "9.5.x",
    "@babylonjs/loaders": "9.5.x"
  }
}
```

## Source Documents

- Framework Versions: https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers
- ESM/npm setup: https://doc.babylonjs.com/setup/frameworkPackages/npmSupport
- @babylonjs/core npm: https://www.npmjs.com/package/@babylonjs/core
