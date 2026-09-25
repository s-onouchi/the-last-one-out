# Babylon.js WebXR — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

WebXR is a Babylon.js core strength. This document captures the current state
of XR support, device targets, and feature availability.

## Session Modes

| Mode | What | Where It Works |
|---|---|---|
| `immersive-vr` | Fully immersive VR | Quest 3 browser, Vision Pro Safari, PCVR via Chromium |
| `immersive-ar` | Passthrough AR | Quest 3, AR-capable Android phones — **NOT Vision Pro Safari** |
| `inline` | Embedded in page | Rare — typically use plain Babylon.js scene without WebXR |

## Default Experience (Recommended Entry)

```typescript
const xrHelper = await scene.createDefaultXRExperienceAsync({
  floorMeshes: [ground],
  uiOptions: { sessionMode: "immersive-vr" },
  optionalFeatures: true,
});
```

Returns `WebXRDefaultExperience` with: session manager, default camera, default
input handling, teleportation, and a UI button to enter XR.

For full control, use `WebXRSessionManager` directly.

## Reference Spaces

| Type | Origin | Use For |
|---|---|---|
| `local` | Headset position at session start | Seated experiences |
| `local-floor` | Floor at session start (Y=0) | **Default for VR** |
| `bounded-floor` | Floor + bounded polygon | Room-scale with guardian |
| `unbounded` | World-scale | Outdoor AR; **NOT Vision Pro** |

```typescript
await xrHelper.baseExperience.setReferenceSpaceAsync("local-floor");
```

## Input Sources

### Motion Controllers
- `xrHelper.input.onControllerAddedObservable.add(controller => { ... })`
- Controller mesh loads asynchronously — wait for `onMotionControllerInitObservable`
- Component layout differs per device — query by ID:
  `motionController.getComponent("xr-standard-trigger")`

### Hand Tracking
Enable as optional feature:

```typescript
const handFeature = featuresManager.enableFeature(
  WebXRFeatureName.HAND_TRACKING,
  "stable",
  { xrInput, jointMeshes: { disableDefaultMeshes: false } }
);
```

- 25 joints per hand exposed via `WebXRHand.getJointMesh(joint: WebXRHandJoint)`
- Common gestures: pinch (thumb tip + index tip distance), grab (curl detection)
- Quest needs hand tracking enabled in system settings

### Eye Tracking (Vision Pro)
Vision Pro reports gaze through standard input source mapping. Treat as a
transient pointer — no persistent ray API. Privacy: never log raw gaze data
without explicit consent.

## AR Features (Quest, Android)

### Hit Testing
```typescript
const hitTest = featuresManager.enableFeature(WebXRFeatureName.HIT_TEST, "latest");
hitTest.onHitTestResultObservable.add(results => {
  if (results[0]) results[0].transformationMatrix.decompose(undefined, undefined, position);
});
```

### Plane Detection
```typescript
const planes = featuresManager.enableFeature(WebXRFeatureName.PLANE_DETECTION, "latest");
planes.onPlaneAddedObservable.add(plane => { /* ... */ });
```

Plane polygons can change frame to frame — don't cache.

### Depth Sensing (8.0+)
```typescript
const depth = featuresManager.enableFeature(
  WebXRFeatureName.DEPTH_SENSING,
  "latest",
  {
    dataFormatPreference: ["luminance-alpha"],
    usagePreference: ["cpu-optimized"],
  }
);
```

- `cpu-optimized` — readable in JS, slower
- `gpu-optimized` — shader sampling only, faster
- Use for occlusion of virtual objects behind real surfaces

### Anchors
- `WebXRFeatureName.ANCHOR_SYSTEM`
- Anchors compensate for tracking drift; always anchor objects placed via hit-test

### Light Estimation
- `WebXRFeatureName.LIGHT_ESTIMATION`
- Provides spherical harmonics for matching virtual lighting to real environment

## Platform Behavior Matrix

| Feature | Quest 3 (Meta Browser) | Vision Pro (Safari) | PCVR (Chromium) |
|---|---|---|---|
| immersive-vr | ✅ | ✅ | ✅ |
| immersive-ar | ✅ | ❌ (Apple gating) | N/A |
| Hand Tracking | ✅ | ✅ | Hardware-dependent |
| Eye Tracking | ❌ | ✅ (gaze pointer) | ❌ |
| Hit Testing | ✅ | ❌ | N/A |
| Plane Detection | ✅ | ❌ | N/A |
| Depth Sensing | ✅ | ❌ | N/A |
| Anchors | ✅ | ❌ | ❌ |
| Foveated Rendering | ✅ | ✅ (auto) | Hardware-dependent |
| Multiview | ✅ | ✅ | ✅ |

## Performance Budget

- **Quest 3:** 90 FPS hard target, 11.1ms total. Stereo render = effectively
  5.5ms per eye. Drop below = motion sickness.
- **Vision Pro:** 90 FPS, very high resolution. Foveated rendering reduces
  effective shading area significantly.
- **PCVR:** Varies (90/120/144 Hz). Design for 90 FPS minimum.

### Optimization Levers
- `xrCamera.setFoveation(level)` (0-3) — reduces fragment cost in periphery
- `engine.setHardwareScalingLevel(1.5)` — 0.66x render + upscale
- Multiview is enabled by default in Babylon.js when supported (single draw, two views)
- Pre-compile materials before session start (`material.forceCompilation`)
- Avoid per-frame allocations — GC stalls cause perceptible jank

## Common Pitfalls

- Calling `engine.runRenderLoop` while in XR session (XR takes over the loop)
- Requesting features after session start (silent no-op)
- Hardcoding `local-floor` and breaking on devices that only support `local`
- Forgetting `xrHelper.dispose()` on scene teardown — locks the headset
- Using `setTimeout` inside XR — frame timing diverges
- Loading large assets after session start (presence break)
- Not testing on actual hardware — emulators miss tracking, latency, ergonomic bugs

## Source Documents

- WebXR overview: https://doc.babylonjs.com/features/featuresDeepDive/webXR
- Default XR Experience: https://doc.babylonjs.com/features/featuresDeepDive/webXR/webXRExperienceHelpers
- WebXR Features Manager: https://doc.babylonjs.com/features/featuresDeepDive/webXR/WebXRSelectedFeatures
- Hand Tracking: https://doc.babylonjs.com/features/featuresDeepDive/webXR/WebXRSelectedFeatures#hand-tracking
- Depth Sensing (8.0+): https://doc.babylonjs.com/features/featuresDeepDive/webXR/WebXRSelectedFeatures#depth-sensing
