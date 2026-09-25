import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Pure look-angle math for the first-person controller — no Scene, Engine, or
 * DOM dependency, deterministic given its inputs, unit-testable in isolation.
 */

export interface LookAngles {
  readonly yawRadians: number;
  readonly pitchRadians: number;
}

const TWO_PI = Math.PI * 2;

/** Wraps yaw into [0, 2*PI) so it never grows unbounded over a long play session. */
function wrapYaw(yawRadians: number): number {
  const wrapped = yawRadians % TWO_PI;
  return wrapped < 0 ? wrapped + TWO_PI : wrapped;
}

/**
 * Applies one frame's already-sensitivity-scaled look delta to the current
 * yaw/pitch, and clamps pitch so the camera cannot flip past straight up/down.
 *
 * Sign convention: positive lookDeltaX turns right, positive lookDeltaY looks
 * up. Adapters are responsible for translating their raw device deltas
 * (mouse movementX/Y, touch drag deltas) into this convention and for scaling
 * by their own configured sensitivity before this is called.
 *
 * @param current Current yaw/pitch.
 * @param lookDeltaXRadians Horizontal look delta for this frame, in radians.
 * @param lookDeltaYRadians Vertical look delta for this frame, in radians.
 * @param pitchClampRadians Maximum pitch magnitude in either direction.
 */
export function applyLookDelta(
  current: LookAngles,
  lookDeltaXRadians: number,
  lookDeltaYRadians: number,
  pitchClampRadians: number
): LookAngles {
  const yawRadians = wrapYaw(current.yawRadians + lookDeltaXRadians);
  const rawPitch = current.pitchRadians + lookDeltaYRadians;
  const pitchRadians = Math.min(pitchClampRadians, Math.max(-pitchClampRadians, rawPitch));
  return { yawRadians, pitchRadians };
}

/**
 * Computes the normalized world-space forward direction for a given yaw/pitch
 * (standard spherical-to-cartesian FPS look-direction formula), writing into
 * `out` to avoid per-frame allocation in the real render loop.
 *
 * Derived to match Babylon's default left-handed rotation convention when the
 * same yaw/pitch values are also assigned to `camera.rotation.y` / the
 * negated pitch to `camera.rotation.x` (see PlayerController) — both this
 * function and the camera's own transform must agree on "which way is up" for
 * interact-ray picking to match what the player is actually looking at.
 */
export function computeForwardDirection(yawRadians: number, pitchRadians: number, out: Vector3): Vector3 {
  const cosPitch = Math.cos(pitchRadians);
  out.set(Math.sin(yawRadians) * cosPitch, Math.sin(pitchRadians), Math.cos(yawRadians) * cosPitch);
  return out;
}
