# Story 004: 手順と結びついた異変イベント（5〜6個）

> **Epic**: The Last One Out（MVP）
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: [fill before starting]
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 4

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] 異変イベントは 5〜6 個あり、それぞれ「どの手順で起きるか」と内容が `src/data/` の台本データで決まっている（ランダムでは起きない）
- [ ] まず 1 個を、手順の進行 → 異変が起きる → プレイヤーが気づける、まで最後まで動かす（怖さの核を最初に確かめる）
- [ ] 手順が進むほど異変が大きくなる（例：物の位置が少しずれる → 照明が勝手に点く → 誰もいない席のPCが点いている → …）
- [ ] 同じ異変は 1 回の通しプレイで 1 回しか起きない
- [ ] 005 の再開で手順を戻したとき、戻った手順より後の異変は起きていない状態に戻る
- [ ] 最後の方の異変の 1 つが、005 の「何か」が出てくるきっかけになる

---

## Implementation Notes

- 異変は「きっかけ（手順ID）→ 起こすこと → 元に戻す処理」の組で持ち、003 の `onStepCompletedObservable` を受けて起こす
- 各異変に reset を持たせ、005 の再開時に呼ぶ
- 驚かせる演出は数を絞る（brief の方針）。じわじわ系を多めに

---

## Out of Scope

- Story 005: 「何か」の追跡の中身
- Story 006: 異変の音・照明の仕上げ

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: Integration
**Required evidence**: `tests/integration/anomaly/anomaly-trigger_test.ts` OR playtest doc

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003 must be DONE
- Unlocks: Story 005, 006
