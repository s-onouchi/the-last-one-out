/**
 * Data-driven tuning values for the first-person player controller.
 *
 * Implements Story 001 (production/epics/the-last-one-out/story-001-first-person-controls.md):
 * "移動速度・視点感度・調べられる距離は src/data/ の設定値から読み込み、コードに直接書かない".
 *
 * All gameplay-facing numeric constants for player movement, look, collision,
 * and interaction live here so designers can retune feel without touching
 * controller/input code. Keep this file free of Babylon.js or DOM imports.
 */
export interface PlayerConfig {
  /** Horizontal movement speed, in meters per second. */
  readonly moveSpeed: number;
  /** Mouse-look sensitivity, in radians of rotation per pixel of mouse movement. */
  readonly mouseLookSensitivity: number;
  /** Touch drag-look sensitivity, in radians of rotation per pixel of drag movement. */
  readonly touchLookSensitivity: number;
  /** Babylon VirtualJoystick's internal sensibility (ratio between physical drag distance and reported axis value). */
  readonly touchJoystickSensibility: number;
  /** Maximum distance, in meters, at which an interactable can be targeted/interacted with. */
  readonly interactDistance: number;
  /** Camera height above the player collider's feet, in meters. */
  readonly eyeHeight: number;
  /**
   * Camera near clip distance, in meters. Must be well below playerRadius:
   * Babylon's default (1 m) clips away a wall the player is standing against.
   */
  readonly cameraNearClip: number;
  /** Player collision capsule horizontal radius, in meters. */
  readonly playerRadius: number;
  /** Player collision capsule height, in meters. */
  readonly playerHeight: number;
  /**
   * Constant downward speed applied every frame to keep the player resting on
   * the floor, in meters per second. This is not real gravity/acceleration —
   * no jump or fall is in scope for this story, it exists solely so floor
   * collision is actually exercised every frame rather than merely assumed.
   */
  readonly floorStickSpeed: number;
  /** Maximum camera pitch away from level, in degrees, in either direction. */
  readonly pitchClampDegrees: number;
  /** Maximum pointer movement, in pixels, for a touch gesture to still count as a tap rather than a drag. */
  readonly touchTapMaxMovementPx: number;
  /** Maximum duration, in milliseconds, for a touch gesture to still count as a tap rather than a hold. */
  readonly touchTapMaxDurationMs: number;
}

export const PLAYER_CONFIG: PlayerConfig = {
  moveSpeed: 2.0,
  mouseLookSensitivity: 0.0025,
  touchLookSensitivity: 0.005,
  touchJoystickSensibility: 25,
  interactDistance: 2.5,
  eyeHeight: 1.7,
  cameraNearClip: 0.05,
  playerRadius: 0.4,
  playerHeight: 1.8,
  floorStickSpeed: 2.0,
  pitchClampDegrees: 85,
  touchTapMaxMovementPx: 12,
  touchTapMaxDurationMs: 250,
};
