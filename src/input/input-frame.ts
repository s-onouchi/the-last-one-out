/**
 * Engine-and-input-agnostic per-frame input contract for the player controller.
 *
 * Implements Story 001's architecture requirement: "入力は PC とタッチで分けた
 * アダプタにし、ゲーム側は「移動ベクトル・視点差分・調べる」だけを受け取る（テスト
 * できる形にする）". PlayerController only ever consumes PlayerInputFrame — it
 * never reads a keyboard, mouse, or touch event directly. Any InputAdapter
 * implementation (PC, touch, a future replay/test double, ...) is
 * interchangeable from its point of view.
 */
export interface PlayerInputFrame {
  /** Forward/back movement axis: -1 (full back) to 1 (full forward). */
  readonly moveForward: number;
  /** Strafe axis: -1 (full left) to 1 (full right). */
  readonly moveRight: number;
  /**
   * Horizontal look delta accumulated since the previous poll, in radians,
   * already scaled by the adapter's own configured sensitivity. Positive
   * turns right.
   */
  readonly lookDeltaX: number;
  /** Vertical look delta, same units/scaling as lookDeltaX. Positive looks up. */
  readonly lookDeltaY: number;
  /** True only on the single frame the interact input (key/click/tap) was triggered — edge-triggered, not held. */
  readonly interactPressed: boolean;
}

/** A source of PlayerInputFrame samples, backed by a real device or a test double. */
export interface InputAdapter {
  /** Attaches any DOM listeners/on-screen controls this adapter needs. Safe to call exactly once. */
  attach(): void;
  /** Removes all DOM listeners and releases any resources (e.g. on-screen controls). */
  detach(): void;
  /** Samples this frame's input. Must be called exactly once per rendered game frame. */
  pollFrame(): PlayerInputFrame;
}
