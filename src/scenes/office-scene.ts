import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
// Side-effect import: registers Mesh.prototype.createInstance. Without it the
// scene throws "InstancedMesh needs to be imported" at runtime (tsc and the
// build both pass, so only launching the game catches this).
import "@babylonjs/core/Meshes/instancedMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import type { Interactable } from "../gameplay/interactable";
import {
  FLOOR_BOUNDS,
  FURNITURE,
  FURNITURE_GRIDS,
  PLAYER_START,
  PLAIN_PC_SLOTS,
  PC_SIZE,
  PROCEDURE_PROPS,
  WALL_HEIGHT,
  WALL_SEGMENTS,
  WALL_THICKNESS,
  generateGridSlots,
  type BoxSize,
  type FurnitureGridDefinition,
  type GeneratedSlot,
  type PropType,
} from "../data/office-layout";

export interface OfficeSceneResult {
  readonly interactableRegistry: Map<AbstractMesh, Interactable>;
  readonly playerStartPosition: Vector3;
  readonly playerStartYawRadians: number;
  readonly playerStartPitchRadians: number;
}

/**
 * A placeholder Interactable for a greybox procedure prop: toggles its own
 * material's albedo and emissive color and logs to the console when
 * interacted with — enough to prove the prop is reachable, aimable, and
 * reacts to "調べる". This is NOT the real closing-procedure logic (no
 * checklist, no ordering, no persistence) — that is Story 003/004's job,
 * keyed off each prop's `PropId` from `data/office-layout.ts`.
 */
class PlaceholderProcedureProp implements Interactable {
  private readonly _material: PBRMaterial;
  private readonly _propId: string;
  private readonly _baseColor: Color3;
  private readonly _highlightEmissive: Color3;
  private readonly _activeColor: Color3;
  private _isActivated = false;

  public constructor(material: PBRMaterial, propId: string, baseColor: Color3, highlightEmissive: Color3, activeColor: Color3) {
    this._material = material;
    this._propId = propId;
    this._baseColor = baseColor;
    this._highlightEmissive = highlightEmissive;
    this._activeColor = activeColor;
  }

  public onInteract(): void {
    this._isActivated = !this._isActivated;
    console.log(`[office-scene] interacted with ${this._propId}, activated=${this._isActivated}`);
    this._material.albedoColor = this._isActivated ? this._activeColor : this._baseColor;
  }

  public setHighlighted(highlighted: boolean): void {
    this._material.emissiveColor = highlighted ? this._highlightEmissive : Color3.Black();
  }
}

/** Per-prop-type placeholder coloring, so different procedure props are visually distinguishable in greybox. */
function getPropVisuals(type: PropType): { base: Color3; highlight: Color3; active: Color3 } {
  switch (type) {
    case "lightSwitch":
      return { base: new Color3(0.85, 0.85, 0.8), highlight: new Color3(0.4, 0.4, 0.1), active: new Color3(0.9, 0.85, 0.3) };
    case "pc":
      return { base: new Color3(0.12, 0.12, 0.15), highlight: new Color3(0.1, 0.25, 0.4), active: new Color3(0.15, 0.6, 0.2) };
    case "window":
      return { base: new Color3(0.55, 0.7, 0.75), highlight: new Color3(0.3, 0.4, 0.1), active: new Color3(0.2, 0.5, 0.55) };
    case "door":
      return { base: new Color3(0.3, 0.22, 0.15), highlight: new Color3(0.4, 0.3, 0.05), active: new Color3(0.55, 0.15, 0.15) };
    case "timeClock":
      return { base: new Color3(0.5, 0.5, 0.55), highlight: new Color3(0.4, 0.4, 0.1), active: new Color3(0.15, 0.6, 0.2) };
    default: {
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
    }
  }
}

/**
 * Builds one base mesh from `slots[0]` and `mesh.createInstance()` for every
 * remaining slot. Babylon batches a mesh's instances into a single instanced
 * draw call (per material), so this is the mechanism that keeps 30 desks / 9
 * shelves / etc. from costing 30/9/etc. draw calls — see the story's perf
 * requirement (≤500 draw calls). Regular instances (not thin instances) are
 * used deliberately: thin instances do not get individual collisions, and
 * every piece of furniture here must block the player (`checkCollisions`).
 */
function instantiateSlots(
  scene: Scene,
  material: PBRMaterial,
  namePrefix: string,
  size: BoxSize,
  checkCollisions: boolean,
  slots: readonly GeneratedSlot[]
): void {
  const [firstSlot, ...restSlots] = slots;
  if (!firstSlot) {
    return;
  }

  const base = MeshBuilder.CreateBox(namePrefix, { width: size.width, height: size.height, depth: size.depth }, scene);
  base.position.set(firstSlot.position.x, firstSlot.position.y, firstSlot.position.z);
  base.rotation.y = firstSlot.rotationYRadians;
  base.material = material;
  base.checkCollisions = checkCollisions;
  base.freezeWorldMatrix();

  restSlots.forEach((slot, index) => {
    const instance = base.createInstance(`${namePrefix}_${index + 1}`);
    instance.position.set(slot.position.x, slot.position.y, slot.position.z);
    instance.rotation.y = slot.rotationYRadians;
    instance.checkCollisions = checkCollisions;
    instance.freezeWorldMatrix();
  });
}

/** Convenience wrapper: expands a `FurnitureGridDefinition` and instances it in one call. */
function instantiateGrid(scene: Scene, material: PBRMaterial, grid: FurnitureGridDefinition): void {
  instantiateSlots(scene, material, grid.name, grid.size, grid.checkCollisions, generateGridSlots(grid));
}

/**
 * Builds the greybox office floor (執務エリア・廊下・会議室・倉庫／資料室・給湯室・
 * トイレ・エレベーター前) from `data/office-layout.ts` — no positions/types/IDs
 * are hardcoded here, all geometry is driven by that data file.
 *
 * Implements Story 002 (production/epics/the-last-one-out/story-002-office-greybox.md).
 * Rebuilt 2026-09-25 for the larger ~40x30m layout (see office-layout.ts's
 * header comment for the floor plan and rationale).
 *
 * Occlusion fix for interact-raycast: walls/floor/ceiling/furniture/instances
 * are left at Babylon's default `isPickable = true`. `scene.pickWithRay` in
 * `PlayerController` picks the single nearest pickable mesh, so a wall (or a
 * desk) standing between the camera and an interactable prop is now the pick
 * result, and `resolveInteractionTarget` (gameplay/interactable.ts) already
 * returns `null` for any picked mesh that isn't in the InteractableRegistry —
 * so non-interactable meshes are never treated as interactable, but they do
 * correctly block interactables behind them. No picking predicate is added.
 *
 * Perf: static meshes (walls, floor, ceiling, one-off furniture, procedure
 * props — none of which move) and every instanced mesh (desks, plain PCs,
 * shelves, stalls, chairs) get `freezeWorldMatrix()`. Shared static materials
 * (walls, furniture, plain PCs) get `.freeze()` only after every mesh/instance
 * that uses them has been assigned; each procedure prop keeps its own
 * unfrozen material instance because `setHighlighted`/`onInteract` mutate its
 * emissive/albedo color at runtime.
 */
export function createOfficeScene(scene: Scene): OfficeSceneResult {
  const staticMaterial = new PBRMaterial("officeStaticMaterial", scene);
  staticMaterial.albedoColor = new Color3(0.62, 0.6, 0.58);
  staticMaterial.metallic = 0;
  staticMaterial.roughness = 1;

  const floorWidth = FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX;
  const floorDepth = FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ;
  const floorCenterX = (FLOOR_BOUNDS.minX + FLOOR_BOUNDS.maxX) / 2;
  const floorCenterZ = (FLOOR_BOUNDS.minZ + FLOOR_BOUNDS.maxZ) / 2;

  // Single floor/ceiling plane spans the whole exterior footprint — the
  // areas tile it exactly (see office-layout.ts's floor plan diagram), so one
  // mesh each is both correct and cheaper than one per room.
  const floor = MeshBuilder.CreateGround("officeFloor", { width: floorWidth, height: floorDepth }, scene);
  floor.position.set(floorCenterX, 0, floorCenterZ);
  floor.material = staticMaterial;
  floor.checkCollisions = true;
  floor.freezeWorldMatrix();

  const ceiling = MeshBuilder.CreateGround("officeCeiling", { width: floorWidth, height: floorDepth }, scene);
  ceiling.position.set(floorCenterX, WALL_HEIGHT, floorCenterZ);
  ceiling.rotation.x = Math.PI;
  ceiling.material = staticMaterial;
  ceiling.checkCollisions = true;
  ceiling.freezeWorldMatrix();

  for (const wallDef of WALL_SEGMENTS) {
    const wall = MeshBuilder.CreateBox(wallDef.name, { width: wallDef.length, height: WALL_HEIGHT, depth: WALL_THICKNESS }, scene);
    wall.position.set(wallDef.centerX, WALL_HEIGHT / 2, wallDef.centerZ);
    wall.rotation.y = wallDef.rotationYRadians;
    wall.material = staticMaterial;
    wall.checkCollisions = true;
    wall.freezeWorldMatrix();
  }

  const furnitureMaterial = new PBRMaterial("officeFurnitureMaterial", scene);
  furnitureMaterial.albedoColor = new Color3(0.35, 0.28, 0.2);
  furnitureMaterial.metallic = 0;
  furnitureMaterial.roughness = 0.85;

  // Repeated furniture (desk islands, shelf rows, stall partitions, meeting
  // chairs) — one base mesh + createInstance() per remaining slot each, per
  // grid. FURNITURE_GRIDS (data/office-layout.ts) already includes all of
  // them alongside the desk islands, so a single loop builds everything.
  for (const grid of FURNITURE_GRIDS) {
    instantiateGrid(scene, furnitureMaterial, grid);
  }

  // One-off (non-repeated) furniture: meeting table, break room counter/fridge.
  for (const furnitureDef of FURNITURE) {
    const item = MeshBuilder.CreateBox(
      furnitureDef.name,
      { width: furnitureDef.size.width, height: furnitureDef.size.height, depth: furnitureDef.size.depth },
      scene
    );
    item.position.set(furnitureDef.position.x, furnitureDef.position.y, furnitureDef.position.z);
    item.rotation.y = furnitureDef.rotationYRadians;
    item.material = furnitureMaterial;
    item.checkCollisions = furnitureDef.checkCollisions;
    item.freezeWorldMatrix();
  }

  // Plain (non-interactable) PC boxes for every desk that doesn't host a
  // procedure PC — "non-procedure desks get a simple PC-shaped box too, so
  // the floor reads as an office" (story requirement). Shares one frozen
  // material, colored like the procedure PCs' base color for visual
  // consistency, but never registered as interactable.
  const plainPcMaterial = new PBRMaterial("officePlainPcMaterial", scene);
  plainPcMaterial.albedoColor = getPropVisuals("pc").base.clone();
  plainPcMaterial.metallic = 0;
  plainPcMaterial.roughness = 0.6;
  instantiateSlots(scene, plainPcMaterial, "officePlainPc", PC_SIZE, true, PLAIN_PC_SLOTS);

  // Freeze shared static materials only after every mesh/instance that uses
  // them has been assigned — freezing locks in the current material state.
  staticMaterial.freeze();
  furnitureMaterial.freeze();
  plainPcMaterial.freeze();

  const interactableRegistry = new Map<AbstractMesh, Interactable>();

  for (const propDef of PROCEDURE_PROPS) {
    const mesh = MeshBuilder.CreateBox(`officeProp_${propDef.id}`, { width: propDef.size.width, height: propDef.size.height, depth: propDef.size.depth }, scene);
    mesh.position.set(propDef.position.x, propDef.position.y, propDef.position.z);
    mesh.rotation.y = propDef.rotationYRadians;
    mesh.checkCollisions = true;
    mesh.freezeWorldMatrix();

    const visuals = getPropVisuals(propDef.type);
    const propMaterial = new PBRMaterial(`officeProp_${propDef.id}_material`, scene);
    propMaterial.albedoColor = visuals.base.clone();
    propMaterial.metallic = 0;
    propMaterial.roughness = 0.6;
    mesh.material = propMaterial;

    interactableRegistry.set(mesh, new PlaceholderProcedureProp(propMaterial, propDef.id, visuals.base, visuals.highlight, visuals.active));
  }

  return {
    interactableRegistry,
    playerStartPosition: new Vector3(PLAYER_START.position.x, PLAYER_START.position.y, PLAYER_START.position.z),
    playerStartYawRadians: PLAYER_START.yawRadians,
    playerStartPitchRadians: PLAYER_START.pitchRadians,
  };
}
