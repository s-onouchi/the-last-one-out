# Babylon.js Physics — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

## Default: Havok (`@babylonjs/havok`)

Havok is the recommended physics plugin for Babylon.js since 6.0 and remains the
default for 9.x.

- **License:** MIT (web build) — commercial use OK, no royalties
- **Maintenance:** Active, by Microsoft (Havok Group)
- **Quality:** Industry-grade rigid body simulation, originally a AAA engine
- **Babylon Integration:** First-party plugin, tracks Babylon.js releases

```typescript
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";

const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);
```

Source: https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin

## ⚠️ iOS < 16.4 Incompatibility

Havok ships as a WebAssembly module that **requires WebAssembly SIMD support**.

- **iOS Safari < 16.4:** No WebAssembly SIMD → Havok loads but throws on init
- **iOS Safari ≥ 16.4 (released March 2023):** WebAssembly SIMD supported — works
- **macOS Safari, Chrome, Edge, Firefox (modern):** All support WASM SIMD

If your project targets old iPhones (iPhone 6s/SE 1st gen running iOS 15 or
earlier), Havok will not work. Forum bug report:
https://forum.babylonjs.com/t/webassembly-error-havok-project-in-old-ios-device-iphone-6s/40213

### Mitigation

For projects requiring old-iOS support, use **Cannon-es** (legacy fallback):

```typescript
import { CannonJSPlugin } from "@babylonjs/core/Physics/v1/Plugins/cannonJSPlugin";
import * as CANNON from "cannon-es";

window.CANNON = CANNON;
scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin());
```

This decision must be recorded as an Architecture Decision Record. Cannon-es is
less feature-complete and not actively developed.

## Plugin Comparison

| Plugin | Status | Best For | Limitations |
|---|---|---|---|
| **HavokPlugin** | Recommended (default) | All modern projects | iOS < 16.4 |
| CannonJSPlugin | Legacy compatibility | Old browser/iOS support | Limited features, no longer first-class |
| AmmoJSPlugin | Legacy | Bullet feature parity | Heavy, mostly unmaintained |
| OimoJSPlugin | Legacy | Lightweight option | Very limited |

## Physics V2 vs V1

Babylon.js has two physics API generations:

- **Physics V2** (recommended) — `@babylonjs/core/Physics/v2/...`
- **Physics V1** (legacy) — `@babylonjs/core/Physics/v1/...`

Havok plugin is V2 only. Cannon/Ammo/Oimo plugins are V1. For new projects:
**use Havok + V2 API** unless old-iOS forces V1+Cannon.

## Common Patterns

### Static Ground

```typescript
const groundShape = new PhysicsShapeBox(
  Vector3.Zero(), Quaternion.Identity(), new Vector3(50, 0.1, 50), scene
);
const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 }, scene);
new PhysicsBody(ground, PhysicsMotionType.STATIC, false, scene).shape = groundShape;
```

### Dynamic Sphere

```typescript
const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
sphere.position.y = 5;
const body = new PhysicsBody(sphere, PhysicsMotionType.DYNAMIC, false, scene);
body.shape = new PhysicsShapeSphere(Vector3.Zero(), 0.5, scene);
body.setMassProperties({ mass: 1 });
```

### Trigger Volumes

Use `body.setCollisionCallbackEnabled(true)` and listen via
`scene.onBeforePhysicsObservable` — V2 has no built-in trigger event but can be
emulated through collision callbacks.

## Performance Notes

- Havok runs in a WebAssembly worker — async to JS, no main-thread block
- Physics step rate locked to 60 Hz by default; configurable via plugin options
- For large scenes (>1000 dynamic bodies), consider sleeping inactive bodies:
  `body.disablePreStep = true` + manual wake on interaction
- Continuous collision detection (CCD) is opt-in per body; expensive but prevents tunneling

## Source Documents

- Havok plugin: https://doc.babylonjs.com/features/featuresDeepDive/physics/havokPlugin
- Physics V2 overview: https://doc.babylonjs.com/features/featuresDeepDive/physics
- @babylonjs/havok npm: https://www.npmjs.com/package/@babylonjs/havok
- Havok GitHub: https://github.com/BabylonJS/havok

## Project Default Decision

This project defaults to Havok V2. Switching to Cannon-es V1 (for old-iOS support)
or any other plugin requires an ADR. See `docs/architecture/` and `/architecture-decision`.
