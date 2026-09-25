/**
 * Data-driven floor plan for the office greybox.
 *
 * Implements Story 002 (production/epics/the-last-one-out/story-002-office-greybox.md):
 * "物の配置（位置・種類・ID）は src/data/ のレイアウトデータから読み込み、コードに直接
 * 書かない". `src/scenes/office-scene.ts` is the only place this data is turned
 * into meshes — this file has no Babylon.js or DOM dependency so it stays pure
 * data, matching `src/data/player-config.ts`'s convention.
 *
 * Rebuilt 2026-09-25: the original 4-room ~16x14m footprint made a lap of the
 * main rooms take ~10 seconds — far too small (see the story's Acceptance
 * Criteria changelog note). This version is a ~40x30m single floor with a
 * corridor loop wrapping around/alongside a large open-plan work area, giving
 * a ~1 minute lap at `PLAYER_CONFIG.moveSpeed` (2 m/s).
 *
 * ## Coordinate convention
 * +X = east, +Z = north (this is the same yaw convention as
 * `gameplay/look.ts`'s `computeForwardDirection`: yaw = 0 faces +Z), Y = up,
 * one Babylon unit = one meter.
 *
 * ## Floor plan (exterior footprint x:[0,40] z:[0,30])
 *
 * ```text
 * z=30 +-------+--------+---------+----------+----------------+  <- north exterior wall
 *      |会議室  |倉庫/    | 給湯室   | トイレ    |  エレベーター前   |
 *      |meeting|資料室   | break   | restroom |  elevator      |
 *      |room   |storage  | room    |          |  lobby         |
 *      |x:0-9  |x:9-15   | x:15-22 | x:22-29  |  x:29-40       |
 * z=24 +--v----+---v-----+----v----+----v-----+--------v-------+  <- 5 doorways into 廊下 (v)
 *      |                                                       |
 *      |                  廊下 corridor (x:0-40)                |  <- turns south at x:[36,40]
 * z=20 +----------------------v--------------------------+     |     (no wall — the L-turn)
 *      |                                                  |     |
 *      |                                                  |     |  east leg
 *      |         執務エリア work area (x:0-36, z:0-20)       |     |  corridor
 *      |         desk islands: 3x(2 rows x 5 cols) = 30    |     |  (x:36-40,
 *      |         desks, clustered z:[4,6.4]                |     |   z:0-20)
 *      |                                                  |     |
 *      |                                                  +--^--+  <- doorway back
 *      |                                                  |     |     into work area
 * z=0  +--------------------------------------------------+-----+
 *     x=0                                                x=36  x=40
 *                                                          <- south exterior wall
 * ```
 *
 * Doorway gaps are all >=1.2m (comfortably over the player collider's 0.8m
 * diameter, see `player-config.ts`'s `playerRadius`). The walking loop is:
 * work area -(doorway at x=18,z=20)-> corridor -> east along corridor -> turn
 * south at the open x:[36,40] cell (no wall — this is the corridor's own L
 * turn, a blind corner) -> down the east leg -(doorway at x=36,z=10)-> back
 * into the work area. The 5 small rooms (meeting/storage/break/restroom/
 * lobby) each open onto the corridor with their own doorway, so a full tour
 * that pokes into every room adds distance on top of that core loop. See
 * `PLAYER_START`'s doc comment and the story report for the lap-length estimate.
 */

/** One of the walkable areas of the office floor. */
export type AreaId = "workArea" | "corridor" | "meetingRoom" | "storageRoom" | "breakRoom" | "restroom" | "elevatorLobby";

/** Japanese display label for each area, for debug logging / future UI (checklist screen, Story 003). */
export interface AreaDefinition {
  readonly id: AreaId;
  readonly label: string;
}

export const AREAS: readonly AreaDefinition[] = [
  { id: "workArea", label: "執務エリア" },
  { id: "corridor", label: "廊下" },
  { id: "meetingRoom", label: "会議室" },
  { id: "storageRoom", label: "倉庫／資料室" },
  { id: "breakRoom", label: "給湯室" },
  { id: "restroom", label: "トイレ" },
  { id: "elevatorLobby", label: "エレベーター前" },
];

/**
 * Stable identifier for a prop the closing procedure (Story 003/004) needs to
 * reference. Never rename an existing value once 003/004 depend on it —
 * treat this union the same as a public API. Unchanged from the previous
 * (4-room) layout pass.
 */
export type PropId = "lightSwitch" | "pcDesk1" | "pcDesk2" | "pcDesk3" | "window" | "lockableDoor" | "timeClock";

/** Visual/behavioral category shared by props of the same kind (e.g. all three PCs). */
export type PropType = "lightSwitch" | "pc" | "window" | "door" | "timeClock";

export interface Vec3Like {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface BoxSize {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
}

/** A single procedure-relevant prop: stable ID + type + placement, greybox geometry (a box). */
export interface ProcedurePropDefinition {
  readonly id: PropId;
  readonly type: PropType;
  /** Japanese label, for debug logging (not yet routed through a localization system — Story 003+ UI work). */
  readonly label: string;
  readonly area: AreaId;
  /** World-space box center. */
  readonly position: Vec3Like;
  readonly rotationYRadians: number;
  readonly size: BoxSize;
}

/** Plain collidable furniture (no interactable behavior, no stable ID needed) — one-off pieces (tables, counters). */
export interface FurnitureDefinition {
  readonly name: string;
  readonly position: Vec3Like;
  readonly rotationYRadians: number;
  readonly size: BoxSize;
  readonly checkCollisions: boolean;
}

/**
 * Compact generator for repeated identical furniture (desk islands, shelf
 * rows, stall partitions, chair clusters) — a `rows` x `columns` grid of
 * identical boxes starting at `origin` (the row0/col0 box's center) and
 * stepping by `rowSpacing` along +Z per row and `columnSpacing` along +X per
 * column. `office-scene.ts` turns each of these into one base mesh plus
 * `mesh.createInstance()` per remaining slot, so N identical desks/shelves
 * cost far fewer draw calls than N separate `MeshBuilder.CreateBox` calls.
 */
export interface FurnitureGridDefinition {
  readonly name: string;
  readonly origin: Vec3Like;
  readonly rows: number;
  readonly columns: number;
  /** Spacing between row centers, along +Z, in meters. */
  readonly rowSpacing: number;
  /** Spacing between column centers, along +X, in meters. */
  readonly columnSpacing: number;
  readonly rotationYRadians: number;
  readonly size: BoxSize;
  readonly checkCollisions: boolean;
}

/** One generated slot from a `FurnitureGridDefinition` (or any other per-item placement derived from one). */
export interface GeneratedSlot {
  readonly position: Vec3Like;
  readonly rotationYRadians: number;
}

/** Pure grid-to-slots expansion — no Babylon dependency, unit-testable in isolation. */
export function generateGridSlots(grid: FurnitureGridDefinition): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      slots.push({
        position: {
          x: grid.origin.x + column * grid.columnSpacing,
          y: grid.origin.y,
          z: grid.origin.z + row * grid.rowSpacing,
        },
        rotationYRadians: grid.rotationYRadians,
      });
    }
  }
  return slots;
}

/** A single straight wall box, defined by its run direction rather than by which room it faces. */
export interface WallSegmentDefinition {
  readonly name: string;
  readonly centerX: number;
  readonly centerZ: number;
  /** Extent along the wall's run direction, in meters (becomes the box's pre-rotation width). */
  readonly length: number;
  /** 0 = wall runs along world X (separates north/south areas); PI/2 = runs along world Z (separates east/west areas). */
  readonly rotationYRadians: number;
}

export const WALL_HEIGHT = 3;
export const WALL_THICKNESS = 0.2;

/** Exterior footprint (~40m x 30m per the story), used to size the single floor/ceiling plane. */
export const FLOOR_BOUNDS = { minX: 0, maxX: 40, minZ: 0, maxZ: 30 };

/**
 * All wall segments (exterior perimeter + interior dividers with doorway
 * gaps already cut in). Derived by hand from the floor plan diagram above —
 * see that comment for the room-boundary math behind these numbers. Every
 * doorway gap is >=1.2m; see each group's comment for the exact gap.
 */
export const WALL_SEGMENTS: readonly WallSegmentDefinition[] = [
  // --- Exterior perimeter (no gaps — this story has no functional exit) ---
  { name: "wallExteriorNorth", centerX: 20, centerZ: 30, length: 40, rotationYRadians: 0 },
  { name: "wallExteriorSouth", centerX: 20, centerZ: 0, length: 40, rotationYRadians: 0 },
  { name: "wallExteriorWest", centerX: 0, centerZ: 15, length: 30, rotationYRadians: Math.PI / 2 },
  { name: "wallExteriorEast", centerX: 40, centerZ: 15, length: 30, rotationYRadians: Math.PI / 2 },

  // --- North-band dividers between the 5 small rooms (z:[24,30], solid — rooms only connect via 廊下) ---
  { name: "wallMeetingStorage", centerX: 9, centerZ: 27, length: 6, rotationYRadians: Math.PI / 2 },
  { name: "wallStorageBreakRoom", centerX: 15, centerZ: 27, length: 6, rotationYRadians: Math.PI / 2 },
  { name: "wallBreakRoomRestroom", centerX: 22, centerZ: 27, length: 6, rotationYRadians: Math.PI / 2 },
  { name: "wallRestroomLobby", centerX: 29, centerZ: 27, length: 6, rotationYRadians: Math.PI / 2 },

  // --- 会議室 (meeting room) | 廊下 divider at z=24, x:[0,9] — doorway gap x:[3.8,5.2] (1.4m) ---
  { name: "wallMeetingCorridorA", centerX: 1.9, centerZ: 24, length: 3.8, rotationYRadians: 0 },
  { name: "wallMeetingCorridorB", centerX: 7.1, centerZ: 24, length: 3.8, rotationYRadians: 0 },

  // --- 倉庫／資料室 (storage) | 廊下 divider at z=24, x:[9,15] — doorway gap x:[11.3,12.7] (1.4m) ---
  { name: "wallStorageCorridorA", centerX: 10.15, centerZ: 24, length: 2.3, rotationYRadians: 0 },
  { name: "wallStorageCorridorB", centerX: 13.85, centerZ: 24, length: 2.3, rotationYRadians: 0 },

  // --- 給湯室 (break room) | 廊下 divider at z=24, x:[15,22] — doorway gap x:[17.8,19.2] (1.4m) ---
  { name: "wallBreakRoomCorridorA", centerX: 16.4, centerZ: 24, length: 2.8, rotationYRadians: 0 },
  { name: "wallBreakRoomCorridorB", centerX: 20.6, centerZ: 24, length: 2.8, rotationYRadians: 0 },

  // --- トイレ (restroom) | 廊下 divider at z=24, x:[22,29] — doorway gap x:[24.8,26.2] (1.4m) ---
  { name: "wallRestroomCorridorA", centerX: 23.4, centerZ: 24, length: 2.8, rotationYRadians: 0 },
  { name: "wallRestroomCorridorB", centerX: 27.6, centerZ: 24, length: 2.8, rotationYRadians: 0 },

  // --- エレベーター前 (elevator lobby) | 廊下 divider at z=24, x:[29,40] — doorway gap x:[33.8,35.2] (1.4m) ---
  { name: "wallLobbyCorridorA", centerX: 31.4, centerZ: 24, length: 4.8, rotationYRadians: 0 },
  { name: "wallLobbyCorridorB", centerX: 37.6, centerZ: 24, length: 4.8, rotationYRadians: 0 },

  // --- 執務エリア (work area) | 廊下 divider at z=20, x:[0,36] — doorway gap x:[17.3,18.7] (1.4m). ---
  // No wall for x:[36,40] at this z — the corridor turns south there into the east leg (a blind corner, not a doorway).
  { name: "wallWorkAreaCorridorA", centerX: 8.65, centerZ: 20, length: 17.3, rotationYRadians: 0 },
  { name: "wallWorkAreaCorridorB", centerX: 27.35, centerZ: 20, length: 17.3, rotationYRadians: 0 },

  // --- East leg corridor (x:[36,40], z:[0,20]) | 執務エリア divider at x=36 — doorway gap z:[9.3,10.7] (1.4m) ---
  { name: "wallEastLegWorkAreaA", centerX: 36, centerZ: 4.65, length: 9.3, rotationYRadians: Math.PI / 2 },
  { name: "wallEastLegWorkAreaB", centerX: 36, centerZ: 15.35, length: 9.3, rotationYRadians: Math.PI / 2 },
];

/** Shared box size for every desk (both the 3 procedure desks and the 27 plain ones). */
export const DESK_SIZE: BoxSize = { width: 1.0, height: 0.75, depth: 0.6 };

/**
 * Three 2-row x 5-column desk islands (30 desks total) across the south
 * strip of the work area (z:[4,6.4]), leaving the rest of the 36m x 20m work
 * area open for walking — see the floor plan comment above.
 */
export const DESK_ISLANDS: readonly FurnitureGridDefinition[] = [
  {
    name: "officeDeskIslandWest",
    origin: { x: 4, y: DESK_SIZE.height / 2, z: 4 },
    rows: 2,
    columns: 5,
    rowSpacing: 2.4,
    columnSpacing: 1.8,
    rotationYRadians: 0,
    size: DESK_SIZE,
    checkCollisions: true,
  },
  {
    name: "officeDeskIslandCenter",
    origin: { x: 16, y: DESK_SIZE.height / 2, z: 4 },
    rows: 2,
    columns: 5,
    rowSpacing: 2.4,
    columnSpacing: 1.8,
    rotationYRadians: 0,
    size: DESK_SIZE,
    checkCollisions: true,
  },
  {
    name: "officeDeskIslandEast",
    origin: { x: 26, y: DESK_SIZE.height / 2, z: 4 },
    rows: 2,
    columns: 5,
    rowSpacing: 2.4,
    columnSpacing: 1.8,
    rotationYRadians: 0,
    size: DESK_SIZE,
    checkCollisions: true,
  },
];

/**
 * All 30 desk slots, flattened in island order (west island = indices 0-9,
 * center = 10-19, east = 20-29; within an island, row-major: row0 col0..4,
 * then row1 col0..4). `PROCEDURE_PC_DESK_INDICES` below picks 3 of these by
 * index so the procedure PCs always sit exactly on top of a real generated
 * desk, with no coordinate drift between the two.
 */
export const ALL_DESK_SLOTS: readonly GeneratedSlot[] = DESK_ISLANDS.flatMap(generateGridSlots);

function requireDeskSlot(index: number): GeneratedSlot {
  const slot = ALL_DESK_SLOTS[index];
  if (!slot) {
    throw new Error(`office-layout: desk slot index ${index} is out of range (have ${ALL_DESK_SLOTS.length} desks)`);
  }
  return slot;
}

/** Desk index (into `ALL_DESK_SLOTS`) hosting the player's own PC — west island, row0 col0. */
const PC_DESK1_INDEX = 0;
/** Desk index hosting a coworker's PC — center island, row0 col2. */
const PC_DESK2_INDEX = 12;
/** Desk index hosting a coworker's PC — east island, row0 col2. */
const PC_DESK3_INDEX = 22;

/** The 3 desk slots that get an interactive procedure PC instead of a plain PC box. */
export const PROCEDURE_PC_DESK_INDICES: readonly number[] = [PC_DESK1_INDEX, PC_DESK2_INDEX, PC_DESK3_INDEX];

/** Shared box size for every PC (procedure and plain), sitting on top of a desk. */
export const PC_SIZE: BoxSize = { width: 0.4, height: 0.35, depth: 0.05 };
const PC_Y = DESK_SIZE.height + PC_SIZE.height / 2;

const PROCEDURE_PC_DESK_INDEX_SET = new Set<number>(PROCEDURE_PC_DESK_INDICES);

/**
 * A plain PC-shaped box for every desk that does NOT host a procedure PC (27
 * of the 30) — not interactable, no `PropId`, purely so the floor reads as an
 * office (story requirement: "non-procedure desks get a simple PC-shaped box
 * too"). Derived from `ALL_DESK_SLOTS` so it can never overlap a procedure PC.
 */
export const PLAIN_PC_SLOTS: readonly GeneratedSlot[] = ALL_DESK_SLOTS.filter(
  (_slot, index) => !PROCEDURE_PC_DESK_INDEX_SET.has(index)
).map((slot) => ({
  position: { x: slot.position.x, y: PC_Y, z: slot.position.z },
  rotationYRadians: Math.PI,
}));

/**
 * 倉庫／資料室 (storage/archive room, x:[9,15] z:[24,30]) — 3 long shelf rows
 * against the west wall (x:[9.1,13.5]), leaving a 1.4 m spine aisle along the
 * east wall (x:[13.5,14.9]) that links every between-row aisle. Row gaps are
 * 1.25 / 1.0 / 1.0 / 1.05 m — narrow and cramped, but all wider than the
 * 0.8 m player collider. Collidable.
 *
 * (A first pass used a 3x3 grid of short shelves with 0.4 m gaps between
 * units; the collider could not pass them, so everything past the first row
 * was unreachable.)
 */
export const SHELF_GRID: FurnitureGridDefinition = {
  name: "officeShelfRow",
  origin: { x: 11.3, y: 1.1, z: 25.6 },
  rows: 3,
  columns: 1,
  rowSpacing: 1.5,
  columnSpacing: 0,
  rotationYRadians: 0,
  size: { width: 4.4, height: 2.2, depth: 0.5 },
  checkCollisions: true,
};

/** トイレ (restroom, x:[22,29] z:[24,30]) — 2 stall partitions, collidable. */
export const STALL_GRID: FurnitureGridDefinition = {
  name: "officeStallPartition",
  origin: { x: 24, y: 1.05, z: 27 },
  rows: 1,
  columns: 2,
  rowSpacing: 0,
  columnSpacing: 3.0,
  rotationYRadians: 0,
  size: { width: 0.1, height: 2.1, depth: 2.0 },
  checkCollisions: true,
};

/** 会議室 (meeting room, x:[0,9] z:[24,30]) — 4 chairs around the meeting table, cheap decoration. */
export const CHAIR_GRID: FurnitureGridDefinition = {
  name: "officeChair",
  origin: { x: 3, y: 0.225, z: 25.5 },
  rows: 2,
  columns: 2,
  rowSpacing: 3.0,
  columnSpacing: 3.0,
  rotationYRadians: 0,
  size: { width: 0.4, height: 0.45, depth: 0.4 },
  checkCollisions: true,
};

/** All repeated-furniture grids — `office-scene.ts` instances each of these uniformly (1 base mesh + `createInstance()` per remaining slot). */
export const FURNITURE_GRIDS: readonly FurnitureGridDefinition[] = [...DESK_ISLANDS, SHELF_GRID, STALL_GRID, CHAIR_GRID];

/**
 * One-off collidable furniture (no repeated shape, so not worth a grid/instancing):
 * the meeting table and the break room's counter + fridge.
 */
export const FURNITURE: readonly FurnitureDefinition[] = [
  {
    name: "officeMeetingTable",
    position: { x: 4.5, y: 0.375, z: 27 },
    rotationYRadians: 0,
    size: { width: 3.0, height: 0.75, depth: 1.2 },
    checkCollisions: true,
  },
  {
    name: "officeBreakRoomCounter",
    position: { x: 15.4, y: 0.45, z: 27 },
    rotationYRadians: 0,
    size: { width: 0.6, height: 0.9, depth: 5.0 },
    checkCollisions: true,
  },
  {
    name: "officeBreakRoomFridge",
    position: { x: 21.5, y: 0.9, z: 25 },
    rotationYRadians: 0,
    size: { width: 0.7, height: 1.8, depth: 0.7 },
    checkCollisions: true,
  },
];

/**
 * Procedure props, per the story's acceptance criteria: 照明スイッチ、PC数台、窓、
 * 施錠するドア、タイムカード. Each has a `PropId` that Story 003/004 reference
 * directly instead of by mesh name. The 3 PCs sit exactly on top of desks
 * `PC_DESK1_INDEX`/`PC_DESK2_INDEX`/`PC_DESK3_INDEX` from `ALL_DESK_SLOTS`.
 */
export const PROCEDURE_PROPS: readonly ProcedurePropDefinition[] = [
  {
    id: "pcDesk1",
    type: "pc",
    label: "プレイヤーのPC",
    area: "workArea",
    position: { x: requireDeskSlot(PC_DESK1_INDEX).position.x, y: PC_Y, z: requireDeskSlot(PC_DESK1_INDEX).position.z },
    rotationYRadians: Math.PI,
    size: PC_SIZE,
  },
  {
    id: "pcDesk2",
    type: "pc",
    label: "PC",
    area: "workArea",
    position: { x: requireDeskSlot(PC_DESK2_INDEX).position.x, y: PC_Y, z: requireDeskSlot(PC_DESK2_INDEX).position.z },
    rotationYRadians: Math.PI,
    size: PC_SIZE,
  },
  {
    id: "pcDesk3",
    type: "pc",
    label: "PC",
    area: "workArea",
    position: { x: requireDeskSlot(PC_DESK3_INDEX).position.x, y: PC_Y, z: requireDeskSlot(PC_DESK3_INDEX).position.z },
    rotationYRadians: Math.PI,
    size: PC_SIZE,
  },
  {
    // On the work-area/corridor wall (wallWorkAreaCorridorA), flush against its
    // work-area-facing inner face (z=19.9), right next to the corridor doorway
    // at x:[17.3,18.7] — "near a doorway" per the story.
    id: "lightSwitch",
    type: "lightSwitch",
    label: "照明スイッチ",
    area: "workArea",
    position: { x: 17, y: 1.3, z: 19.875 },
    rotationYRadians: 0,
    size: { width: 0.2, height: 0.3, depth: 0.05 },
  },
  {
    // On the west exterior wall of the work area (x=0), flush against its
    // interior face (x=0.1), clear of the desk islands (which start at x=3.4).
    id: "window",
    type: "window",
    label: "窓",
    area: "workArea",
    position: { x: 0.15, y: 1.4, z: 10 },
    rotationYRadians: 0,
    size: { width: 0.1, height: 1.2, depth: 1.6 },
  },
  {
    // Flush against the solid north exterior wall (z=30, no gap there) within
    // the elevator lobby, clear of the lobby's own corridor doorway (x:[33.8,35.2]).
    id: "lockableDoor",
    type: "door",
    label: "施錠するドア",
    area: "elevatorLobby",
    position: { x: 36, y: 1.05, z: 29.85 },
    rotationYRadians: 0,
    size: { width: 1.0, height: 2.1, depth: 0.1 },
  },
  {
    // Flush against the lobby-facing inner face (z=24.1) of wallLobbyCorridorA.
    id: "timeClock",
    type: "timeClock",
    label: "タイムカード",
    area: "elevatorLobby",
    position: { x: 31, y: 1.2, z: 24.125 },
    rotationYRadians: 0,
    size: { width: 0.4, height: 0.5, depth: 0.05 },
  },
];

/**
 * Player spawn: standing behind their own desk (pcDesk1, west island row0
 * col0 at x=4,z=4) in 執務エリア, 1.8m south of it, facing north (+Z, toward
 * the desk) and looking slightly down (-0.26 rad, about -15°) so the desk and
 * PC are in view on the first frame.
 */
export const PLAYER_START = {
  position: { x: 4, y: 0, z: 2.2 } satisfies Vec3Like,
  yawRadians: 0,
  /** Positive = up. About -15°. */
  pitchRadians: -0.26,
};
