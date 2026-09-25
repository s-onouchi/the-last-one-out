# Babylon.js Animation — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

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
const result = await SceneLoader.ImportMeshAsync("", "/models/", "character.glb", scene);
const idleGroup = result.animationGroups.find(g => g.name === "Idle");
idleGroup?.start(true /*loop*/);
```

- `result.animationGroups` is the canonical entry point — never construct from raw curves
- Group names match the source DCC tool's clip names
- Default behavior: animations are stopped on import; explicitly `start()` to play

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

New in 9.0: built-in retargeting API for applying animations from one skeleton to a different (but compatible) skeleton.

```typescript
const retargeted = AnimationRetargeting.RetargetAnimations(
  sourceAnimGroup,
  sourceSkeleton,
  targetSkeleton,
  scene
);
```

Use case: ship one character animation library, apply to many character meshes with similar bone structure. Significantly reduces animation asset count.

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
