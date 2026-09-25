# Agent Test Spec: babylonjs-specialist

## Agent Summary
Domain: Babylon.js-specific patterns and APIs — scene graph (TransformNode/Mesh/Camera/Light), ESM `@babylonjs/*` imports and tree-shaking, asset loading (glTF/glb, AssetContainer, KTX2), render loop, `dispose()` lifecycle, Observables, Havok physics integration, and Vite/tsconfig (TypeScript strict) setup.
Does NOT own: shader/material authoring (delegates to babylonjs-shader-specialist), WebXR sessions and XR input (delegates to babylonjs-webxr-specialist), in-scene Babylon GUI (delegates to babylonjs-gui-specialist), game design decisions, npm package approval (technical-director).
Model tier: Sonnet (default).
No gate IDs assigned.

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references Babylon.js scene graph / asset loading / render loop / physics)
- [ ] `allowed-tools:` list includes Read, Write, Edit, Bash, Glob, Grep
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Agent definition references `docs/engine-reference/babylonjs/VERSION.md` as the authoritative API source

---

## Test Cases

### Case 1: In-domain request — appropriate output
**Input:** "How should I load and unload level geometry between stages in Babylon.js?"
**Expected behavior:**
- Recommends `AssetContainer` loading (`LoadAssetContainerAsync`) for assets that will be unloaded, and `addAllToScene()` / `removeAllFromScene()` or `dispose()` for the transition
- States that Babylon.js does NOT garbage-collect GPU resources — every loaded container must be explicitly disposed
- Recommends caching containers that are reused across stages rather than re-loading
- Uses scoped ESM imports (`@babylonjs/core/...`), not the UMD `babylonjs` package or the `@babylonjs/core` barrel
- Proposes the architecture and asks before writing files

### Case 2: Wrong-engine redirect
**Input:** "Write a MonoBehaviour that runs on Start() and subscribes to a UnityEvent."
**Expected behavior:**
- Does NOT produce Unity MonoBehaviour code
- Clearly identifies that this is a Unity pattern, not a Babylon.js pattern
- Provides the Babylon.js equivalent: a TypeScript class (or `Behavior`) initialised with an explicit `Scene` reference, and an `Observable<T>` instead of UnityEvent, storing the returned `Observer` for removal on dispose
- Confirms the project is Babylon.js-based and redirects the conceptual mapping

### Case 3: Post-cutoff API risk
**Input:** "Add spatial sound to the enemy mesh using the new Babylon.js 9 audio engine."
**Expected behavior:**
- Identifies that AudioEngine v2 post-dates the LLM knowledge cutoff (~Babylon.js 7.x) and that the legacy `Sound` API differs
- Reads `docs/engine-reference/babylonjs/VERSION.md` and `modules/audio.md` before suggesting code (e.g. `CreateAudioEngineAsync`, `spatialSound`)
- Flags the browser autoplay restriction: audio must be unlocked by a user gesture
- Clearly marks anything not in the reference docs as unverified rather than asserting it from training data

### Case 4: Out-of-domain delegation — shader work
**Input:** "Write a dissolve effect for enemy death."
**Expected behavior:**
- Identifies this as material/shader work owned by `babylonjs-shader-specialist`
- Delegates (or recommends delegating) with context: target mesh, renderer (WebGL2 vs WebGPU), frame budget
- Does NOT hand-write the NodeMaterial/GLSL itself
- May advise on the lifecycle side (material reuse, `dispose()` when the enemy is removed)

### Case 5: Context pass — Havok on an iOS target
**Input:** Context provided: Babylon.js 9.5, Havok physics, target platforms include iOS Safari 15. Request: "Set up the player physics body."
**Expected behavior:**
- Applies the Havok setup from `docs/engine-reference/babylonjs/modules/physics.md` (async `HavokPhysics()` init before enabling physics, `PhysicsBody` + `PhysicsShape`)
- Flags that Havok requires WebAssembly SIMD and fails silently on iOS < 16.4, which conflicts with the stated iOS 15 target
- Does NOT unilaterally switch to another physics plugin — escalates to the user / `technical-director` as an ADR-level decision
- Uses the provided version context instead of re-asking for it

---

## Protocol Compliance

- [ ] Stays within declared domain (Babylon.js architecture, asset loading, render loop, dispose lifecycle, physics integration, build config)
- [ ] Delegates shader work to babylonjs-shader-specialist, XR to babylonjs-webxr-specialist, Babylon GUI to babylonjs-gui-specialist
- [ ] Returns structured findings (architecture proposals with rationale) rather than unrequested code
- [ ] Treats `docs/engine-reference/babylonjs/` as authoritative over LLM training data
- [ ] Flags post-cutoff API usage (8.x, 9.x) with verification requirements
- [ ] Escalates npm package additions and physics-engine changes to technical-director

---

## Coverage Notes
- Case 1 (AssetContainer lifecycle) exercises the dispose discipline that prevents the most common Babylon.js memory leak
- Case 3 (AudioEngine v2) confirms the agent does not confidently use APIs it cannot verify
- Case 5 verifies the agent applies platform constraints from the reference (Havok/iOS SIMD) and escalates rather than silently swapping engines
- No automated runner; review manually or via `/skill-test`
