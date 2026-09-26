/**
 * Data-driven step list for the closing procedure (退勤チェックリスト).
 *
 * Implements Story 003 (production/epics/the-last-one-out/story-003-checklist-progression.md):
 * "手順の一覧...が src/data/ の定義から読み込まれる". Each step references a
 * `PropId` from `office-layout.ts` — the physical object in the office that
 * completes it when "調べる" is used on it — and a Japanese label for the
 * checklist HUD. Order in this array IS the required procedure order; nothing
 * elsewhere reorders it. Pure data: no Babylon.js or DOM dependency, matching
 * `office-layout.ts`'s and `player-config.ts`'s convention.
 */
import type { PropId } from "./office-layout";

export interface ClosingProcedureStepDefinition {
  /** The prop whose "調べる" completes this step. Must be one of the 7 PropId values from office-layout.ts. */
  readonly propId: PropId;
  /** Japanese display label for the checklist HUD. */
  readonly label: string;
}

/**
 * The fixed closing-procedure order: turn off the lights, shut down every PC,
 * close the window, lock the door, then clock out. `ChecklistProgress`
 * (src/gameplay/checklist-progress.ts) is the only thing that reads step
 * order/index out of this array at runtime.
 */
export const CLOSING_PROCEDURE_STEPS: readonly ClosingProcedureStepDefinition[] = [
  { propId: "lightSwitch", label: "照明を消す" },
  { propId: "pcDesk1", label: "PCの電源を切る（自分の席）" },
  { propId: "pcDesk2", label: "PCの電源を切る" },
  { propId: "pcDesk3", label: "PCの電源を切る" },
  { propId: "window", label: "窓を閉める" },
  { propId: "lockableDoor", label: "施錠する" },
  { propId: "timeClock", label: "退勤打刻する" },
];
