# Babylon.js — Deprecated APIs

Last verified: 2026-09-25 | Engine: Babylon.js 9.28

> **Status: STUB** — this file is intentionally minimal. Will be expanded as
> deprecation cases come up during implementation. For the canonical list,
> always check https://doc.babylonjs.com/breaking-changes/ and the deprecation
> warnings emitted at runtime.

## Deprecated as of 9.5 (still applies at 9.28)

### `babylonjs` (UMD package)

The single-file UMD package is **strongly discouraged** for new projects. Use
the scoped ESM packages (`@babylonjs/core`, `@babylonjs/gui`, etc.) instead.
The UMD package defeats tree-shaking and inflates bundle size dramatically.

### `SceneLoader` class (static methods)

`SceneLoader` is marked `@deprecated` in the `@babylonjs/core` 9.5.0 **and**
9.28.0 typings: "The module level functions are more efficient for bundler tree
shaking and allow plugin options to be passed through ... The SceneLoader class
will remain available". Use the module-level functions from
`@babylonjs/core/Loading/sceneLoader`:

| Deprecated | Use Instead |
|------------|-------------|
| `SceneLoader.LoadAssetContainerAsync(rootUrl, file, scene)` | `LoadAssetContainerAsync(source, scene, options?)` |
| `SceneLoader.AppendAsync(...)` | `AppendSceneAsync(source, scene, options?)` |
| `SceneLoader.ImportMeshAsync(...)` | `ImportMeshAsync(source, scene, { meshNames, ... })` |
| `SceneLoader.LoadAsync(...)` | `LoadSceneAsync(source, engine, options?)` |
| `SceneLoader.ImportAnimationsAsync(...)` | `ImportAnimationsAsync(source, scene, options?)` |
| lower-camel `loadAssetContainerAsync` / `appendSceneAsync` / `loadSceneAsync` / `registerSceneLoaderPlugin` | PascalCase `LoadAssetContainerAsync` / `AppendSceneAsync` / `LoadSceneAsync` / `RegisterSceneLoaderPlugin` |

The version in which `SceneLoader` was first deprecated was not verified (it is
already deprecated in 9.5.0).

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

## 9.5 → 9.28

If an agent suggests any API in the "Deprecated" column, it MUST be replaced
with the "Use Instead" column. Entries come from `@deprecated` tags added to the
`@babylonjs/core` 9.28.0 typings that are absent from 9.5.0, plus the official
9.15 breaking-change entry.

### Methods & Properties

| Deprecated | Use Instead | Since | Notes |
|------------|-------------|-------|-------|
| `GeospatialCameraKeyboardInput.rotationSensitivity` / `panSensitivity` / `zoomSensitivity` | `sensitivity` field on the keyboard rotate / pan / zoom entry in `camera.movement.input.inputMap` | 9.8+ (camera `InputMapper`) | Getters/setters still work |
| `GeospatialCameraPointersInput.pitchSensitivity` / `yawSensitivity` | `sensitivity` field on the pointer rotate entry in `camera.movement.input.inputMap` | 9.8+ | Getters/setters still work |
| `InterpolatingBehavior.updateProperties(properties)` | `animatePropertiesAsync(properties, remainingDurationMs)` | ≤ 9.28 (exact minor unverified) | Makes the duration explicit |
| Reading the internal `_propStore` array (Node Material / Node Geometry editable props) | `GetEditableProperties(target)` | 9.15 | `_propStore` removed; metadata now on `Symbol.metadata` |
| `TargetCamera._rotationEpsilon` (internal) as a rotation-glide cutoff | Nothing — rotation glide defers to the movement system's velocity epsilon | 9.14 | Property still exists but no longer ends rotation glide |

### Patterns (Not Just APIs)

| Deprecated Pattern | Use Instead | Why |
|--------------------|-------------|-----|
| `experimentalDecorators: true` in `tsconfig.json` alongside Babylon decorators | `experimentalDecorators: false` (default) + `accessor` on `@expandToProperty` / `@addAccessorsForMaterialProperty` fields | 9.15 moved to TC39 Stage 3 decorators; legacy mode makes them silently no-op |
| Mixing `.pure` imports without calling `Register*()` | Call the matching `Register*()` (e.g. `RegisterStandardEngineExtensions()`), or use normal (non-`.pure`) imports | `.pure` modules run no side effects by design |
| Relying on the Babylon.js CDN for runtime assets (e.g. the OpenUSD loader's default `workerUrl`) in production | Self-host the files | Upstream: "The CDN should not be used in production environments" (Framework Versions page) |

## Watching Future Deprecations

Babylon.js typically emits console warnings before removing APIs. When the
agent encounters a deprecation warning during development, surface it to the
user and propose a migration path; do not silence it.

## Source Documents

- Breaking Changes (canonical list): https://doc.babylonjs.com/breaking-changes/
- What's New: https://doc.babylonjs.com/whats-new
- Tree-shaking / pure imports: https://doc.babylonjs.com/setup/frameworkPackages/es6Support/treeShaking
- Framework Versions (CDN not for production): https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers
- Camera input mapping PR: https://github.com/BabylonJS/Babylon.js/pull/18379
