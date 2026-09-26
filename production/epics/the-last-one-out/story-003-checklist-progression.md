# Story 003: 退勤チェックリストと手順の進行管理

> **Epic**: The Last One Out（MVP）
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: M (1 day)
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-26

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 3

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] 手順の一覧（消灯・PCを落とす・窓を閉める・施錠・退勤打刻 など）が `src/data/` の定義から読み込まれる
- [ ] 手順は決まった順番で進み、今の手順だけを実行できる（順番外の物を調べても手順は進まない）
- [ ] 対応する物を「調べる」と、その手順が完了扱いになり次の手順に進む
- [ ] 手帳風のチェックリスト画面を開閉でき（PC: Tab など／スマホ: ボタン）、完了済み・今の手順・未着手が区別できる
- [ ] 手順が進むと「手順が進んだ」通知（Observable）が出て、ほかのシステム（004 の異変）が受け取れる
- [ ] 最後の手順（退勤打刻して出口へ）を終えると「クリア」の通知が出る
- [ ] 進行状態を「直前の手順」に戻せる（005 の再開で使う）
- [ ] パフォーマンス：N/A — 純粋なロジック（ステートマシン）と軽量なUIのみで、レンダリングや物理への影響なし

---

## Implementation Notes

- 進行管理は Babylon に依存しない純粋な TypeScript のステートマシンにして、Vitest で単体テストできる形にする
- 通知は `Observable<T>` を使い、名前は `on<Event>Observable`（例 `onStepCompletedObservable`）
- 手帳の見た目は HTML オーバーレイでも Babylon GUI でもよい（HTML なら ui-programmer の担当範囲）

---

## Out of Scope

- Story 004: 手順の進行に合わせて起きる異変
- Story 007: クリア画面そのもの

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: Logic
**Required evidence**: `tests/unit/checklist/checklist-progress_test.ts`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001, 002 must be DONE
- Unlocks: Story 004, 005, 007

---

## Completion Notes
**Completed**: 2026-09-26
**Criteria**: 8/8 passing
**Deviations**:
- ADVISORY：PCの手順3つのうち2つが同じラベル「PCの電源を切る」で区別がつかない（席の区別が必要か要検討）
- ADVISORY：`revertToStep`/`revertToPreviousStep` は専用の通知を出さない。Story 005 がこれを使うときは、チェックリスト画面を手動で再描画する処理が必要
**Test Evidence**: Logic。`tests/unit/checklist/checklist-progress_test.ts` は未作成（`qa.level: minimal` のため advisory）。ステートマシンはBabylon/DOM非依存で書かれており、後からテスト可能。動作は自動操作テスト＋`production/qa/evidence/story-003-checklist-progression/`のスクリーンショット4枚で確認
**Code Review**: Skipped — Solo mode
