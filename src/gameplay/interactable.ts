/**
 * Interactable contract and pure target-resolution logic for the "調べる"
 * system.
 *
 * Implements Story 001: "「調べる」判定はカメラ中央からの ray pick。調べられる
 * 物は metadata かインターフェースで印を付ける". Objects are marked interactable
 * by registering them (their mesh) in an InteractableRegistry — not by string
 * metadata tags — so the mapping is type-checked and unregistration is explicit.
 */

/** Something the player can aim at and "調べる" (examine/interact with). */
export interface Interactable {
  /** Called once when the player triggers interact while this object is the current target. */
  onInteract(): void;
  /** Toggles this object's aim-highlight/prompt-eligible visual state. */
  setHighlighted(highlighted: boolean): void;
}

/** Maps a scene object (typically an AbstractMesh) to its Interactable behavior. */
export type InteractableRegistry<TTarget> = ReadonlyMap<TTarget, Interactable>;

/** The subset of a Babylon PickingInfo this module needs — kept generic so it's unit-testable without a real Scene/mesh. */
export interface InteractionPick<TTarget> {
  readonly hit: boolean;
  readonly distance: number;
  readonly pickedMesh: TTarget | null;
}

/**
 * Pure resolution of "what is the player currently aiming at, if anything
 * interactable and in range". No Scene/DOM dependency; generic over the
 * picked-object type so tests can use plain object identities as fake meshes.
 */
export function resolveInteractionTarget<TTarget>(
  pick: InteractionPick<TTarget>,
  registry: InteractableRegistry<TTarget>,
  maxDistance: number
): Interactable | null {
  if (!pick.hit || pick.pickedMesh === null) {
    return null;
  }
  if (pick.distance > maxDistance) {
    return null;
  }
  return registry.get(pick.pickedMesh) ?? null;
}
