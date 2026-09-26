import { Observable } from "@babylonjs/core/Misc/observable";

import type { PropId } from "../data/office-layout";
import type { ClosingProcedureStepDefinition } from "../data/closing-procedure";

/**
 * Pure progress-tracking state machine for the closing procedure — no Scene,
 * mesh, or DOM dependency, deterministic given its inputs.
 *
 * Implements Story 003's architecture requirement: "進行管理は Babylon に依存
 * しない純粋な TypeScript のステートマシンにして、Vitest で単体テストできる形にする".
 * The only import from `@babylonjs/core` is `Observable` itself, per the
 * story's own naming convention ("通知は Observable<T> を使い") and the
 * project's existing signal convention (`PlayerController.
 * onInteractionTargetChangedObservable`); `Observable` has no Scene/DOM/WebGL
 * dependency and is safe to construct and notify in a plain Vitest test.
 *
 * ## Explicit transition table
 * - State: `currentStepIndex` in `[0, steps.length]` (`steps.length` = cleared).
 * - `tryCompleteStep(propId)`: `currentStepIndex -> currentStepIndex + 1` ONLY
 *   if `propId` matches `steps[currentStepIndex].propId` AND the procedure
 *   isn't already cleared. Any other `propId` (a future or already-completed
 *   step's prop) leaves `currentStepIndex` unchanged and returns `false` — this
 *   is what keeps "順番外の物を調べても手順は進まない" true.
 * - `revertToStep(index)` / `revertToPreviousStep()`: sets `currentStepIndex`
 *   directly, backward or forward, no side effects — Story 005 (再開/checkpoint
 *   resume) is the only intended caller.
 */
export type StepStatus = "notStarted" | "current" | "complete";

/** One step's display-relevant state, derived fresh from `currentStepIndex` on every read. */
export interface StepProgress {
  readonly stepIndex: number;
  readonly propId: PropId;
  readonly label: string;
  readonly status: StepStatus;
}

/** Payload for `onStepCompletedObservable` — enough for another system (Story 004's anomalies) to react to a specific step. */
export interface StepCompletedEvent {
  readonly stepIndex: number;
  readonly propId: PropId;
  readonly label: string;
  /** True if this was the last step in the procedure (the same completion that also fires `onProcedureClearedObservable`). */
  readonly isLastStep: boolean;
}

/** Payload for `onProcedureClearedObservable` — fired once, immediately after the last step's `onStepCompletedObservable`. */
export interface ProcedureClearedEvent {
  readonly totalSteps: number;
}

export class ChecklistProgress {
  private readonly _steps: readonly ClosingProcedureStepDefinition[];
  private _currentStepIndex = 0;

  /** Fires whenever a step completes (in order), carrying the completed step's index/id/label. */
  public readonly onStepCompletedObservable = new Observable<StepCompletedEvent>();
  /** Fires once, when the final step completes and the whole procedure is cleared. */
  public readonly onProcedureClearedObservable = new Observable<ProcedureClearedEvent>();

  public constructor(steps: readonly ClosingProcedureStepDefinition[]) {
    if (steps.length === 0) {
      throw new Error("ChecklistProgress: steps must not be empty");
    }
    this._steps = steps;
  }

  /** Index of the step currently awaiting completion, or `steps.length` once cleared. */
  public get currentStepIndex(): number {
    return this._currentStepIndex;
  }

  /** True once every step has been completed (`tryCompleteStep` always returns `false` after this). */
  public get isCleared(): boolean {
    return this._currentStepIndex >= this._steps.length;
  }

  /** Every step's current display status, derived from `currentStepIndex` — safe to call every render/UI update. */
  public getStepProgress(): readonly StepProgress[] {
    return this._steps.map((step, index) => ({
      stepIndex: index,
      propId: step.propId,
      label: step.label,
      status: index < this._currentStepIndex ? "complete" : index === this._currentStepIndex ? "current" : "notStarted",
    }));
  }

  /**
   * Attempts to complete the CURRENT step by interacting with `propId`.
   * Returns `false` (no state change, no notification) if the procedure is
   * already cleared or `propId` isn't the current step's prop — this is the
   * sole guard enforcing fixed step order ("順番外の物を調べても手順は進まない").
   */
  public tryCompleteStep(propId: PropId): boolean {
    if (this.isCleared) {
      return false;
    }

    const currentStep = this._steps[this._currentStepIndex];
    if (!currentStep || currentStep.propId !== propId) {
      return false;
    }

    const completedIndex = this._currentStepIndex;
    const isLastStep = completedIndex === this._steps.length - 1;
    this._currentStepIndex += 1;

    this.onStepCompletedObservable.notifyObservers({
      stepIndex: completedIndex,
      propId: currentStep.propId,
      label: currentStep.label,
      isLastStep,
    });

    if (isLastStep) {
      this.onProcedureClearedObservable.notifyObservers({ totalSteps: this._steps.length });
    }

    return true;
  }

  /**
   * Resets progress directly to `stepIndex` (0..steps.length inclusive), with
   * no notification fired — a checkpoint-restore primitive for Story 005's
   * resume flow, not used by anything in this story. Callers that need the UI
   * to refresh after a revert must trigger that themselves (e.g. Story 005
   * re-rendering the HUD after loading a checkpoint).
   */
  public revertToStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex > this._steps.length) {
      throw new Error(`ChecklistProgress.revertToStep: index ${stepIndex} out of range (0..${this._steps.length})`);
    }
    this._currentStepIndex = stepIndex;
  }

  /** Convenience wrapper: reverts to the step immediately before the current one (a no-op at step 0). */
  public revertToPreviousStep(): void {
    this.revertToStep(Math.max(0, this._currentStepIndex - 1));
  }

  /** Clears all observers. Call once when the owning scene/session ends. */
  public dispose(): void {
    this.onStepCompletedObservable.clear();
    this.onProcedureClearedObservable.clear();
  }
}
