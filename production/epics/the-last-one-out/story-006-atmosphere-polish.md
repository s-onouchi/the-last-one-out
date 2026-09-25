# Story 006: 作り込み：照明・VHSフィルター・音

> **Epic**: The Last One Out（MVP）
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: [fill before starting]
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 6 (+ feature 2 polish)

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] 仮の箱のオフィスが、ローポリの見た目（机・椅子・PC・蛍光灯など）に置き換わっている
- [ ] 照明で夜のオフィスの雰囲気が出ている（消灯した場所は暗く、蛍光灯の下だけ明るい）。消灯の手順で実際に暗くなる
- [ ] VHS 風の画面エフェクト（ノイズ、にじみ、低解像度感）がかかっている。強さは `src/data/` で調整できる
- [ ] 環境音（蛍光灯のジー、PCのファン、空調）が鳴っていて、場所によって聞こえ方が変わる
- [ ] 手順の実行・異変・「何か」の接近に効果音が付いている
- [ ] 作り込み後も PC ブラウザで 60fps、スマホで 30fps 以上を保つ（draw call ≤500）

---

## Implementation Notes

- VHS フィルターは PostProcess（shader）で作る → babylonjs-shader-specialist の担当範囲
- 音は AudioEngine v2（8.0 以降の新しい API）。9.8 の distance-only spatial mode は学習データより後 — reference で確認
- モデルは glb で読み込む（`@babylonjs/loaders` を追加するときは Allowed Libraries に記録）
- スマホの負荷は必ず実機か、低スペック設定で確認する

---

## Out of Scope

- Story 007: タイトルなどの画面

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/atmosphere-evidence.md` + screenshots + sign-off

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002, 004, 005 must be DONE
- Unlocks: Story 007
