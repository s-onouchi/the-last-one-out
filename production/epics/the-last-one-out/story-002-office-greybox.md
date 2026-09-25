# Story 002: オフィス1フロアの仮配置

> **Epic**: The Last One Out（MVP）
> **Status**: In Progress
> **Layer**: Foundation
> **Type**: Visual/Feel
> **Estimate**: L (1〜2 days — 2026-09-25 に広さと部屋数を拡大)
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-09-25

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

- [ ] 約40×30mの1フロアに、執務エリア（机を島型に並べて約30台）・廊下・会議室・倉庫／資料室・給湯室・トイレ・エレベーター前があり、すべてつながって歩いて回れる
- [ ] すべての壁・机・ドアに当たり判定があり、フロアの外に出られない
- [ ] 手順に使う物が配置されている（照明スイッチ、PC数台、窓、施錠するドア、タイムカード）。見た目は箱でよい
- [ ] プレイヤーの開始位置が執務エリアの自分の席
- [ ] 物の配置（位置・種類・ID）は `src/data/` のレイアウトデータから読み込み、コードに直接書かない
- [ ] 歩く速さ 2m/s で、主な部屋を回る1周がおよそ1分（2026-09-25 に広さを見直し：当初の4エリア案は1周10秒ほどで狭すぎた）
- [ ] 壁の向こう側にある物には照準が合わず、調べられない
- [ ] PC ブラウザで 60fps、スマホで 30fps 以上を保つ（draw call ≤500）

---

## Implementation Notes

- 形は MeshBuilder の箱で組む（ローポリの glb への差し替えは 006）
- 1単位 = 1m で作る。後で Blender のモデル（glTF）に差し替えるので、手順に使う物の ID は Blender の物体名にもそのまま使える名前にする
- 机の島・会議室・倉庫は、同じ形の繰り返しを配置データで生成してよい（机30台を1台ずつ手で書かない）。同じ形の机はインスタンス化して draw call を抑える
- 手順に使う物には、003/004 から参照できる安定した ID を付ける
- 当たり判定は Story 001 と同じ Babylon 組み込みの方式（`checkCollisions` + `moveWithCollisions`）。Havok は使わない（Story 004 で物理演出が必要になったら検討）
- 壁・床・天井は `isPickable = true` にして照準の判定を遮る。PlayerController 側は、調べられる物として登録されていないメッシュに当たったら「照準なし」として扱う
- Story 001 の仮の部屋 `src/scenes/test-room.ts` は、このストーリーで作るオフィスのシーンに置き換えて削除する

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
