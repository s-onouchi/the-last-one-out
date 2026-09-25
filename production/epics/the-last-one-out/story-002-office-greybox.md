# Story 002: オフィス1フロアの仮配置

> **Epic**: The Last One Out（MVP）
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Visual/Feel
> **Estimate**: [fill before starting]
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: [set by /dev-story when implementation begins]

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 2

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: BabylonJS 9.28.0 | **Risk**: HIGH
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (the **Player goal & fail state** field + the MVP feature this story implements), scoped to this story:*

- [ ] 仕事部屋・給湯室・トイレ・エレベーター前の4エリアが、つながった1フロアとして歩いて回れる
- [ ] すべての壁・机・ドアに当たり判定があり、エリアの外に出られない
- [ ] 手順に使う物が配置されている（照明スイッチ、PC数台、窓、施錠するドア、タイムカード）。見た目は箱でよい
- [ ] プレイヤーの開始位置が仕事部屋の自分の席
- [ ] 物の配置（位置・種類・ID）は `src/data/` のレイアウトデータから読み込み、コードに直接書かない
- [ ] 1周歩いて1〜2分程度の広さ（20〜30分のプレイ時間に収まる）

---

## Implementation Notes

- 形は MeshBuilder の箱で組む（ローポリの glb への差し替えは 006）
- 手順に使う物には、003/004 から参照できる安定した ID を付ける
- 当たり判定は Havok か、カメラの collisions の軽いほうでよい。キャラクター移動に Havok を使うなら 9.7 の `maxStepHeight` を reference で確認

---

## Out of Scope

- Story 006: 見た目の作り込み、照明、テクスチャ

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

*Governed by `qa.level`: at `qa.level: minimal` the evidence below is **waived** (advisory, never "must exist and pass"). The run-and-observe screenshot in `production/qa/evidence/` is NOT waived for player-visible changes.*

**Story Type**: Visual/Feel
**Required evidence**: `production/qa/evidence/office-layout-evidence.md` + screenshot

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 must be DONE
- Unlocks: Story 003, 004
