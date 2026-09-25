import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

import type { Interactable } from "../gameplay/interactable";

const ROOM_WIDTH = 8;
const ROOM_DEPTH = 8;
const ROOM_HEIGHT = 3;
const WALL_THICKNESS = 0.2;

export interface TestRoomResult {
  readonly interactableRegistry: Map<AbstractMesh, Interactable>;
}

/**
 * An Interactable that toggles its material's albedo color and logs to the
 * console when interacted with — just enough to prove the "調べる" reaction
 * callback actually fires. There is no checklist/progression system yet
 * (Story 003's job); this is a throwaway probe, not a real office prop.
 */
class ToggleColorProbe implements Interactable {
  private readonly _material: PBRMaterial;
  private readonly _label: string;
  private readonly _baseColor: Color3;
  private readonly _highlightColor: Color3;
  private readonly _activeColor: Color3;
  private _isActivated = false;

  public constructor(material: PBRMaterial, label: string, baseColor: Color3, highlightColor: Color3, activeColor: Color3) {
    this._material = material;
    this._label = label;
    this._baseColor = baseColor;
    this._highlightColor = highlightColor;
    this._activeColor = activeColor;
  }

  public onInteract(): void {
    this._isActivated = !this._isActivated;
    console.log(`[test-room] interacted with ${this._label}, activated=${this._isActivated}`);
    this._material.albedoColor = this._isActivated ? this._activeColor : this._baseColor;
  }

  public setHighlighted(highlighted: boolean): void {
    this._material.emissiveColor = highlighted ? this._highlightColor : Color3.Black();
  }
}

interface WallDefinition {
  readonly name: string;
  readonly position: Vector3;
  readonly rotationY: number;
}

const WALL_DEFINITIONS: readonly WallDefinition[] = [
  { name: "testRoomWallNorth", position: new Vector3(0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2), rotationY: 0 },
  { name: "testRoomWallSouth", position: new Vector3(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2), rotationY: Math.PI },
  { name: "testRoomWallEast", position: new Vector3(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0), rotationY: Math.PI / 2 },
  { name: "testRoomWallWest", position: new Vector3(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0), rotationY: -Math.PI / 2 },
];

/**
 * Throwaway boxed test room for Story 001 — proves wall/floor collision and
 * the "調べる" interaction loop against something.
 *
 * Per the story's Out of Scope: "Story 002: 実際のオフィスの配置" replaces this
 * room entirely. Nothing here (geometry, materials, probe objects) is meant
 * to survive into that story.
 */
export function createTestRoom(scene: Scene): TestRoomResult {
  const wallMaterial = new PBRMaterial("testRoomWallMaterial", scene);
  wallMaterial.albedoColor = new Color3(0.6, 0.6, 0.62);
  wallMaterial.metallic = 0;
  wallMaterial.roughness = 1;

  const floor = MeshBuilder.CreateGround("testRoomFloor", { width: ROOM_WIDTH, height: ROOM_DEPTH }, scene);
  floor.material = wallMaterial;
  floor.checkCollisions = true;
  floor.isPickable = false;

  const ceiling = MeshBuilder.CreateGround("testRoomCeiling", { width: ROOM_WIDTH, height: ROOM_DEPTH }, scene);
  ceiling.position.y = ROOM_HEIGHT;
  ceiling.rotation.x = Math.PI;
  ceiling.material = wallMaterial;
  ceiling.checkCollisions = true;
  ceiling.isPickable = false;

  for (const wallDef of WALL_DEFINITIONS) {
    const wall = MeshBuilder.CreateBox(wallDef.name, { width: ROOM_WIDTH, height: ROOM_HEIGHT, depth: WALL_THICKNESS }, scene);
    wall.position.copyFrom(wallDef.position);
    wall.rotation.y = wallDef.rotationY;
    wall.material = wallMaterial;
    wall.checkCollisions = true;
    wall.isPickable = false;
  }

  const interactableRegistry = new Map<AbstractMesh, Interactable>();

  const probeBox = MeshBuilder.CreateBox("probeBoxDesk", { size: 0.6 }, scene);
  probeBox.position.set(-1.5, 0.3, 1.5);
  const probeBoxMaterial = new PBRMaterial("probeBoxMaterial", scene);
  probeBoxMaterial.albedoColor = new Color3(0.35, 0.3, 0.2);
  probeBoxMaterial.metallic = 0;
  probeBoxMaterial.roughness = 0.8;
  probeBox.material = probeBoxMaterial;
  interactableRegistry.set(
    probeBox,
    new ToggleColorProbe(
      probeBoxMaterial,
      "probeBoxDesk",
      probeBoxMaterial.albedoColor.clone(),
      new Color3(0.4, 0.4, 0.1),
      new Color3(0.15, 0.6, 0.2)
    )
  );

  const probeSphere = MeshBuilder.CreateSphere("probeSphereLamp", { diameter: 0.5 }, scene);
  probeSphere.position.set(1.5, 1, -1.5);
  const probeSphereMaterial = new PBRMaterial("probeSphereMaterial", scene);
  probeSphereMaterial.albedoColor = new Color3(0.8, 0.8, 0.7);
  probeSphereMaterial.metallic = 0;
  probeSphereMaterial.roughness = 0.4;
  probeSphere.material = probeSphereMaterial;
  interactableRegistry.set(
    probeSphere,
    new ToggleColorProbe(
      probeSphereMaterial,
      "probeSphereLamp",
      probeSphereMaterial.albedoColor.clone(),
      new Color3(0.4, 0.4, 0.1),
      new Color3(0.9, 0.85, 0.3)
    )
  );

  return { interactableRegistry };
}
