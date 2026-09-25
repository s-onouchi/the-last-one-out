/// <reference types="vite/client" />
import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
// Side-effect import: registers the collision coordinator that
// scene.collisionsEnabled and mesh.moveWithCollisions need at runtime.
import "@babylonjs/core/Collisions/collisionCoordinator";

import { PLAYER_CONFIG } from "./data/player-config";
import { isTouchDevice } from "./input/device-detect";
import { PcInputAdapter } from "./input/pc-input-adapter";
import { TouchInputAdapter } from "./input/touch-input-adapter";
import { PlayerController } from "./player/player-controller";
import { createOfficeScene } from "./scenes/office-scene";
import { InteractPromptOverlay } from "./ui/interact-prompt-overlay";

// Implements Story 001: production/epics/the-last-one-out/story-001-first-person-controls.md
// Office floor implements Story 002: production/epics/the-last-one-out/story-002-office-greybox.md

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new Scene(engine);
scene.collisionsEnabled = true;

// PlayerController drives the camera's transform directly every frame — no
// attachControl(), no setTarget(); see player/player-controller.ts.
const camera = new FreeCamera("playerCamera", Vector3.Zero(), scene);
new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);

const { interactableRegistry, playerStartPosition, playerStartYawRadians, playerStartPitchRadians } = createOfficeScene(scene);

const useTouchInput = isTouchDevice();
const inputAdapter = useTouchInput ? new TouchInputAdapter(PLAYER_CONFIG) : new PcInputAdapter(canvas, PLAYER_CONFIG);
console.log(`[input] using ${useTouchInput ? "touch" : "pc"} input adapter`);

// PC: movement only works while the pointer is locked, so tell the player to click.
if (!useTouchInput) {
  const clickHint = document.createElement("div");
  clickHint.textContent = "クリックして開始（WASD：移動 / マウス：視点 / Esc：解除）";
  Object.assign(clickHint.style, {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "0.6em 1em",
    background: "rgba(0, 0, 0, 0.6)",
    color: "#ffffff",
    fontFamily: "sans-serif",
    fontSize: "16px",
    borderRadius: "4px",
    pointerEvents: "none",
  });
  document.body.appendChild(clickHint);
  document.addEventListener("pointerlockchange", () => {
    clickHint.style.display = document.pointerLockElement === canvas ? "none" : "block";
  });
}

// Debug launch arguments for run-and-observe captures: ?x=<m>&z=<m> sets the
// starting floor position, ?yaw=<deg>&pitch=<deg> the starting look direction
// (pitch positive = up). See .claude/docs/run-and-observe.md.
const launchParams = new URLSearchParams(location.search);
const numberParam = (name: string): number | undefined => {
  const raw = launchParams.get(name);
  const value = raw === null ? Number.NaN : Number(raw);
  return Number.isFinite(value) ? value : undefined;
};
const degreesParam = (name: string): number | undefined => {
  const degrees = numberParam(name);
  return degrees === undefined ? undefined : (degrees * Math.PI) / 180;
};
const startYawRadians = degreesParam("yaw") ?? playerStartYawRadians;
const startPitchRadians = degreesParam("pitch") ?? playerStartPitchRadians;
const debugX = numberParam("x");
const debugZ = numberParam("z");
if (debugX !== undefined) playerStartPosition.x = debugX;
if (debugZ !== undefined) playerStartPosition.z = debugZ;

const playerController = new PlayerController({
  scene,
  camera,
  config: PLAYER_CONFIG,
  inputAdapter,
  interactableRegistry,
  // The player's own desk in 仕事部屋 (data/office-layout.ts's PLAYER_START).
  startPosition: playerStartPosition,
  startYawRadians,
  startPitchRadians,
});

// Dev-only hook for automated run-and-observe checks (e.g. reading the player
// position after walking through a doorway). Stripped from production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __debug: unknown }).__debug = { camera };
}

const interactPrompt = new InteractPromptOverlay(playerController.onInteractionTargetChangedObservable);

engine.runRenderLoop(() => {
  const deltaSeconds = engine.getDeltaTime() / 1000;
  playerController.update(deltaSeconds);
  scene.render();
});

window.addEventListener("resize", () => engine.resize());

window.addEventListener("beforeunload", () => {
  playerController.dispose();
  interactPrompt.dispose();
  engine.dispose();
});
