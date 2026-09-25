# Babylon.js Navigation — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

## Recast Navigation Plugin

Babylon.js integrates [Recast](https://github.com/recastnavigation/recastnavigation) for nav mesh generation and pathfinding. The plugin is included in `@babylonjs/core`; the actual Recast WASM module is loaded separately.

```typescript
import { RecastJSPlugin } from "@babylonjs/core/Navigation/Plugins/recastJSPlugin";
import Recast from "recast-detour";

const recast = await Recast();
const navigationPlugin = new RecastJSPlugin(recast);
```

The `recast-detour` npm package is required separately — not bundled with `@babylonjs/core`.

## Building a Nav Mesh

```typescript
const parameters = {
  cs: 0.2,                        // cell size
  ch: 0.2,                        // cell height
  walkableSlopeAngle: 35,
  walkableHeight: 1,
  walkableClimb: 1,
  walkableRadius: 1,
  maxEdgeLen: 12,
  maxSimplificationError: 1.3,
  minRegionArea: 8,
  mergeRegionArea: 20,
  maxVertsPerPoly: 6,
  detailSampleDist: 6,
  detailSampleMaxError: 1,
};

navigationPlugin.createNavMesh([groundMesh, ...obstacleMeshes], parameters);
```

Build at scene load, not per-frame. Re-build when level geometry changes (rare).

## Querying Paths

```typescript
const start = new Vector3(0, 0, 0);
const end = new Vector3(10, 0, 5);
const path = navigationPlugin.computePath(start, end);
// path: Vector3[] - waypoints
```

For continuous agent navigation, use the crowd:

```typescript
const crowd = navigationPlugin.createCrowd(maxAgents, agentRadius, scene);
const agentIndex = crowd.addAgent(start, agentParams, agentMesh);
crowd.agentGoto(agentIndex, end);

scene.onBeforeRenderObservable.add(() => {
  const position = crowd.getAgentPosition(agentIndex);
  agentMesh.position.copyFrom(position);
});
```

## Crowd Behaviors

- `separationWeight` — pushes agents apart (avoid overlap)
- `pathOptimizationRange` — how aggressively to smooth path corners
- `obstacleAvoidanceType` — 0 (off) to 3 (high quality, expensive)

For typical RTS / action games: 1-2 obstacle avoidance, separationWeight ~ 1.0.

## Off-Mesh Connections

For jumps, ladders, teleports between disconnected nav mesh regions, use off-mesh links. Recast supports them via parameters; Babylon.js exposes through plugin API. See source docs.

## Performance

- Nav mesh generation is expensive (seconds for large levels) — cache the result
- Crowd update is per-frame; agent count > 100 starts to cost noticeable ms
- Path queries are cheap; cache result and re-query only when goal changes
- Disable crowd update if no agents are visible / active

## Alternatives

- **Manual A\* / Dijkstra**: implement on a custom grid for top-down 2D-ish games
- **Patrol points**: simple waypoint-following without a nav mesh, suitable for cutscenes
- **No nav at all**: many games don't need it (puzzle, racing, narrative — line-of-sight steering suffices)

## Common Pitfalls

- Forgetting to install `recast-detour` npm dependency (silent — plugin throws on first call)
- Building nav mesh from low-poly meshes that don't match collision geometry (paths cross walls)
- Cell size (`cs`) too small → memory blowup; too large → walls vanish
- Calling `computePath` per frame (expensive — query once, follow waypoints)
- Not handling "no path found" — `computePath` returns empty array, code must check
- Crowd update without scene render loop integration (agent position desyncs)

## Source Documents

- Navigation Plugin: https://doc.babylonjs.com/features/featuresDeepDive/crowdNavigation
- Recast.js: https://doc.babylonjs.com/features/featuresDeepDive/crowdNavigation/createNavMesh
- Crowd Agents: https://doc.babylonjs.com/features/featuresDeepDive/crowdNavigation/crowdAgents
- recast-detour npm: https://www.npmjs.com/package/recast-detour
