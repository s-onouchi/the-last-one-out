import { VirtualJoystick } from "@babylonjs/core/Misc/virtualJoystick";

import type { PlayerConfig } from "../data/player-config";
import type { InputAdapter, PlayerInputFrame } from "./input-frame";

interface TouchGestureStart {
  readonly x: number;
  readonly y: number;
  readonly timeMs: number;
}

/**
 * Touch input adapter: left-half virtual joystick for movement (Babylon's
 * built-in VirtualJoystick — self-rendering, placeholder visuals per Story
 * 001's Implementation Notes: "タッチUIの見た目は仮でよい（006/007で整える）"),
 * right-half drag for look, and a tap (low movement + short duration, either
 * half) for interact.
 *
 * VirtualJoystick's overlay canvas covers the full screen but never calls
 * stopPropagation on the pointer events it handles, so they still bubble to
 * `document` — this adapter's own look/tap listeners are attached there
 * rather than on the WebGL render canvas, per the coordinator's guidance.
 */
export class TouchInputAdapter implements InputAdapter {
  private readonly _config: PlayerConfig;
  private _joystick: VirtualJoystick | null = null;

  private _lookTouchId: number | null = null;
  private _lastLookX = 0;
  private _lastLookY = 0;
  private _accumulatedLookDeltaX = 0;
  private _accumulatedLookDeltaY = 0;

  private readonly _gestureStarts = new Map<number, TouchGestureStart>();
  private _interactPending = false;

  private readonly _onPointerDown = (event: PointerEvent): void => {
    this._gestureStarts.set(event.pointerId, { x: event.clientX, y: event.clientY, timeMs: performance.now() });

    const isRightHalf = event.clientX > window.innerWidth / 2;
    if (isRightHalf && this._lookTouchId === null) {
      this._lookTouchId = event.pointerId;
      this._lastLookX = event.clientX;
      this._lastLookY = event.clientY;
    }
  };

  private readonly _onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this._lookTouchId) {
      return;
    }
    this._accumulatedLookDeltaX += (event.clientX - this._lastLookX) * this._config.touchLookSensitivity;
    this._accumulatedLookDeltaY += -(event.clientY - this._lastLookY) * this._config.touchLookSensitivity;
    this._lastLookX = event.clientX;
    this._lastLookY = event.clientY;
  };

  private readonly _onPointerUp = (event: PointerEvent): void => {
    const start = this._gestureStarts.get(event.pointerId);
    this._gestureStarts.delete(event.pointerId);
    if (event.pointerId === this._lookTouchId) {
      this._lookTouchId = null;
    }

    if (!start) {
      return;
    }
    const movedPx = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    const durationMs = performance.now() - start.timeMs;
    if (movedPx <= this._config.touchTapMaxMovementPx && durationMs <= this._config.touchTapMaxDurationMs) {
      this._interactPending = true;
    }
  };

  public constructor(config: PlayerConfig) {
    this._config = config;
  }

  public attach(): void {
    this._joystick = new VirtualJoystick(true, { limitToContainer: true });
    this._joystick.setJoystickSensibility(this._config.touchJoystickSensibility);

    document.addEventListener("pointerdown", this._onPointerDown);
    document.addEventListener("pointermove", this._onPointerMove);
    document.addEventListener("pointerup", this._onPointerUp);
    document.addEventListener("pointercancel", this._onPointerUp);
  }

  public detach(): void {
    document.removeEventListener("pointerdown", this._onPointerDown);
    document.removeEventListener("pointermove", this._onPointerMove);
    document.removeEventListener("pointerup", this._onPointerUp);
    document.removeEventListener("pointercancel", this._onPointerUp);
    this._joystick?.releaseCanvas();
    this._joystick = null;
    this._gestureStarts.clear();
  }

  public pollFrame(): PlayerInputFrame {
    const joystick = this._joystick;
    const moveForward = joystick !== null && joystick.pressed ? joystick.deltaPosition.y : 0;
    const moveRight = joystick !== null && joystick.pressed ? joystick.deltaPosition.x : 0;

    const frame: PlayerInputFrame = {
      moveForward,
      moveRight,
      lookDeltaX: this._accumulatedLookDeltaX,
      lookDeltaY: this._accumulatedLookDeltaY,
      interactPressed: this._interactPending,
    };

    this._accumulatedLookDeltaX = 0;
    this._accumulatedLookDeltaY = 0;
    this._interactPending = false;

    return frame;
  }
}
