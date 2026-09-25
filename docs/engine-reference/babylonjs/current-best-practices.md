# Babylon.js — Current Best Practices

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

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

Prefer `SceneLoader.LoadAssetContainerAsync()` for assets you may dispose later.
Use `SceneLoader.AppendAsync()` only when permanently merging into the scene.

```typescript
const container = await SceneLoader.LoadAssetContainerAsync(
  "/assets/models/",
  "character.glb",
  scene
);
container.addAllToScene();
// Later: container.removeAllFromScene(); container.dispose();
```

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

## Source Documents

- Best practices index: https://doc.babylonjs.com/
- ESM imports: https://doc.babylonjs.com/setup/frameworkPackages/es6Support
- Performance optimizations: https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeYourScene
- Inspector v2: https://doc.babylonjs.com/toolsAndResources/inspector
