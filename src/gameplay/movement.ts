import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * Pure movement-vector math for the first-person controller — no Scene,
 * Engine, or DOM dependency, deterministic given its inputs.
 *
 * Implements Story 001's architecture requirement that movement-vector
 * application be "テストできる形にする" (testable).
 */

/**
 * Computes the world-space horizontal displacement for a single frame from
 * normalized move-axis input, camera yaw, speed, and elapsed time.
 *
 * Diagonal input (both axes near +/-1) is re-normalized so the player never
 * moves faster than `speedMetersPerSecond` in any direction; a joystick's
 * partial deflection (magnitude < 1) is preserved as analog speed.
 *
 * Writes the result into `out` and returns it, so the real render loop can
 * reuse a single Vector3 instance instead of allocating one per frame.
 * Passing a fresh Vector3 per call keeps this pure for unit tests.
 *
 * @param moveForward Forward/back axis, -1 to 1.
 * @param moveRight Strafe axis, -1 to 1.
 * @param yawRadians Current camera yaw (rotation around the world Y axis).
 * @param speedMetersPerSecond Movement speed at full axis deflection.
 * @param deltaSeconds Elapsed time this frame, in seconds.
 * @param out Vector3 to write the resulting displacement into.
 */
export function computeHorizontalDisplacement(
  moveForward: number,
  moveRight: number,
  yawRadians: number,
  speedMetersPerSecond: number,
  deltaSeconds: number,
  out: Vector3
): Vector3 {
  const forwardX = Math.sin(yawRadians);
  const forwardZ = Math.cos(yawRadians);
  const rightX = Math.cos(yawRadians);
  const rightZ = -Math.sin(yawRadians);

  const rawX = forwardX * moveForward + rightX * moveRight;
  const rawZ = forwardZ * moveForward + rightZ * moveRight;
  const rawLengthSq = rawX * rawX + rawZ * rawZ;
  const normalizeFactor = rawLengthSq > 1 ? 1 / Math.sqrt(rawLengthSq) : 1;

  const distance = speedMetersPerSecond * deltaSeconds;
  out.set(rawX * normalizeFactor * distance, 0, rawZ * normalizeFactor * distance);
  return out;
}
