import type { PlayerConfig } from "../data/player-config";
import type { InputAdapter, PlayerInputFrame } from "./input-frame";

/**
 * PC input adapter: WASD movement, pointer-lock mouse-look, E key / left
 * click to interact. WASD and E work with or without pointer lock; mouse-look
 * and click-to-interact require it (the first click acquires the lock).
 *
 * Implements Story 001's PC acceptance criteria. Uses only the raw browser
 * Pointer Lock API (canvas.requestPointerLock(), document.pointerLockElement,
 * the "pointerlockchange" event) — no Babylon camera input is ever attached
 * (see PlayerController), so there is nothing for pointer lock to conflict
 * with. Esc releases the lock natively; this adapter only observes the
 * resulting state change, it never calls document.exitPointerLock() itself.
 */
export class PcInputAdapter implements InputAdapter {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _config: PlayerConfig;

  private readonly _pressedKeys = new Set<string>();
  private _accumulatedLookDeltaX = 0;
  private _accumulatedLookDeltaY = 0;
  private _interactPending = false;
  private _isPointerLocked = false;

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    this._pressedKeys.add(event.code);
    if (event.code === "KeyE" && !event.repeat) {
      this._interactPending = true;
    }
  };

  private readonly _onKeyUp = (event: KeyboardEvent): void => {
    this._pressedKeys.delete(event.code);
  };

  private readonly _onPointerMove = (event: PointerEvent): void => {
    if (!this._isPointerLocked) {
      return;
    }
    this._accumulatedLookDeltaX += event.movementX * this._config.mouseLookSensitivity;
    // Screen Y increases downward; flip so moving the mouse up looks up.
    this._accumulatedLookDeltaY += -event.movementY * this._config.mouseLookSensitivity;
  };

  private readonly _onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    if (this._isPointerLocked) {
      this._interactPending = true;
    } else {
      // First click acquires pointer lock; it is deliberately not also treated as an interact.
      this._canvas.requestPointerLock();
    }
  };

  private readonly _onPointerLockChange = (): void => {
    this._isPointerLocked = document.pointerLockElement === this._canvas;
  };

  public constructor(canvas: HTMLCanvasElement, config: PlayerConfig) {
    this._canvas = canvas;
    this._config = config;
  }

  public attach(): void {
    // Pointer events, not mouse events: Babylon's scene input manager calls
    // preventDefault() on canvas pointerdown (scene.preventDefaultOnPointerDown),
    // which suppresses the browser's compatibility mousedown — a mousedown
    // listener here never fired, so pointer lock was never requested.
    this._canvas.addEventListener("pointerdown", this._onPointerDown);
    this._canvas.addEventListener("pointermove", this._onPointerMove);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
    document.addEventListener("pointerlockchange", this._onPointerLockChange);
  }

  public detach(): void {
    this._canvas.removeEventListener("pointerdown", this._onPointerDown);
    this._canvas.removeEventListener("pointermove", this._onPointerMove);
    document.removeEventListener("keydown", this._onKeyDown);
    document.removeEventListener("keyup", this._onKeyUp);
    document.removeEventListener("pointerlockchange", this._onPointerLockChange);
    this._pressedKeys.clear();
  }

  public pollFrame(): PlayerInputFrame {
    // Keyboard movement does not depend on pointer lock — only mouse-look does —
    // so the player can still walk if the browser refuses or drops the lock.
    const forward = this._pressedKeys.has("KeyW") ? 1 : 0;
    const back = this._pressedKeys.has("KeyS") ? 1 : 0;
    const right = this._pressedKeys.has("KeyD") ? 1 : 0;
    const left = this._pressedKeys.has("KeyA") ? 1 : 0;

    const frame: PlayerInputFrame = {
      moveForward: forward - back,
      moveRight: right - left,
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
