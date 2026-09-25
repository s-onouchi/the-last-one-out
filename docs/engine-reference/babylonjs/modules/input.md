# Babylon.js Input — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

Babylon.js handles input via `Scene` observables, `InputManager`, and the
WebXR input subsystem for controllers / hands.

## Pointer Events (Mouse + Touch + Pen)

```typescript
scene.onPointerObservable.add((pointerInfo) => {
  switch (pointerInfo.type) {
    case PointerEventTypes.POINTERDOWN: /* click/tap start */ break;
    case PointerEventTypes.POINTERUP:   /* click/tap end */ break;
    case PointerEventTypes.POINTERMOVE: /* drag/hover */ break;
    case PointerEventTypes.POINTERWHEEL: /* zoom */ break;
  }
});
```

Pointer events are unified — same code handles mouse, touch, and pen. Use `pointerInfo.event.pointerType` to distinguish if needed.

## Mesh Picking

```typescript
scene.onPointerDown = (event, pickResult) => {
  if (pickResult.hit) {
    console.log("Hit mesh:", pickResult.pickedMesh?.name);
  }
};
```

For picking-only-some meshes: set `mesh.isPickable = false` on background/decoration meshes (huge performance win).

## Keyboard

```typescript
scene.onKeyboardObservable.add((kbInfo) => {
  if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
    if (kbInfo.event.key === "w") player.moveForward();
  }
});
```

For action mapping (recommended pattern), build a small lookup layer above raw key codes — never hardcode keys throughout gameplay code:

```typescript
const actions = {
  forward: ["w", "ArrowUp"],
  jump: [" "],
  // ...
};
```

This makes rebinding (accessibility requirement) a config change rather than code change.

## Gamepad

```typescript
const gamepadManager = new GamepadManager();
gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
  gamepad.onButtonDownObservable.add((button) => { /* ... */ });
  gamepad.onleftstickchanged((stick) => { /* stick.x, stick.y */ });
});
```

Babylon.js auto-detects Xbox, PlayStation, generic HID gamepads. Treat button IDs as conventions — verify against actual hardware (Xbox A may map differently than PS X depending on browser).

## Touch (Mobile)

Touch is unified into pointer events (above), so dedicated touch code is rarely needed. For multi-touch gestures (pinch, rotate), use `pointerInfo.event.pointerId` to track multiple simultaneous touches.

For virtual joystick UI on mobile, use `VirtualJoystick` from `@babylonjs/core`:

```typescript
const leftStick = new VirtualJoystick(true /*left side*/);
const rightStick = new VirtualJoystick(false);
// Read each frame:
const leftDelta = leftStick.deltaPosition;
```

## XR Input

For WebXR controllers and hand tracking, use the WebXR-specific input pipeline. See [modules/webxr.md](webxr.md).

Quick summary:
- `xrHelper.input.onControllerAddedObservable` for motion controllers
- `WebXRFeatureName.HAND_TRACKING` feature for hand input
- Standard `Observable` patterns; no separate event system

## Input in Babylon GUI

Babylon GUI controls expose pointer observables on each control:
```typescript
button.onPointerClickObservable.add(() => { /* ... */ });
button.onPointerEnterObservable.add(() => { /* hover */ });
```

GUI input is automatic — pointer events route to the topmost control under the cursor without manual setup.

## Common Pitfalls

- Hardcoding key codes throughout gameplay (impossible to rebind for accessibility)
- Forgetting `mesh.isPickable = false` on decoration (every ray cast tests every pickable mesh)
- Browser focus loss: pointer/keyboard observables stop firing if canvas loses focus; handle `blur` event to release held inputs
- Touch + mouse double-fire on hybrid devices: handle in pointer event, not separate touch listener
- Gamepad: chrome and firefox differ in button index for some controllers — test on both
- VirtualJoystick on mobile when device is in landscape with notch: position via safe-area-inset

## Source Documents

- Pointers and picking: https://doc.babylonjs.com/features/featuresDeepDive/scene/interactWithScenes
- Cameras and input: https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
- VirtualJoystick: https://doc.babylonjs.com/features/featuresDeepDive/input/virtualJoysticks
- Gamepad: https://doc.babylonjs.com/features/featuresDeepDive/input/gamepads
