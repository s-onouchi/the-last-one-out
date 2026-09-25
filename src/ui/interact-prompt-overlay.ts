import type { Observable } from "@babylonjs/core/Misc/observable";

import type { Interactable } from "../gameplay/interactable";

const PROMPT_TEXT = "E / タップ：調べる";

/**
 * Minimal DOM overlay for the "調べる" prompt — deliberately placeholder
 * visuals per Story 001's Implementation Notes ("タッチUIの見た目は仮でよい
 * （006/007で整える）"). Kept out of player/gameplay code so gameplay never
 * references UI directly: it only subscribes to PlayerController's
 * onInteractionTargetChangedObservable.
 */
export class InteractPromptOverlay {
  private readonly _element: HTMLDivElement;

  public constructor(onInteractionTargetChangedObservable: Observable<Interactable | null>) {
    this._element = document.createElement("div");
    this._element.textContent = PROMPT_TEXT;
    this._element.style.position = "absolute";
    this._element.style.left = "50%";
    this._element.style.bottom = "12%";
    this._element.style.transform = "translateX(-50%)";
    this._element.style.padding = "0.4em 0.8em";
    this._element.style.background = "rgba(0, 0, 0, 0.55)";
    this._element.style.color = "#ffffff";
    this._element.style.fontFamily = "sans-serif";
    this._element.style.fontSize = "14px";
    this._element.style.borderRadius = "4px";
    this._element.style.pointerEvents = "none";
    this._element.style.display = "none";
    document.body.appendChild(this._element);

    onInteractionTargetChangedObservable.add((interactable) => {
      this._element.style.display = interactable ? "block" : "none";
    });
  }

  public dispose(): void {
    this._element.remove();
  }
}
