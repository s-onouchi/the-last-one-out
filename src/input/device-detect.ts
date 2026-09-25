/**
 * Detects devices whose PRIMARY pointer is a finger (phones, tablets) so the
 * bootstrap can choose the matching InputAdapter.
 *
 * Deliberately not `navigator.maxTouchPoints > 0`: many Windows laptops report
 * touch points even without a touchscreen (or have one alongside a mouse), which
 * picked the touch adapter on PC and left keyboard/mouse dead.
 */
export function isTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}
