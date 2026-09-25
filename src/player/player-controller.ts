import { Ray } from "@babylonjs/core/Culling/ray";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Observable } from "@babylonjs/core/Misc/observable";
import type { Scene } from "@babylonjs/core/scene";
import type { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";

import type { PlayerConfig } from "../data/player-config";
import type { InputAdapter } from "../input/input-frame";
import type { Interactable, InteractableRegistry } from "../gameplay/interactable";
import { resolveInteractionTarget } from "../gameplay/interactable";
import { computeHorizontalDisplacement } from "../gameplay/movement";
import { applyLookDelta, computeForwardDirection, type LookAngles } from "../gameplay/look";

export interface PlayerControllerOptions {
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly config: PlayerConfig;
  readonly inputAdapter: InputAdapter;
  readonly interactableRegistry: InteractableRegistry<AbstractMesh>;
  readonly startPosition: Vector3;
  readonly startYawRadians?: number;
  readonly startPitchRadians?: number;
}

/**
 * Babylon-specific glue for the first-person player: owns the camera and an
 * invisible collision proxy, drives both from an injected InputAdapter each
 * frame, and resolves/fires "調べる" interactions via a screen-center raycast.
 *
 * Implements Story 001 (production/epics/the-last-one-out/story-001-first-person-controls.md).
 *
 * This class is the sole authority over the camera transform: `camera.inputs`
 * is cleared and `camera.inertia` is forced to 0 so Babylon's own camera
 * input/movement pipeline (including the InputMapper and framerate-independent
 * movement introduced in 9.8 / 9.12.1) never engages — the collision proxy is
 * moved with `moveWithCollisions` and the camera is snapped to match, rather
 * than driving `camera.cameraDirection`/`cameraRotation`, so movement never
 * depends on that pipeline's per-frame contract either.
 */
export class PlayerController {
  private readonly _scene: Scene;
  private readonly _camera: FreeCamera;
  private readonly _config: PlayerConfig;
  private readonly _inputAdapter: InputAdapter;
  private readonly _interactableRegistry: InteractableRegistry<AbstractMesh>;
  private readonly _collider: Mesh;
  private readonly _eyeOffset: Vector3;
  private readonly _pitchClampRadians: number;
  private readonly _interactRay: Ray;
  private readonly _displacementScratch = new Vector3();
  private readonly _forwardScratch = new Vector3();

  private _lookAngles: LookAngles;
  private _currentTarget: Interactable | null = null;

  /** Fires whenever the currently-aimed-at interactable changes (including to/from null). */
  public readonly onInteractionTargetChangedObservable = new Observable<Interactable | null>();

  public constructor(options: PlayerControllerOptions) {
    this._scene = options.scene;
    this._camera = options.camera;
    this._config = options.config;
    this._inputAdapter = options.inputAdapter;
    this._interactableRegistry = options.interactableRegistry;
    this._pitchClampRadians = (options.config.pitchClampDegrees * Math.PI) / 180;
    this._lookAngles = { yawRadians: options.startYawRadians ?? 0, pitchRadians: options.startPitchRadians ?? 0 };

    // This class is the sole authority over the camera transform: make sure
    // no Babylon-owned input path can also drive it.
    this._camera.inputs.clear();
    this._camera.inertia = 0;
    this._camera.minZ = options.config.cameraNearClip;

    this._collider = MeshBuilder.CreateBox(
      "playerCollider",
      {
        width: options.config.playerRadius * 2,
        height: options.config.playerHeight,
        depth: options.config.playerRadius * 2,
      },
      options.scene
    );
    this._collider.isVisible = false;
    this._collider.isPickable = false;
    this._collider.checkCollisions = true;
    this._collider.ellipsoid = new Vector3(options.config.playerRadius, options.config.playerHeight / 2, options.config.playerRadius);
    this._collider.ellipsoidOffset = new Vector3(0, options.config.playerHeight / 2, 0);
    this._collider.position.copyFrom(options.startPosition);

    this._eyeOffset = new Vector3(0, options.config.eyeHeight, 0);
    this._collider.position.addToRef(this._eyeOffset, this._camera.position);

    this._interactRay = new Ray(Vector3.Zero(), new Vector3(0, 0, 1), options.config.interactDistance);

    this._inputAdapter.attach();
  }

  /** Advances the player by one frame: reads input, applies look/movement/collision, resolves interaction. */
  public update(deltaSeconds: number): void {
    const input = this._inputAdapter.pollFrame();

    this._lookAngles = applyLookDelta(this._lookAngles, input.lookDeltaX, input.lookDeltaY, this._pitchClampRadians);
    // rotation.x (pitch) is negated: Babylon's rotation-X convention is
    // positive-looks-down, while LookAngles.pitchRadians is positive-looks-up
    // (see gameplay/look.ts for the full derivation).
    this._camera.rotation.x = -this._lookAngles.pitchRadians;
    this._camera.rotation.y = this._lookAngles.yawRadians;

    computeHorizontalDisplacement(
      input.moveForward,
      input.moveRight,
      this._lookAngles.yawRadians,
      this._config.moveSpeed,
      deltaSeconds,
      this._displacementScratch
    );
    this._displacementScratch.y = -this._config.floorStickSpeed * deltaSeconds;

    this._collider.moveWithCollisions(this._displacementScratch);
    this._collider.position.addToRef(this._eyeOffset, this._camera.position);

    this._updateInteractionTarget();

    if (input.interactPressed && this._currentTarget) {
      this._currentTarget.onInteract();
    }
  }

  /** Detaches the input adapter and disposes the collision proxy. */
  public dispose(): void {
    this._inputAdapter.detach();
    this._collider.dispose();
    this.onInteractionTargetChangedObservable.clear();
  }

  private _updateInteractionTarget(): void {
    computeForwardDirection(this._lookAngles.yawRadians, this._lookAngles.pitchRadians, this._forwardScratch);
    this._interactRay.origin.copyFrom(this._camera.position);
    this._interactRay.direction.copyFrom(this._forwardScratch);

    const pickResult = this._scene.pickWithRay(this._interactRay);
    const nextTarget = resolveInteractionTarget(
      {
        hit: pickResult?.hit ?? false,
        distance: pickResult?.distance ?? Number.POSITIVE_INFINITY,
        pickedMesh: pickResult?.pickedMesh ?? null,
      },
      this._interactableRegistry,
      this._config.interactDistance
    );

    if (nextTarget !== this._currentTarget) {
      this._currentTarget?.setHighlighted(false);
      nextTarget?.setHighlighted(true);
      this._currentTarget = nextTarget;
      this.onInteractionTargetChangedObservable.notifyObservers(nextTarget);
    }
  }
}
