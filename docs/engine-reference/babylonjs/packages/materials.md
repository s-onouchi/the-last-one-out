# @babylonjs/materials — Package Reference

Last verified: 2026-09-25 | Package: `@babylonjs/materials` (matched to Babylon.js 9.28)

## Purpose

Extra material types beyond core `PBRMaterial`, `OpenPBRMaterial` (9.0+), and `StandardMaterial`. Includes specialized procedural materials for water, sky, fire, terrain, fur, and more. Each material is independently importable.

## License

Apache 2.0 (matches Babylon.js core).

## Install

```bash
npm install @babylonjs/materials
```

Match version to `@babylonjs/core`:

```jsonc
{
  "dependencies": {
    "@babylonjs/core": "9.28.x",
    "@babylonjs/materials": "9.28.x"
  }
}
```

## When to Use This Package

- ✅ Need water surfaces, animated sky, or specialized procedural visuals
- ✅ Need terrain blending (multiple textures based on height/slope)
- ❌ Standard PBR rendering — use core `PBRMaterial`
- ❌ Custom shader logic — use `ShaderMaterial` or `NodeMaterial` (more flexible)

For non-trivial custom looks, prefer **NodeMaterial v2** (visual graph) over baking into a fixed-function material from this package. NodeMaterial gives more iteration speed and fewer surprises.

## Available Materials

| Material | Use For | Class |
|---|---|---|
| **WaterMaterial** | Realistic water surface (waves, refraction, reflection) | `WaterMaterial` |
| **SkyMaterial** | Procedural sky (Mie/Rayleigh scattering) | `SkyMaterial` |
| **FireMaterial** | Animated fire/flame effects | `FireMaterial` |
| **LavaMaterial** | Procedural flowing lava | `LavaMaterial` |
| **TerrainMaterial** | Multi-texture terrain blending (3 textures + mixmap) | `TerrainMaterial` |
| **GradientMaterial** | Vertical gradient on geometry | `GradientMaterial` |
| **NormalMaterial** | Visualize mesh normals (debug) | `NormalMaterial` |
| **CellMaterial** | Cel/toon shading | `CellMaterial` |
| **TriPlanarMaterial** | World-space tri-planar texture mapping | `TriPlanarMaterial` |
| **FurMaterial** | Fur shells (multi-pass rendering) | `FurMaterial` |
| **MixMaterial** | Blend up to 4 textures with mixmap | `MixMaterial` |
| **ShadowOnlyMaterial** | Receives shadows but is otherwise invisible | `ShadowOnlyMaterial` |

### 9.6–9.28 Changes

- **GridMaterial** (9.10.1): multi-scale LOD, horizon fade, depth compositing, above/below colour.
- **WaterMaterial** (9.16.2): fixed WGSL shader (WebGPU) using an undefined `toLinearSpace` on `vec3`.
- **ShadowOnlyMaterial** (9.26): IBL shadows support.
- **SkyMaterial** (9.26): HDR output and cloudiness.
- The whole `@babylonjs/*` family moved to `.pure` / side-effect split modules
  in 9.14–9.15; normal side-effect imports shown below are unchanged.

Source: CHANGELOG (https://github.com/BabylonJS/Babylon.js/blob/master/CHANGELOG.md). Property names for the new GridMaterial / SkyMaterial options were not verified — check TypeDoc before use.

## Side-Effect Imports

Each material is in its own subpath — import only what you need:

```typescript
// Just water:
import { WaterMaterial } from "@babylonjs/materials/water";

// Just sky:
import { SkyMaterial } from "@babylonjs/materials/sky";

// All materials (heaviest):
import "@babylonjs/materials";
```

## Common Patterns

### WaterMaterial

```typescript
import { WaterMaterial } from "@babylonjs/materials/water";

const water = new WaterMaterial("water", scene, new Vector2(512, 512));
water.bumpTexture = new Texture("/textures/waterbump.png", scene);
water.windForce = -10;
water.waveHeight = 0.3;
water.waveLength = 0.1;
water.waterColor = new Color3(0.1, 0.3, 0.5);
water.colorBlendFactor = 0.7;
water.addToRenderList(skyMesh);
water.addToRenderList(groundMesh);
waterMesh.material = water;
```

### SkyMaterial

```typescript
import { SkyMaterial } from "@babylonjs/materials/sky";

const sky = new SkyMaterial("sky", scene);
sky.backFaceCulling = false;
sky.luminance = 1.0;
sky.turbidity = 10;
sky.rayleigh = 2;
sky.mieCoefficient = 0.005;
sky.useSunPosition = true;
sky.sunPosition = new Vector3(0, 100, 0);

const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
skybox.material = sky;
```

### TerrainMaterial

```typescript
import { TerrainMaterial } from "@babylonjs/materials/terrain";

const terrain = new TerrainMaterial("terrain", scene);
terrain.mixTexture = new Texture("/textures/mixmap.png", scene);
terrain.diffuseTexture1 = new Texture("/textures/grass.jpg", scene);
terrain.diffuseTexture2 = new Texture("/textures/rock.jpg", scene);
terrain.diffuseTexture3 = new Texture("/textures/sand.jpg", scene);
terrain.bumpTexture1 = new Texture("/textures/grass-normal.png", scene);
groundMesh.material = terrain;
```

## Performance

- WaterMaterial: each `addToRenderList` adds a render pass (refraction). Limit reflected meshes.
- SkyMaterial: cheap (single pass on a skybox)
- FireMaterial / LavaMaterial: animated, ~1-2ms GPU on mid-range desktop
- FurMaterial: multi-pass, **expensive** — use only for hero objects, never crowds
- TerrainMaterial: 4 texture samples per pixel + mix → moderate. Cap at one terrain plane.

## Common Pitfalls

- Importing `@babylonjs/materials` (barrel) — ships every material, even unused ones
- WaterMaterial without adding any meshes to render list (mirror appears black)
- TerrainMaterial mixmap with wrong color channels (R/G/B = textures 1/2/3)
- FurMaterial on > 100 meshes (frame drops)
- Using these materials when NodeMaterial would be more flexible (over-baking visual identity)

## Source Documents

- Materials Library overview: https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary
- WaterMaterial: https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/waterMat
- SkyMaterial: https://doc.babylonjs.com/toolsAndResources/assetLibraries/materialsLibrary/skyMat
- @babylonjs/materials npm: https://www.npmjs.com/package/@babylonjs/materials
