# Technical Preferences

<!-- project.yaml at the repo root is the machine-readable source of truth for
     engine, specialists, naming, performance, platform, and testing.framework.
     This file is the human-readable LEGACY FALLBACK: agents and skills resolve
     each key from project.yaml first and fall back here only when the
     project.yaml key is absent. /setup-engine dual-writes both.
     Forbidden patterns and allowed libraries are NOT migrated — they live only
     in this file. Populated by /setup-engine; updated as decisions are made. -->

## Engine & Language

- **Engine**: Babylon.js 9.28.0
- **Language**: TypeScript (strict + noUncheckedIndexedAccess mandatory)
- **Rendering**: WebGL2
- **Physics**: Havok

## Input & Platform

<!-- Written by /setup-engine. Read by /ux-design, /ux-review, /test-setup, /team-ui, and /dev-story -->
<!-- to scope interaction specs, test helpers, and implementation to the correct input methods. -->

- **Target Platforms**: Web (PC browsers, mobile browsers)
- **Input Methods**: Keyboard/Mouse, Touch
- **Primary Input**: Keyboard/Mouse (touch is secondary support)
- **Gamepad Support**: None
- **Touch Support**: Partial — virtual look/move controls needed for first-person camera on mobile
- **Platform Notes**: Mobile browser frame budget must be validated separately (WebGL2 on mid-range phones); no hover-only interactions in any UI.

## Naming Conventions

- **Classes**: PascalCase (e.g., `PlayerController`)
- **Variables**: camelCase (e.g., `moveSpeed`)
- **Signals/Events**: `on<Event>Observable` (Babylon's `Observable<T>` convention, e.g. `onPointerObservable`)
- **Files**: kebab-case (e.g., `player-controller.ts`) — consistent project-wide
- **Scenes/Prefabs**: kebab-case (Babylon scenes are TypeScript code or loaded `.glb`, not editor scene files)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HEALTH`)

Additional TypeScript conventions:
- Type imports: `import type { ... }` separated from runtime imports for tree-shaking
- Async functions: no special prefix (TypeScript types make async-ness visible)

## Performance Budgets

- **Target Framerate**: 60fps (PC browser); 30fps minimum acceptable floor on mobile browser
- **Frame Budget**: 16.6ms
- **Draw Calls**: ≤500 (mobile-safe WebGL2 budget)
- **Memory Ceiling**: ≤512MB (mobile browser safe)

## Testing

- **Framework**: Vitest (unit/integration); Playwright (browser/E2E)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, gameplay systems, networking (if applicable)

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- [None configured yet — add as dependencies are approved]

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [No ADRs yet — use /architecture-decision to create one]

## Engine Specialists

<!-- Written by /setup-engine when engine is configured. -->
<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills -->
<!-- to know which specialist to spawn for engine-specific validation. -->

- **Primary**: babylonjs-specialist
- **Language/Code Specialist**: babylonjs-specialist (TypeScript review — primary covers it; TS is fixed)
- **Shader Specialist**: babylonjs-shader-specialist (NodeMaterial v2, GLSL/WGSL, post-processing, particle shaders)
- **UI Specialist**: babylonjs-gui-specialist (Babylon GUI: ADT, 2D Controls, 3D GUI for XR, Node GUI)
- **Additional Specialists**: babylonjs-webxr-specialist (WebXR sessions, hand tracking, depth sensing, anchors, Quest/Vision Pro)
- **Routing Notes**: Invoke primary for scene graph architecture, asset loading, render loop, Vite/tsconfig setup, and physics integration. Invoke shader specialist for any material/shader/post-process work. Invoke UI specialist for in-scene UI (HTML overlay UI is `ui-programmer` domain). Invoke WebXR specialist for any immersive/VR/AR feature. Babylon.js is TypeScript-only — no language specialist split.

### File Extension Routing

<!-- Skills use this table to select the right specialist per file type. -->
<!-- If a row says [TO BE CONFIGURED], fall back to Primary for that file type. -->

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (.ts files) | babylonjs-specialist |
| Shader files (.glsl, .wgsl, inline shaders in .ts) | babylonjs-shader-specialist |
| NodeMaterial JSON exports (.nme.json) | babylonjs-shader-specialist |
| In-scene UI code (Babylon GUI, ADT, 3D GUI) | babylonjs-gui-specialist |
| Node GUI exports (.gui.json) | babylonjs-gui-specialist |
| WebXR / immersive feature code | babylonjs-webxr-specialist |
| Build / config files (vite.config.ts, tsconfig.json, package.json) | babylonjs-specialist |
| HTML overlay UI (DOM/CSS) | ui-programmer (engine-agnostic) |
| General architecture review | babylonjs-specialist |
