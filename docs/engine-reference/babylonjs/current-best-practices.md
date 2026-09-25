# Babylon.js — Current Best Practices

Last verified: 2026-09-25 | Engine: Babylon.js 9.28

Distilled from official Babylon.js docs, forum guidance, and community consensus
as of the pin date. For deep dives, follow links to https://doc.babylonjs.com/.

## Project Setup

### TypeScript Configuration

This project mandates `strict: true` and `noUncheckedIndexedAccess: true` (see
`/CLAUDE.md` and the project's `tsconfig.json`). Babylon.js ships full `.d.ts`
typings, so strict mode pays for itself in code completion and refactor safety.

Recommended additional flags:

- `exactOptionalPropertyTypes: true` (catches `undefined` vs missing distinction)
- `noUnusedLocals: true`, `noUnusedParameters: true`
- `target: ES2022` or later — matches Babylon.js's own ES build target
- `module: ESNext`, `moduleResolution: bundler` — enables native ESM tree-shaking

### Package Imports (CRITICAL)

**Use scoped ESM imports** — never the UMD `babylonjs` package:

```typescript
// ✅ Good — tree-shakeable
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

// ❌ Bad — pulls in the whole engine
import { Engine, Scene, Vector3 } from "@babylonjs/core";

// ❌ Worst — UMD; defeats every optimizer
import * as BABYLON from "babylonjs";
```

The "best" form depends on your bundler's tree-shaking, but **narrow named
imports from sub-paths** are universally optimal.

**9.8+: pure barrel.** `@babylonjs/core/pure` (and per-folder `.../pure`,
`*.pure` modules; also `@babylonjs/loaders/pure`) re-exports everything *without*
running side effects, so one barrel import stays tree-shakeable — but you must
call the registration helpers yourself (see "9.5 → 9.28 Updates" below). Do not
adopt it casually: 9.15–9.18 shipped several missing-registration regressions.

### Build Tool

Vite is the recommended bundler for new Babylon.js projects in 2026:

- Native ESM, tree-shakes Babylon.js cleanly
- Fast dev server, HMR works for non-engine code
- Aligns with Vitest (test framework) for shared config

Webpack still works; esbuild and Rollup also fine. Avoid Browserify (legacy).

## Scene Construction

### Engine Lifecycle

Create `Engine` once per app, never multiple. Dispose at app shutdown only:

```typescript
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
window.addEventListener("beforeunload", () => engine.dispose());
```

For WebGPU, use `await WebGPUEngine.IsSupportedAsync` and fall back to `Engine`
if false.

### Scene Pattern

```typescript
function createScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  // ... add cameras, lights, meshes
  return scene;
}

const scene = createScene(engine);
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
```

Always pass an explicit `Scene` reference to APIs that take one — never rely on a
"current scene" global.

### Asset Loading

Prefer the **module-level** `LoadAssetContainerAsync()` for assets you may
dispose later. Use `AppendSceneAsync()` only when permanently merging into the
scene. The `SceneLoader` class is `@deprecated` in the 9.5 and 9.28 typings
("The module level functions are more efficient for bundler tree shaking and
allow plugin options to be passed through") — it still works, but do not write
new code against it.

```typescript
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

const container = await LoadAssetContainerAsync("/assets/models/character.glb", scene);
container.addAllToScene();
// Later: container.removeAllFromScene(); container.dispose();
```

Options object (all optional): `rootUrl`, `onProgress`, `pluginExtension`,
`name`, `pluginOptions` (keyed by loader plugin name, e.g. `gltf`, `usd`, `fbx`).

## Disposal Discipline

Babylon.js does not garbage-collect WebGL resources. Manual `dispose()` is mandatory:

- Disposing a Scene cascades to its meshes/materials/textures
- Disposing a Mesh does NOT dispose its material (shared materials would break)
- Always remove Observer callbacks: `observable.removeCallback(observer)`
- For dynamic content, use `AssetContainer` for atomic add/remove cycles

## Performance

### Initial Load
- Pre-compile shaders for the first interactive scene before user interaction:
  `await material.forceCompilationAsync(mesh)`
- Enable `engine.snapshotRendering = true` for fully static scenes
- Use KTX2 textures for production builds (smaller, GPU-native)

### Runtime
- Freeze static meshes: `mesh.freezeWorldMatrix()`
- Freeze static materials: `material.freeze()`
- Set `mesh.isPickable = false` on non-interactive meshes
- Use `MeshLODLevel` for distance-based detail reduction
- Profile with Inspector v2 → Tools → Performance and Chrome DevTools Performance

### Bundle Size
- Always use scoped imports (see above)
- Lazy-load `@babylonjs/inspector` — never include in production
- Code-split per route/scene where possible
- Watch the bundle analyzer output (`vite build --mode=analyze`)

## Render Loop

One `engine.runRenderLoop(...)` call per app, period. For multi-scene:

```typescript
engine.runRenderLoop(() => {
  if (currentScene === sceneA) sceneA.render();
  else sceneB.render();
});
```

For WebXR, the XR session takes over the render loop — do NOT call
`engine.runRenderLoop` while in XR.

## Observer Pattern (Babylon.js's Event System)

```typescript
const observer = scene.onBeforeRenderObservable.add(() => {
  // per-frame logic
});

// On cleanup:
scene.onBeforeRenderObservable.remove(observer);
```

For one-shot: use `addOnce(...)`. Always store the returned `Observer` so you
can remove it; orphan observers are a common memory leak.

## Type Patterns

- `Nullable<T>` is Babylon.js's `T | null` alias — use it consistently with Babylon.js APIs
- Use `import type { ... }` for type-only imports (better tree-shaking)
- Avoid `as any` casts — they bypass strict mode benefits

## Testing

- Vitest for unit + integration tests (see project test-setup)
- jsdom environment for unit tests; real browser via Vitest browser mode for
  WebGL-dependent integration tests
- Playwright for E2E and visual regression (optional, project-dependent)
- Mock the Engine in unit tests by extracting pure logic from Babylon.js classes

## 9.5 → 9.28 Updates

### Upgrade discipline
- Bump every `@babylonjs/*` package together; upstream publishes all packages at
  the same version every release and does not back-patch older minors.
- Skip 9.15.x–9.18.x: side-effect registration regressions from the `.pure`
  split were fixed across 9.16.0, 9.17.1 and 9.19.0.
- If your own classes apply Babylon decorators, keep `experimentalDecorators`
  off and use `accessor` where required (9.15 breaking change).

### Pure imports (opt-in, 9.8+)

```typescript
import { Engine, Scene, RegisterStandardEngineExtensions } from "@babylonjs/core/pure";

RegisterStandardEngineExtensions(); // Core + textures, file loading, alpha, RTTs, UBOs
```

Tiers: `RegisterCoreEngineExtensions()` < `RegisterStandardEngineExtensions()`
(recommended for most apps) < `RegisterFullEngineExtensions()` (cube/raw/dynamic
textures, multi-render, multiview, queries, compute, video, debug). Loading
serialized scenes needs registration for the serialized types. Default
(non-pure) imports are unchanged and remain the project default until a bundle
budget forces the switch.

### Cameras
- Free/Fly/ArcRotate/Geospatial cameras now expose `camera.movement` with an
  `InputMapper` at `camera.movement.input`; configure bindings/sensitivity there
  instead of the deprecated per-input sensitivity properties.
- Movement and inertia are framerate-independent (9.12.1 / 9.14) — tune feel on a
  high-refresh display as well as 60 Hz. `camera.inertia = 0` disables glide.

### Assets
- glTF/glb remains the default runtime format.
- FBX (`@babylonjs/loaders/FBX`) and OpenUSD (`@babylonjs/loaders/USD`, 9.26+)
  import now exist. Prefer converting to glTF in the asset pipeline; if loading
  USD at runtime, self-host the worker/WASM (`pluginOptions.usd.workerUrl` /
  `glueUrl` / `wasmUrl`) — the default points at the Babylon.js CDN, which
  upstream says not to use in production.

### Rendering
- For GPU-bound scenes, consider `FSR1RenderingPipeline` (9.21.1; WebGPU, WebGL2)
  for upscaling instead of lowering `engine.setHardwareScalingLevel` alone.

## Source Documents

- Best practices index: https://doc.babylonjs.com/
- ESM imports: https://doc.babylonjs.com/setup/frameworkPackages/es6Support
- Performance optimizations: https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeYourScene
- Inspector v2: https://doc.babylonjs.com/toolsAndResources/inspector
- Tree-shaking with pure imports: https://doc.babylonjs.com/setup/frameworkPackages/es6Support/treeShaking
- Framework Versions (release cadence, CDN warning): https://doc.babylonjs.com/setup/frameworkPackages/frameworkVers
- CHANGELOG: https://github.com/BabylonJS/Babylon.js/blob/master/CHANGELOG.md
