# @babylonjs/loaders — Package Reference

Last verified: 2026-09-25 | Package: `@babylonjs/loaders` (matched to Babylon.js 9.28)

## Purpose

Asset format importers for Babylon.js. Required for loading `.glb` / `.gltf` (industry standard), `.obj`, `.stl`, `.splat`/`.ply` (Gaussian splats), `.bvh`, `.fbx` (9.12.1+) and OpenUSD `.usd`/`.usda`/`.usdc`/`.usdz` (9.26+) files. Without this package, only `.babylon` native format and primitive meshes work.

## License

Apache 2.0 (matches Babylon.js core).

## Install

```bash
npm install @babylonjs/loaders
```

Match version to `@babylonjs/core`:

```jsonc
{
  "dependencies": {
    "@babylonjs/core": "9.28.x",
    "@babylonjs/loaders": "9.28.x"
  }
}
```

## Side-Effect Imports

Loaders register themselves with Babylon's `SceneLoader` on import — no explicit registration call. (Exception: the 9.x `.../pure` entries — e.g. `@babylonjs/loaders/pure`, `@babylonjs/loaders/USD/pure` — do not self-register.) Import only the loaders you need to keep bundle size down:

```typescript
// Just glTF
import "@babylonjs/loaders/glTF";

// Add OpenUSD (.usd/.usda/.usdc/.usdz) — 9.26+
import "@babylonjs/loaders/USD";

// Add FBX — 9.12.1+
import "@babylonjs/loaders/FBX";

// All loaders (largest bundle):
import "@babylonjs/loaders";
```

## Format Coverage

| Format | Babylon.js Support | Notes |
|---|---|---|
| **glTF / glb** | First-class | Industry standard. PBR-aligned. **Use for all new content.** |
| **OpenUSD** (`.usd`, `.usda`, `.usdc`, `.usdz`) | 9.26+ | WASM + Web Worker loader (`USDFileLoader`, plugin name `usd`). See "OpenUSD Loader" below. |
| **FBX** | 9.12.1+ (major expansion 9.26.1) | Pure-TS `FBXFileLoader` (plugin name `fbx`). Prefer converting to glTF offline. |
| `.babylon` | Native | Babylon Editor round-trips only. Legacy. |
| `.obj` | Basic | No animation, no PBR. Simple geometry only. |
| `.stl` | Basic | Single triangle mesh. CAD/3D printing files. |

## Loading Patterns

> The `SceneLoader` class is `@deprecated` (9.5 and 9.28 typings). Use the
> module-level functions from `@babylonjs/core/Loading/sceneLoader`. Options:
> `rootUrl`, `onProgress`, `pluginExtension`, `name`, `pluginOptions`.

### Recommended: AssetContainer (disposable)

```typescript
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

const container = await LoadAssetContainerAsync("/models/character.glb", scene);
container.addAllToScene();

// Later, on level transition:
container.removeAllFromScene();
container.dispose();
```

### Append (permanent)

```typescript
import { AppendSceneAsync } from "@babylonjs/core/Loading/sceneLoader";

await AppendSceneAsync("/models/level.glb", scene);
```

Use only when assets will live for the full scene lifetime.

### ImportMesh (selective)

```typescript
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";

const result = await ImportMeshAsync("/models/character.glb", scene, {
  meshNames: "PlayerMesh", // or omit for all
});
result.meshes;            // AbstractMesh[]
result.animationGroups;   // AnimationGroup[]
result.skeletons;         // Skeleton[]
```

### Lazy loader registration (9.x)

`import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";` then
`registerBuiltInLoaders()` registers async factories for all built-in loaders;
each loader module is dynamically imported only when a load needs it.

### OpenUSD Loader (9.26+)

- Delegates composition to a prebuilt OpenUSD WebAssembly module in a Web Worker.
- **Defaults to fetching the worker, Emscripten glue, WASM and data bundle from
  the Babylon.js CDN** (`Tools._DefaultCdnUrl` + `/babylonUsdImporter/<protocol>/`).
  Upstream says the CDN must not be used in production — self-host and set
  `pluginOptions.usd.workerUrl` / `glueUrl` / `wasmUrl` (see `USDFileLoaderOptions`).
- Does **not** crawl external layers/textures from `rootUrl`; supply them via
  `pluginOptions.usd.files` (keyed by virtual path, with optional `rootFileName`).
- Tree-shakeable entry: `@babylonjs/loaders/USD/pure`.

Source: https://github.com/BabylonJS/Babylon.js/pull/18882

### FBX Loader

Supports FBX 3000–7700, ASCII and binary; animation, DCC materials (resolved to
`StandardMaterial` / `PBRMaterial`), NURBS, LOD groups, constraints (as metadata
or runtime-solved via `FBXConstraintBehavior`). Not supported (reported as
warnings): IK solving, stereo cameras, audio clips, cache deformers, NURBS trim
curves, texture layer blending.

Source: https://github.com/BabylonJS/Babylon.js/pull/18907

## glTF Extensions

`@babylonjs/loaders/glTF` registers support for many official glTF extensions:

- `KHR_materials_*` — material extensions (clearcoat, sheen, transmission, etc.)
- `KHR_lights_punctual` — light support
- `KHR_texture_basisu` — KTX2/Basis compressed textures
- `KHR_draco_mesh_compression` — Draco geometry compression
- `KHR_animation_pointer` — animation targets beyond standard properties
- `EXT_meshopt_compression` — Meshopt compression
- `MSFT_lod` — Microsoft LOD extension
- `KHR_gaussian_splatting` — Gaussian splats in glTF (9.16+)
- `KHR_interactivity` — behaviour graphs (import updated 9.x; export via serializers 9.27+)

For Draco-compressed glTF, additional setup required:

```typescript
import { DracoCompression } from "@babylonjs/core/Meshes/Compression/dracoCompression";
DracoCompression.Configuration = {
  decoder: {
    wasmUrl: "/path/to/draco_wasm_wrapper_gltf.js",
    wasmBinaryUrl: "/path/to/draco_decoder_gltf.wasm",
    fallbackUrl: "/path/to/draco_decoder_gltf.js",
  },
};
```

## Common Patterns

### Loading from CDN
```typescript
const container = await LoadAssetContainerAsync("https://cdn.example.com/assets/model.glb", scene);
```

### Loading from data URI / blob
```typescript
const blob = await fetch(url).then(r => r.blob());
const file = new File([blob], "model.glb");
const container = await LoadAssetContainerAsync(file, scene);
```

### Progress Reporting
```typescript
await LoadAssetContainerAsync("/huge.glb", scene, {
  onProgress: (progress) => {
    if (progress.lengthComputable) {
      console.log(`${(progress.loaded / progress.total) * 100}%`);
    }
  },
});
```

## Performance

- KTX2/Basis compressed textures: **30-50% smaller** than raw PNG/JPG, GPU-native (no decompression cost)
- Draco compression: 70-90% smaller geometry, but adds WASM decode cost on load
- Meshopt: faster than Draco at runtime, similar compression
- For frequently-loaded assets: cache the `AssetContainer`, never re-load

## Common Pitfalls

- Importing `@babylonjs/loaders` (full barrel) when only glTF is needed — wastes bundle size
- Forgetting that loader imports have **side effects** (registration) — `import "@babylonjs/loaders/glTF"` (no `from`) is correct
- Using `Append` for assets that should be removable — leaks on scene transition
- Writing new code against the deprecated `SceneLoader.*` statics instead of the module-level functions
- Letting the USD loader fetch its WASM from the Babylon.js CDN in production
- Loading Draco glTF without configuring DracoCompression paths (silent failure)

## Source Documents

- Asset Loading: https://doc.babylonjs.com/features/featuresDeepDive/importers
- glTF support: https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF
- AssetContainer: https://doc.babylonjs.com/features/featuresDeepDive/importers/assetContainers
- @babylonjs/loaders npm: https://www.npmjs.com/package/@babylonjs/loaders
- Loader package contents verified against the `@babylonjs/loaders` 9.28.0 npm tarball (`FBX/`, `USD/`, `dynamic`, `pure` entries)
