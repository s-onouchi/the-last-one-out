# @babylonjs/loaders — Package Reference

Last verified: 2026-05-03 | Package: `@babylonjs/loaders` (matched to Babylon.js 9.5)

## Purpose

Asset format importers for Babylon.js. Required for loading `.glb` / `.gltf` (industry standard), `.obj`, `.stl`, and `.usdz` (8.0+) files. Without this package, only `.babylon` native format and primitive meshes work.

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
    "@babylonjs/core": "9.5.x",
    "@babylonjs/loaders": "9.5.x"
  }
}
```

## Side-Effect Imports

Loaders register themselves with Babylon's `SceneLoader` on import — no explicit registration call. Import only the loaders you need to keep bundle size down:

```typescript
// Just glTF
import "@babylonjs/loaders/glTF";

// Add USDz
import "@babylonjs/loaders/USDZ";

// All loaders (largest bundle):
import "@babylonjs/loaders";
```

## Format Coverage

| Format | Babylon.js Support | Notes |
|---|---|---|
| **glTF / glb** | First-class | Industry standard. PBR-aligned. **Use for all new content.** |
| **USDz** | 8.0+ | Apple ecosystem. AR Quick Look pipeline. |
| `.babylon` | Native | Babylon Editor round-trips only. Legacy. |
| `.obj` | Basic | No animation, no PBR. Simple geometry only. |
| `.stl` | Basic | Single triangle mesh. CAD/3D printing files. |

## Loading Patterns

### Recommended: AssetContainer (disposable)

```typescript
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";

const container = await SceneLoader.LoadAssetContainerAsync(
  "/models/",
  "character.glb",
  scene
);
container.addAllToScene();

// Later, on level transition:
container.removeAllFromScene();
container.dispose();
```

### Append (permanent)

```typescript
await SceneLoader.AppendAsync("/models/", "level.glb", scene);
```

Use only when assets will live for the full scene lifetime.

### ImportMesh (selective)

```typescript
const result = await SceneLoader.ImportMeshAsync(
  "PlayerMesh",  // mesh name to filter, or "" for all
  "/models/",
  "character.glb",
  scene
);
result.meshes;            // Mesh[]
result.animationGroups;   // AnimationGroup[]
result.skeletons;         // Skeleton[]
result.materials;         // Material[]
```

## glTF Extensions

`@babylonjs/loaders/glTF` registers support for many official glTF extensions:

- `KHR_materials_*` — material extensions (clearcoat, sheen, transmission, etc.)
- `KHR_lights_punctual` — light support
- `KHR_texture_basisu` — KTX2/Basis compressed textures
- `KHR_draco_mesh_compression` — Draco geometry compression
- `KHR_animation_pointer` — animation targets beyond standard properties
- `EXT_meshopt_compression` — Meshopt compression
- `MSFT_lod` — Microsoft LOD extension

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
const container = await SceneLoader.LoadAssetContainerAsync(
  "https://cdn.example.com/assets/",
  "model.glb",
  scene
);
```

### Loading from data URI / blob
```typescript
const blob = await fetch(url).then(r => r.blob());
const file = new File([blob], "model.glb");
await SceneLoader.LoadAssetContainerAsync("file:", file, scene);
```

### Progress Reporting
```typescript
SceneLoader.LoadAssetContainerAsync(
  "/", "huge.glb", scene,
  (progress) => {
    if (progress.lengthComputable) {
      console.log(`${(progress.loaded / progress.total) * 100}%`);
    }
  }
);
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
- Concatenating `rootUrl + sceneFilename` instead of passing them separately (relative URL bugs)
- Loading Draco glTF without configuring DracoCompression paths (silent failure)

## Source Documents

- Asset Loading: https://doc.babylonjs.com/features/featuresDeepDive/importers
- glTF support: https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF
- AssetContainer: https://doc.babylonjs.com/features/featuresDeepDive/importers/assetContainers
- @babylonjs/loaders npm: https://www.npmjs.com/package/@babylonjs/loaders
