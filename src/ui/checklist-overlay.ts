import type { Observer } from "@babylonjs/core/Misc/observable";

import type { ChecklistProgress, ProcedureClearedEvent, StepCompletedEvent, StepProgress } from "../gameplay/checklist-progress";

/**
 * "手帳風" (notebook-style) HTML overlay for the closing-procedure checklist.
 *
 * Implements Story 003 (production/epics/the-last-one-out/story-003-checklist-progression.md):
 * "手帳風のチェックリスト画面を開閉でき...完了済み・今の手順・未着手が区別できる".
 * Read-only display driven entirely by `ChecklistProgress` — never mutates
 * gameplay state itself (per `.claude/rules/ui-code.md`: UI is display only).
 *
 * Open/close wiring is split by platform: PC toggles this via a raw
 * `document` "Tab" keydown listener in `main.ts` (not routed through
 * `PlayerInputFrame` — this is a UI toggle, not a gameplay input). Phones get
 * an on-screen button, created here when `showToggleButton` is true.
 */
export class ChecklistOverlay {
  private readonly _checklistProgress: ChecklistProgress;
  private readonly _panel: HTMLDivElement;
  private readonly _listElement: HTMLOListElement;
  private readonly _toggleButton: HTMLButtonElement | null;
  private readonly _stepCompletedObserver: Observer<StepCompletedEvent> | null;
  private readonly _procedureClearedObserver: Observer<ProcedureClearedEvent> | null;
  private _isOpen = false;

  public constructor(checklistProgress: ChecklistProgress, options: { readonly showToggleButton: boolean }) {
    this._checklistProgress = checklistProgress;

    this._panel = document.createElement("div");
    Object.assign(this._panel.style, {
      position: "absolute",
      top: "8%",
      right: "4%",
      minWidth: "220px",
      maxWidth: "320px",
      padding: "1em 1.2em",
      background: "#f2e9d8",
      color: "#2a2116",
      border: "2px solid #6b5a3f",
      borderRadius: "6px",
      fontFamily: "sans-serif",
      fontSize: "14px",
      lineHeight: "1.6",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
      // Non-interactive: taps/clicks pass through to the game underneath, same
      // convention as InteractPromptOverlay. Higher than the other overlays'
      // implicit (auto/0) stacking so it always draws on top of them.
      pointerEvents: "none",
      zIndex: "20",
      display: "none",
    } satisfies Partial<CSSStyleDeclaration>);

    const title = document.createElement("div");
    title.textContent = "退勤チェックリスト";
    Object.assign(title.style, {
      fontWeight: "bold",
      marginBottom: "0.5em",
      borderBottom: "1px solid #6b5a3f",
      paddingBottom: "0.3em",
    } satisfies Partial<CSSStyleDeclaration>);
    this._panel.appendChild(title);

    this._listElement = document.createElement("ol");
    Object.assign(this._listElement.style, { listStyle: "none", margin: "0", padding: "0" } satisfies Partial<CSSStyleDeclaration>);
    this._panel.appendChild(this._listElement);

    document.body.appendChild(this._panel);

    this._toggleButton = options.showToggleButton ? this._createToggleButton() : null;

    // Babylon's Observable.add() returns the Observer so it can be removed
    // individually in dispose() — InteractPromptOverlay skips this (it never
    // disposes its subscription), but this overlay's lifetime isn't guaranteed
    // to match ChecklistProgress's, so it removes its own observers explicitly.
    this._stepCompletedObserver = checklistProgress.onStepCompletedObservable.add(() => this._render());
    this._procedureClearedObserver = checklistProgress.onProcedureClearedObservable.add(() => this._render());

    this._render();
  }

  private _createToggleButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = "手帳";
    Object.assign(button.style, {
      position: "absolute",
      right: "4%",
      bottom: "4%",
      padding: "0.6em 1em",
      background: "rgba(0, 0, 0, 0.55)",
      color: "#ffffff",
      border: "none",
      borderRadius: "4px",
      fontFamily: "sans-serif",
      fontSize: "14px",
      // Unlike the panel, this button must be tappable — it's the phone's
      // only way to open/close the checklist.
      pointerEvents: "auto",
      zIndex: "20",
    } satisfies Partial<CSSStyleDeclaration>);

    // stopPropagation, not preventDefault: TouchInputAdapter's tap-gesture
    // listeners are attached on `document` (see touch-input-adapter.ts), so a
    // tap on this button would otherwise also bubble up and register as a
    // "調べる" tap at whatever the camera happens to be aimed at.
    const stopPropagationOnly = (event: PointerEvent): void => event.stopPropagation();
    button.addEventListener("pointerdown", stopPropagationOnly);
    button.addEventListener("pointerup", stopPropagationOnly);
    button.addEventListener("pointermove", stopPropagationOnly);
    button.addEventListener("click", () => this.toggle());

    document.body.appendChild(button);
    return button;
  }

  /** True while the checklist panel is visible. */
  public get isOpen(): boolean {
    return this._isOpen;
  }

  public open(): void {
    this._isOpen = true;
    this._panel.style.display = "block";
  }

  public close(): void {
    this._isOpen = false;
    this._panel.style.display = "none";
  }

  public toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private _render(): void {
    this._listElement.innerHTML = "";
    for (const step of this._checklistProgress.getStepProgress()) {
      const item = document.createElement("li");
      item.textContent = `${this._glyphForStatus(step.status)} ${step.label}`;
      Object.assign(item.style, this._styleForStatus(step.status));
      this._listElement.appendChild(item);
    }
  }

  private _glyphForStatus(status: StepProgress["status"]): string {
    switch (status) {
      case "complete":
        return "✓"; // checkmark
      case "current":
        return "▶"; // right-pointing triangle
      case "notStarted":
        return "・"; // katakana middle dot, used as a plain bullet
      default: {
        const exhaustiveCheck: never = status;
        return exhaustiveCheck;
      }
    }
  }

  private _styleForStatus(status: StepProgress["status"]): Partial<CSSStyleDeclaration> {
    switch (status) {
      case "complete":
        return { color: "#5a6b3f", textDecoration: "line-through", opacity: "0.75" };
      case "current":
        return { color: "#2a2116", fontWeight: "bold", opacity: "1" };
      case "notStarted":
        return { color: "#8a8070", opacity: "0.6" };
      default: {
        const exhaustiveCheck: never = status;
        return exhaustiveCheck;
      }
    }
  }

  /** Removes DOM elements and unsubscribes from `ChecklistProgress`'s observables. */
  public dispose(): void {
    this._checklistProgress.onStepCompletedObservable.remove(this._stepCompletedObserver);
    this._checklistProgress.onProcedureClearedObservable.remove(this._procedureClearedObserver);
    this._panel.remove();
    this._toggleButton?.remove();
  }
}
