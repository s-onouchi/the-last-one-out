# Babylon.js Rendering — Quick Reference

Last verified: 2026-09-25 | Engine: Babylon.js 9.28

## Renderer Selection

| Renderer | Status | Use When |
|---|---|---|
| **Engine** (WebGL2) | Stable, universal | Default. WebXR. Mobile. Conservative compatibility |
| **WebGPUEngine** | Production-ready (9.0) | Desktop projects on Chrome/Edge/Safari TP; compute shaders |

Detection pattern:

```typescript
const useWebGPU = await WebGPUEngine.IsSupportedAsync;
const engine = useWebGPU
  ? new WebGPUEngine(canvas).then(async (e) => { await e.initAsync(); return e; })
  : new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
```

**As of 2026-05 (not re-verified 2026-09-25 — doc.babylonjs.com unreachable from the verification environment):**
- WebGPU stable on Chrome/Edge/desktop Safari
- Quest browser: WebGPU NOT yet stable (use WebGL2 for XR)
- iOS Safari: WebGPU recently shipped, spotty

Source: https://doc.babylonjs.com/setup/support/webGPU/webGPUStatus

## Materials

### PBR Materials (Default for 3D)

`PBRMaterial` — metallic/roughness PBR workflow. Default for new code.

```typescript
const mat = new PBRMaterial("mat", scene);
mat.albedoTexture = new Texture("albedo.png", scene);
mat.metallic = 0.0;
mat.roughness = 0.5;
scene.environmentTexture = CubeTexture.CreateFromPrefilteredData("env.env", scene);
```

**Critical:** Set `scene.environmentTexture` to an `.env` file (or CubeTexture)
or PBR materials render pitch black (no IBL = no ambient/specular contribution).

### OpenPBR Materials (9.0+, opt-in)

`OpenPBRMaterial` — OpenPBR-spec compliant for cross-engine asset interchange.
Use when interop with DCC tools using OpenPBR matters.

### StandardMaterial (Legacy)

`StandardMaterial` — pre-PBR Phong-style. Only for very simple unlit/diffuse cases.
For new code, prefer `PBRMaterial`.

### NodeMaterial v2 (9.0+)

Visual graph material editor at https://nme.babylonjs.com.

```typescript
const nm = await NodeMaterial.ParseFromSnippetAsync("snippetId#version", scene);
mesh.material = nm;
```

For commit-able materials, export `.json` from NME and load via
`NodeMaterial.ParseFromFileAsync`. Don't depend on snippet cloud at runtime in production.

### ShaderMaterial (Custom GLSL/WGSL)

Hand-write shader code when NodeMaterial isn't sufficient:

```typescript
Effect.ShadersStore["customVertexShader"] = `precision highp float; ...`;
Effect.ShadersStore["customFragmentShader"] = `precision highp float; ...`;
const mat = new ShaderMaterial("custom", scene, "custom", {
  attributes: ["position"],
  uniforms: ["worldViewProjection"],
});
```

For WGSL on WebGPU, set `shaderLanguage: ShaderLanguage.WGSL` in options.

Compilation is async — pre-compile critical materials with
`await material.forceCompilationAsync(mesh)` before user interaction.

## Asset Formats

| Format | Use | Notes |
|---|---|---|
| **glTF / glb** | Primary 3D format | Industry-standard, PBR-aligned, smaller is `.glb` (binary) |
| **OpenUSD** (`.usd/.usda/.usdc/.usdz`) | Import 9.26+ (WASM loader; see `packages/loaders.md`) | Earlier "8.0+ USDz import" claim was wrong — pre-9.26 Babylon only *exported* USDZ |
| **FBX** | Import 9.12.1+ | Via `@babylonjs/loaders/FBX`; prefer offline conversion to glTF |
| `.babylon` | Babylon Editor round-trips | Legacy native format; not for general use |
| `.obj`, `.stl` | Simple geometry | Via `@babylonjs/loaders`, no PBR data |

### Texture Compression

Use **KTX2** (Khronos Texture Container 2) for production:

- GPU-native, no decompression cost on load
- ~30-50% smaller than PNG/JPG
- Supported on all modern GPUs
- Convert via `KhronosTextureContainer2` or external `toktx` tool

### IBL Environments

`.env` files (Babylon-specific compressed cubemap with prefiltered mips):

- Smaller than `.hdr` files (~10x reduction)
- Generate from `.hdr` via Babylon Sandbox or `EnvironmentTextureTools`
- Load: `CubeTexture.CreateFromPrefilteredData("env.env", scene)`

## Post-Processing

### DefaultRenderingPipeline (Recommended)

```typescript
const pipeline = new DefaultRenderingPipeline("default", true /*HDR*/, scene, [camera]);
pipeline.bloomEnabled = true;
pipeline.fxaaEnabled = true;
pipeline.depthOfFieldEnabled = false;
pipeline.imageProcessing.contrast = 1.1;
```

Includes: bloom, depth of field, FXAA, MSAA, chromatic aberration, grain,
sharpening, image processing (tone mapping, exposure, contrast).

### Specialized Pipelines
- `SSAO2RenderingPipeline` — screen-space ambient occlusion
- `LensRenderingPipeline` — chromatic aberration, distortion, grain
- `SSRRenderingPipeline` — screen-space reflections (expensive)

### Frame Graph (9.0+, advanced)

`FrameGraph` is a new declarative render pipeline API. Provides fine-grained
pipeline control and intelligent resource reuse. Adopt for projects with
custom multi-pass rendering needs.

## Lighting

### Standard Forward (Default)
Up to ~16 active lights per scene before performance falls off. Acceptable for
most games.

### Clustered Lighting (9.0+, opt-in)
Enable for scenes with many real-time lights (50+). Groups lights into
screen-space tiles + depth slices for sub-linear cost scaling.

```typescript
scene.useClusteredRendering = true;
```

### Volumetric Lighting (9.0+)
Compute-accelerated volumetric scattering with WebGL fallback. Add a `VolumetricLight`
for atmospheric effects (god rays, fog beams).

## Particles

| Type | Max Count | Custom JS Logic | Use When |
|---|---|---|---|
| `ParticleSystem` (CPU) | ~1000 | ✅ Full | Per-particle gameplay logic, small counts |
| `GPUParticleSystem` | 100k+ | ❌ Limited | Large counts, simple physics |

Node Particle Editor (NPE, 9.0+) provides visual graph authoring for complex
particle systems — analogous to NodeMaterial for materials.

## Floating Origin (9.0+, opt-in)

For large worlds (planets, open-world maps), 32-bit float precision breaks down
at large coordinates. Floating Origin / Large World Rendering keeps the camera
at world origin and offsets geometry per frame.

Opt-in API; default rendering unchanged.

## 9.6–9.28 Rendering Changes

| Version | Feature | API / Notes |
|---|---|---|
| 9.7 | Texture repetition breaking | `material.textureRepetitionMode = Constants.TEXTURE_REPETITION_NOISE_BLEND` (also `_HEX_TILING`, `_TILE_RANDOMIZATION`, `_VORONOI_BOMBING`; default `_NONE`); `textureRepetitionHexTilingParams`. Standard, PBR, OpenPBR. Costs 3–4 texture fetches |
| 9.12 | SSAO2 with world-space normals; `HALF_FLOAT` vertex buffer type | Additive |
| 9.12.1 | Scissor test moved to core as an opt-in engine extension | Additive |
| 9.14 | `HtmlTexture` (WICG HTML-in-Canvas) | `new HtmlTexture(name, element, options)`; ships a polyfill installer. Browser support for the underlying proposal unverified |
| 9.16 | GPU particles `emitRateControl` setter | Additive |
| 9.21.1 | **`FSR1RenderingPipeline`** (AMD FSR 1: EASU upscale + RCAS sharpen) | `new FSR1RenderingPipeline(name, scene, cameras?)`; `scaleFactor`, `sharpnessStops` (default 0.2; 0 = max sharpness), `isSupported`. Runs on WebGPU, WebGL2 (`engine.version >= 2`) and Babylon Native |
| 9.24 | White balance in image processing | `temperature` (Kelvin) / `tint`; `whiteBalanceEnabled` on `ImageProcessingPostProcess` |
| 9.26 | IBL shadows on `ShadowOnlyMaterial`; object-ID geometry textures | Additive |
| 9.26.1 | `DitheredTileFadeMaterialPlugin` | `new DitheredTileFadeMaterialPlugin(material)` |
| 9.26.2 | `MeshBlendingPostProcess` | `new MeshBlendingPostProcess(name, scene, camera, options)` |
| 9.27.1 | Normalized occlusion-query visibility API | Additive; 9.27.1 also fixed WebGPU occlusion-query begin sequencing |
| 9.23 | Shader loading state shared across material instances | Perf improvement, no API change |
| 9.x | Gaussian Splatting | Streaming + LOD (9.12.1–9.23), SPZ v4, 16-bit PLY, `KHR_gaussian_splatting` (9.16); Frame Graph supports splats/sprites/particles in geometry rendering (9.27.1) |

Frame Graph: 9.x minors continue to extend it (IBL shadows hardening 9.14, splats
9.27.1); the API remains "advanced, opt-in".

Sources: CHANGELOG (https://github.com/BabylonJS/Babylon.js/blob/master/CHANGELOG.md),
PR https://github.com/BabylonJS/Babylon.js/pull/18723 (FSR 1), `@babylonjs/core` 9.28.0 typings.

## Performance Targets

- 60 FPS desktop: 16.6ms/frame
- 90 FPS XR: 11.1ms/frame
- 30 FPS mobile: 33.3ms/frame

Measure with:
- Inspector v2 → Tools → Performance
- Chrome DevTools Performance tab
- Spector.js extension for GPU draw call inspection
- `engine.getGlInfo()` for hardware capabilities

## Common Optimizations

- `mesh.freezeWorldMatrix()` for static meshes
- `material.freeze()` for static materials
- `mesh.alwaysSelectAsActiveMesh = true` only for guaranteed-visible moving objects
- LOD levels: `mesh.addLODLevel(distance, lowPolyMesh)`
- Frustum + occlusion culling are on by default; respect them in scene layout
- Use instancing for repeated objects (foliage, props): `mesh.createInstance(name)` (`InstancedMesh`) or thin instances (`mesh.thinInstanceAdd(matrix)`) — `MultiMeshInstance3D` is a Godot node, not a Babylon.js API
- Lazy-load `@babylonjs/inspector` — never include in production bundle (~5MB gzip)

## Source Documents

- Materials overview: https://doc.babylonjs.com/features/featuresDeepDive/materials
- PBR materials: https://doc.babylonjs.com/features/featuresDeepDive/materials/using/introToPBR
- NodeMaterial: https://doc.babylonjs.com/features/featuresDeepDive/materials/node_material
- Post-processing: https://doc.babylonjs.com/features/featuresDeepDive/postProcesses
- WebGPU: https://doc.babylonjs.com/setup/support/webGPU
- Performance: https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeYourScene
