# Story 005: 追ってくる「何か」と捕まったときの処理

> **Epic**: The Last One Out（MVP）
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: [fill before starting]
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 5

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] 決まった手順（004 のきっかけ）から、「何か」が 1 体出てきてプレイヤーを追う
- [ ] 「何か」はオフィス内を壁を抜けずに移動する（机や壁を回り込む）
- [ ] 一定距離まで近づかれると「捕まった」になり、ゲームオーバーの通知が出る
- [ ] ゲームオーバー後、直前の手順から再開でき、「何か」と異変はその手順の時点の状態に戻る
- [ ] 逃げ切れる余地がある（プレイヤーのほうが少し速い、または隠れる・扉で時間を稼げる）。速度・捕まる距離は `src/data/` の設定値
- [ ] 退勤打刻して出口を出たら、「何か」は止まりクリアになる
- [ ] ダッシュできる：PC は Shift を押している間、スマホは画面上のダッシュボタン（または仮想スティックを端まで倒す）で、歩き（2m/s）より速く走れる。走る速さは `src/data/player-config.ts` の設定値（2026-09-25 追加）

---

## Implementation Notes

- 追跡の判断（待機 → 追跡 → 捕まえた）は Babylon に依存しないステートマシンにして単体テストする
- 経路は、仮のウェイポイントのグラフで十分（ナビメッシュは使わない）
- 見た目は仮の黒い人型でよい（006 で仕上げ）

---

## Out of Scope

- Story 007: ゲームオーバー画面そのもの

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: Logic
**Required evidence**: `tests/unit/chaser/chaser-state_test.ts`

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003, 004 must be DONE
- Unlocks: Story 006, 007
