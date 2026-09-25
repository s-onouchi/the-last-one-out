# Story 001: 一人称の移動と「調べる」操作（PC＋タッチ）

> **Epic**: The Last One Out（MVP）
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: M (1 day)
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-25

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 1

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] PC: WASD で移動、マウスで視点操作できる（クリックでポインターロック、Esc で解除）
- [ ] 一定距離内で画面中央の「調べられる物」に照準が合うと、表示が変わる（照準の強調やプロンプト）
- [ ] PC: E キー／左クリックで照準中の物を「調べる」と、その物の反応処理が呼ばれる
- [ ] スマホ: 画面左側の仮想スティックで移動、右側のドラッグで視点操作、タップで「調べる」ができる
- [ ] 壁や床を通り抜けない（当たり判定のある仮の箱の部屋で確認）
- [ ] 移動速度・視点感度・調べられる距離は `src/data/` の設定値から読み込み、コードに直接書かない
- [ ] PCブラウザで 60fps を保つ（仮の部屋で）

---

## Implementation Notes

- カメラは `UniversalCamera`／`FreeCamera` 系。9.8 の camera `InputMapper` と 9.12.1 の framerate-independent 移動は学習データより後の API — `docs/engine-reference/babylonjs/` を必ず確認
- 「調べる」判定はカメラ中央からの ray pick。調べられる物は metadata かインターフェースで印を付ける
- 入力は PC とタッチで分けたアダプタにし、ゲーム側は「移動ベクトル・視点差分・調べる」だけを受け取る（テストできる形にする）
- タッチUIの見た目は仮でよい（006/007 で整える）

---

## Out of Scope

- Story 002: 実際のオフィスの配置
- Story 003: 「調べる」ことでチェックリストの手順が進む処理

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: Integration
**Required evidence**: `tests/integration/player/player-input_test.ts` OR playtest doc

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, 003

---

## Completion Notes
**Completed**: 2026-09-25
**Criteria**: 6/7 passing (AC-4 スマホ操作 DEFERRED — 同じWi-Fiに実機がなく確認できず。GitHub Pages公開後に確認予定)
**Deviations**: ADVISORY — `package.json` に開発用依存 `playwright` を追加（スクリーンショット撮影ツール、範囲外だが妥当）
**Test Evidence**: qa.level: minimal のため必須ではない。手動操作確認 + `production/qa/evidence/story-001-first-person-controls/` のスクリーンショット群で代替
**Code Review**: Skipped — Solo mode
