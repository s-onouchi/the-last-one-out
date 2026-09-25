# Babylon.js Animation — Quick Reference

Last verified: 2026-09-25 | Engine: Babylon.js 9.28

## Animation Types

| Type | Use For | Class |
|---|---|---|
| Property animation | Scalar / vector tweening on any property | `Animation` |
| Animation group | Composite playback of multiple `Animation` instances | `AnimationGroup` |
| Skeletal animation | Bone-driven character rigs (from glTF) | `Skeleton` + `AnimationGroup` |
| Morph targets | Blend shapes (face rigs, deformations) | `MorphTargetManager` |

## glTF Imported Animations

When importing a glTF/glb file, animations come back as `AnimationGroup` instances:

```typescript
// Module-level loader function (the SceneLoader class is @deprecated — see deprecated-apis.md)
import { ImportMeshAsync } from "@babylonjs/core/Loading/sceneLoader";

const result = await ImportMeshAsync("/models/character.glb", scene);
const idleGroup = result.animationGroups.find(g => g.name === "Idle");
idleGroup?.start(true /*loop*/);
```

- `result.animationGroups` is the canonical entry point — never construct from raw curves
- Group names match the source DCC tool's clip names
- Default behavior (glTF): the loader's `animationStartMode` defaults to `GLTFLoaderAnimationStartMode.FIRST` — the **first** animation group auto-plays on import. Pass `pluginOptions: { gltf: { animationStartMode: GLTFLoaderAnimationStartMode.NONE } }` to keep all stopped, then `start()` explicitly (verified in `@babylonjs/loaders` 9.28.0 `glTF/glTFFileLoader.pure.js`; corrects an earlier "stopped on import" claim)

## Animation Group Control

```typescript
group.play(true /*loop*/);
group.pause();
group.stop();
group.reset();
group.speedRatio = 0.5;       // half speed
group.weight = 0.7;            // for blending
group.from / group.to;         // frame range
```

For crossfade between groups:

```typescript
AnimationGroup.MakeAnimationAdditive(overlayGroup);
runGroup.weight = 1 - blend;
sprintGroup.weight = blend;
runGroup.start(true);
sprintGroup.start(true);
```

## Animation Retargeting (9.0+)

Built-in retargeting for applying animations from one skeleton to a different
(but compatible) skeleton.

> **CORRECTION (2026-09-25):** an earlier version of this file showed
> `AnimationRetargeting.RetargetAnimations(...)`. No such class exists in the
> `@babylonjs/core` 9.5.0 or 9.28.0 typings. The real API is `AnimatorAvatar`:

```typescript
import { AnimatorAvatar } from "@babylonjs/core/Animations/animatorAvatar";

const avatar = new AnimatorAvatar("hero", heroRootNode);
const retargeted = avatar.retargetAnimationGroup(sourceAnimGroup, {
  // optional IRetargetOptions, e.g.:
  mapNodeNames: new Map([["mixamorig:Hips", "Hips"]]),
});
retargeted.start(true);
```

Retargeting matches by target (TransformNode / MorphTarget) names; unmatched
targeted animations are dropped. The source group must animate transform nodes
(typical for glTF), not bones. Other options include `rootNodeName`,
`groundReferenceNodeName`, `fixGroundReference`, `groundReferenceVerticalAxis`.
9.7 fixed `retargetAnimationGroup` clobbering active animations.

Use case: ship one character animation library, apply to many character meshes with similar bone structure. Significantly reduces animation asset count.

Source: `@babylonjs/core` 9.28.0 `Animations/animatorAvatar.d.ts`

## Root Motion (9.28+)

`RootMotionClip` analyses an `AnimationGroup` once (without modifying it) and
produces an in-place copy; `RootMotionController` then moves the character by
the extracted motion during playback.

```typescript
import { RootMotionClip, RootMotionController } from "@babylonjs/core/Animations/rootMotion";

const walk = new RootMotionClip(walkGroup /*, IRootMotionClipOptions */);
const controller = new RootMotionController(walk.characterNode, [walk]);
walk.animationGroup.start(true); // play the in-place copy; the character travels
```

- `IRootMotionClipOptions`: `rootNode`, `characterNode`, `extractRotation`,
  `extractLateralMotion`, `upAxis`, `samplesPerSecond`, `minimumTravel`,
  `minimumTurn`, `directionSnapAngle`, `cloneAnimations`, …
- `RootMotionController.applyToCharacter` (default `true`); set `false` to read
  `deltaPosition` / `deltaRotation` (or `onRootMotionObservable`) and drive a
  `PhysicsCharacterController` yourself.
- `addClip()`, `removeClip()`, `reset()`, `dispose()`.

Sources: PR https://github.com/BabylonJS/Babylon.js/pull/18908; `@babylonjs/core` 9.28.0 `Animations/rootMotion.d.ts`

## Property Animations (Procedural)

For non-skeletal property tweening, use `Animation.CreateAndStartAnimation`:

```typescript
Animation.CreateAndStartAnimation(
  "fadeIn",
  mesh,
  "visibility",
  60 /*fps*/,
  30 /*frames*/,
  0.0,
  1.0,
  Animation.ANIMATIONLOOPMODE_CONSTANT
);
```

Easing: pass an `EasingFunction` (e.g., `new CubicEase()`) as the optional 9th argument.

## Morph Targets

For face rigs and deformations:

```typescript
const morphManager = mesh.morphTargetManager;
morphManager.getTarget(0).influence = 0.5; // 0..1 blend
```

glTF blend shapes import directly into `MorphTargetManager`. Combine with skeletal animation for facial rigs over body animation.

## Performance

- `AnimationGroup.metadata.frameRate` is for source DCC info only — runtime always interpolates
- Disable inactive groups: `group.stop()` after fade-out (don't leave running with weight 0)
- Skeletal: bone count matters; aim < 60 bones per character for mobile/XR
- `mesh.alwaysSelectAsActiveMesh = false` (default) skips animation update when off-camera

## Common Pitfalls

- Forgetting to `start()` after import (silent — character stays in T-pose)
- Mutating animation curves at runtime (use `enableBlending` or `weight` instead)
- Multiple groups with weight=1 simultaneously (last-write-wins, not blended)
- Retargeting between skeletons with different bone counts (will fail or produce garbage)

## Source Documents

- Animations: https://doc.babylonjs.com/features/featuresDeepDive/animation
- Animation Groups: https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
- Animation Retargeting (9.0+): https://doc.babylonjs.com/features/featuresDeepDive/animation/animationRetargeting
- Morph Targets: https://doc.babylonjs.com/features/featuresDeepDive/animation/advanced_animations#morph-targets
