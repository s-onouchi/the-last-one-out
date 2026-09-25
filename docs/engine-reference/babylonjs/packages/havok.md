# @babylonjs/havok — Package Reference

Last verified: 2026-05-03 | Package: `@babylonjs/havok` (matched to Babylon.js 9.5)

## Purpose

Havok Physics WebAssembly runtime. Provides the Havok backend for Babylon.js's
Physics V2 API. **Default physics for new projects** — see `modules/physics.md`.

## License

MIT (web build). Free for commercial use, no royalties. Owned by Microsoft (Havok Group).

## Install

```bash
npm install @babylonjs/havok
```

Pin the version to match `@babylonjs/core`:

```jsonc
{
  "dependencies": {
    "@babylonjs/core": "9.5.x",
    "@babylonjs/havok": "1.x"   // Havok versions independently of core
  }
}
```

## Initialization

```typescript
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";

const havokInstance = await HavokPhysics();
const plugin = new HavokPlugin(true /*useDeltaForWorldStep*/, havokInstance);

scene.enablePhysics(new Vector3(0, -9.81, 0), plugin);
```

`HavokPhysics()` is async — returns a WASM module. Await it before scene physics enable.

## Bundle Size

The Havok WASM binary is approximately **4 MB**. For projects without physics, do not include it. Code-split if physics is only used in some scenes:

```typescript
// Lazy-load only when needed
const HavokPhysics = (await import("@babylonjs/havok")).default;
```

Vite/webpack will create a separate chunk for the dynamic import.

## ⚠️ iOS < 16.4 Incompatibility

Havok requires WebAssembly SIMD support. iOS Safari < 16.4 (released March 2023) does not support WASM SIMD — Havok will fail to initialize on those devices.

**Mitigations:**
1. Detect at runtime: `typeof WebAssembly.SIMD === "undefined"` or feature-detect via test compile
2. Fall back to Cannon-es (V1 physics API) on unsupported devices — large code path divergence
3. Drop iOS < 16.4 from supported targets (consult product/business)

This decision must be recorded as an ADR if the project's platform matrix includes old iOS.

## Common Patterns

### Static Body
```typescript
const groundShape = new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), new Vector3(50, 0.1, 50), scene);
const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
const body = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, scene);
body.shape = groundShape;
```

### Dynamic Body
```typescript
const body = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
body.shape = new PhysicsShapeSphere(Vector3.Zero(), 0.5, scene);
body.setMassProperties({ mass: 1.0 });
```

### Collision Callbacks
```typescript
body.setCollisionCallbackEnabled(true);
body.getCollisionObservable().add((collisionEvent) => {
  if (collisionEvent.type === "COLLISION_STARTED") {
    /* on hit */
  }
});
```

## Performance

- Havok runs in the WASM "worker" — async to JS, no main-thread block
- Physics step rate locked to 60 Hz by default; configurable via plugin options
- For > 1000 dynamic bodies, sleep inactive: `body.disablePreStep = true` + manual wake on interaction
- Continuous collision detection (CCD) is opt-in per body; expensive but prevents tunneling

## Source Documents

- @babylonjs/havok npm: https://www.npmjs.com/package/@babylonjs/havok
- Havok plugin docs: https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin
- Havok GitHub: https://github.com/BabylonJS/havok
- Physics V2 overview: https://doc.babylonjs.com/features/featuresDeepDive/physics
