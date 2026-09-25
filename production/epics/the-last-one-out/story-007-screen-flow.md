# Story 007: 画面の流れ：タイトル → 本編 → クリア／ゲームオーバー

> **Epic**: The Last One Out（MVP）
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: [fill before starting]
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 7

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] 起動するとタイトル画面が出て、「はじめる」で本編が始まる
- [ ] 最初のクリック／タップで音が鳴るようになる（ブラウザの自動再生の制限への対応）
- [ ] 003 のクリア通知でクリア画面が出て、タイトルに戻れる
- [ ] 005 のゲームオーバー通知でゲームオーバー画面が出て、「直前の手順から再開」と「タイトルに戻る」を選べる
- [ ] すべての画面が PC（マウス／キーボード）とスマホ（タップ）で操作でき、ホバーでしか出ない操作がない
- [ ] 画面の文言は日本語で、`src/data/` の文言データから読み込む

---

## Implementation Notes

- 画面の切り替えは小さなステートマシン（title / playing / cleared / gameover）にして単体テストできる形にする
- 画面は HTML オーバーレイ（ui-programmer）か Babylon GUI（babylonjs-gui-specialist）のどちらか一方に揃える

---

## Out of Scope

- セーブ機能、設定画面、多言語対応（brief の Out of scope）

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: UI
**Required evidence**: `production/qa/evidence/screen-flow-evidence.md` + screenshot of each screen

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003, 005 must be DONE
- Unlocks: None
