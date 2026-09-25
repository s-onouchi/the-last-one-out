# Babylon.js — Breaking Changes Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

This file summarizes the major breaking changes between LLM training data
(~7.x) and the pinned version. For the canonical list, always check
https://doc.babylonjs.com/breaking-changes/.

## 7.x → 8.0 (March 2025)

### Audio Engine: Default Disabled

The legacy audio engine no longer auto-creates with the graphics Engine.

**Before (7.x):** `new Engine(canvas)` automatically constructed an AudioEngine.

**After (8.0+):** AudioEngine must be opted into explicitly:

```typescript
// Old engine (still available, but deprecated):
const engine = new Engine(canvas, true, { audioEngine: true });

// New AudioEngine v2 (recommended):
const audioEngine = await CreateAudioEngineAsync();
```

If your code calls `Engine.audioEngine` without setting `audioEngine: true`, it returns null.

Source: https://forum.babylonjs.com/t/audio-engine-breaking-change-for-babylon-js-8-0/56012

### USDz Import (New)

`SceneLoader` accepts `.usdz` files via the loaders package — opt-in import.
No code is broken, but project asset pipelines should consider USDz alongside glTF.

### WebXR Depth Sensing

New `WebXRFeatureName.DEPTH_SENSING` feature available in 8.0+. Older code that
ran without depth sensing continues to work; new projects targeting AR with
occlusion should adopt it.

### TypeScript Type Tightening

Several Babylon.js APIs that previously accepted loose types (e.g. `any`)
narrowed in 8.0. Code with `strict: true` and `noUncheckedIndexedAccess: true`
may surface errors that were previously silent. Treat new TS errors as bugs
to fix, not warnings to suppress.

## 8.0 → 9.0 (March 2026)

### NodeMaterial v2

NodeMaterial received a v2 redesign with new node types. Existing v1 materials
continue to work, but v2 nodes are not available to v1 graphs and vice versa.

**Migration:** Most v1 materials work unchanged. Materials that used internal
private APIs may break. Re-export through the Node Material Editor (NME) if so.

### Inspector v2

The runtime Inspector (`@babylonjs/inspector`) was rewritten ground-up in 9.0
with a service-oriented React-based architecture.

**Migration:** Public Inspector APIs are mostly compatible. Custom inspector
extensions written against v1 internals must be ported.

### Clustered Lighting (New, opt-in)

A new clustered lighting path is available for scenes with many real-time lights.
**Not enabled by default** — opt-in via scene configuration. Existing forward
lighting code continues to work unchanged.

### Frame Graph (New, opt-in)

A new declarative render pipeline API (`FrameGraph`) lands in 9.0. Existing
post-process pipelines (`DefaultRenderingPipeline`, etc.) continue to work.
FrameGraph is for advanced users wanting fine-grained pipeline control.

### Floating Origin / Large World Rendering (New, opt-in)

New API for keeping the active camera at world origin and offsetting geometry,
solving precision issues at large world coordinates. Opt-in; existing code unchanged.

### OpenPBR (New, opt-in material)

New `OpenPBRMaterial` joins existing `PBRMaterial` and `StandardMaterial`. Use
when you need OpenPBR-spec compliant materials (cross-engine asset interchange).

### Animation Retargeting (New)

Built-in retargeting API for skeletal animations. New feature; existing
animation code unchanged.

### Geospatial Camera (New)

`GeospatialCamera` for orbiting a spherical planet, separate from existing camera classes.

### WebGPU Production-Ready

WebGPU is no longer "experimental" — 9.0 marks production-ready status.
WebGL2 remains the conservative default; WebGPU is opt-in via `WebGPUEngine`.

## What Generally Did NOT Change

- ESM scoped imports (`@babylonjs/core/...`) work the same way 7→8→9
- Scene/Mesh/TransformNode core APIs are stable
- glTF/glb loading is unchanged (USDz is additive)
- Observer pattern (`Observable`/`Observer`) is unchanged
- Disposal semantics (`dispose()`) are unchanged

## Migration Checklist for Code Last Touched on 7.x

1. Audit all `Engine.audioEngine` references — set `audioEngine: true` or migrate to AudioEngine v2
2. Re-run TypeScript build with `strict: true` + `noUncheckedIndexedAccess: true` and address new errors
3. Test custom Inspector extensions against Inspector v2 (rebuild if broken)
4. Re-check NodeMaterial graphs that used internal APIs (export via NME if needed)
5. Verify any `cannon`/`ammo` physics imports — Havok is now the default recommendation
6. Run a full visual smoke test — rendering output is unchanged for default paths but worth confirming
