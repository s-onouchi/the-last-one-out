# Babylon.js — Deprecated APIs

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

> **Status: STUB** — this file is intentionally minimal. Will be expanded as
> deprecation cases come up during implementation. For the canonical list,
> always check https://doc.babylonjs.com/breaking-changes/ and the deprecation
> warnings emitted at runtime.

## Deprecated as of 9.5

### `babylonjs` (UMD package)

The single-file UMD package is **strongly discouraged** for new projects. Use
the scoped ESM packages (`@babylonjs/core`, `@babylonjs/gui`, etc.) instead.
The UMD package defeats tree-shaking and inflates bundle size dramatically.

### Physics V1 plugins (Cannon, Ammo, Oimo)

The V1 physics API and plugins (`CannonJSPlugin`, `AmmoJSPlugin`, `OimoJSPlugin`)
remain available but are no longer the default path. New projects should use
Havok via the V2 physics API. See `modules/physics.md`.

Cannon-es is acceptable as a fallback only for projects targeting iOS < 16.4
where Havok's WebAssembly SIMD requirement is unmet.

### `StandardMaterial` (de facto deprecated for 3D)

Not formally deprecated, but `PBRMaterial` is the recommended default for new
3D content. `StandardMaterial` is retained for legacy projects and very simple
unlit/diffuse use cases.

### Inspector v1 extensions

Custom Inspector extensions written against pre-9.0 internals must be ported
to the Inspector v2 service-oriented architecture. Public Inspector APIs are
mostly compatible.

## Watching Future Deprecations

Babylon.js typically emits console warnings before removing APIs. When the
agent encounters a deprecation warning during development, surface it to the
user and propose a migration path; do not silence it.

## Source Documents

- Breaking Changes (canonical list): https://doc.babylonjs.com/breaking-changes/
- What's New: https://doc.babylonjs.com/whats-new
