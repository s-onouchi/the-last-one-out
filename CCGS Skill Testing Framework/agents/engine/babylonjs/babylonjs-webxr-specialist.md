# Agent Test Spec: babylonjs-webxr-specialist

## Agent Summary
- **Domain**: WebXR sessions (`immersive-vr`, `immersive-ar`), reference spaces, input sources (motion controllers, hand tracking, gaze), AR features (hit testing, plane detection, depth sensing, anchors), XR frame budget (90 FPS), and device quirks for Quest browser, Vision Pro Safari, and PCVR via browser
- **Does NOT own**: XR gameplay mechanics (game-designer), comfort/accessibility policy (accessibility-specialist), non-XR UI (babylonjs-gui-specialist), native VR engine choice (technical-director), cross-cutting Babylon.js architecture (babylonjs-specialist)
- **Model tier**: Sonnet
- **Gate IDs**: None; escalates hardware-target decisions to technical-director

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references WebXR, hand tracking, Quest / Vision Pro)
- [ ] `allowed-tools:` list matches the agent's role (Read/Write for XR TypeScript source; no deployment or server tools)
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Agent definition references `docs/engine-reference/babylonjs/modules/webxr.md` as the authoritative WebXR source

---

## Test Cases

### Case 1: In-domain request — VR session with hand tracking
**Input**: "Add a VR mode with teleportation and hand tracking for Quest 3."
**Expected behavior**:
- Uses `scene.createDefaultXRExperienceAsync()` with `floorMeshes` for teleportation and `immersive-vr` session mode
- Enables `WebXRFeatureName.HAND_TRACKING` through the features manager, requested **before** session start
- Uses a `local-floor` reference space with a fallback for devices that only support `local`
- Notes that Quest requires hand tracking enabled in system settings, and that the controller path must still work when hands are unavailable
- Includes cleanup on `EXITING_XR` / dispose so the headset is not left locked

### Case 2: Out-of-domain request — XR comfort policy
**Input**: "Decide whether our game should use smooth locomotion or snap-turn only, and what the vignette strength should be."
**Expected behavior**:
- Does not make the comfort policy decision
- States that comfort settings policy belongs to `accessibility-specialist` (and locomotion design to `game-designer`)
- Offers the technical implications of each option (implementation cost, frame budget impact) as input to that decision

### Case 3: Platform boundary — AR on Vision Pro
**Input**: "Our AR furniture-placement mode works on Quest 3. Make it work on Vision Pro too."
**Expected behavior**:
- Identifies that `immersive-ar` / passthrough is not exposed via WebXR on Vision Pro Safari (per the agent's reference as of 2026-05)
- Does NOT claim a workaround that silently enables AR on Vision Pro
- Proposes the degrade path: detect session-mode support, fall back to `immersive-vr` or a non-XR 3D view, and surfaces the scope decision to the user / `technical-director`

### Case 4: XR performance issue — frame drops in headset
**Input**: "The scene runs at 60 FPS on Quest 3 and players report nausea."
**Expected behavior**:
- States the 90 FPS / 11.1 ms hard target and that stereo rendering halves the effective per-eye budget
- Recommends concrete levers in priority order: foveation (`setFoveation`), hardware scaling level, material pre-compilation before session start, eliminating per-frame allocations
- Checks for `engine.runRenderLoop` double-driving while in the XR session
- Recommends profiling on device (Meta Browser DevTools) and coordinating with `performance-analyst`; not a vague "optimize it"

### Case 5: Context pass — renderer constraint provided
**Input context**: Project renderer is WebGPU (desktop), XR target is Quest 3 browser.
**Input**: "Enable WebXR for the existing scene."
**Expected behavior**:
- Flags that WebGPU is not yet stable on the Quest browser (per the agent's reference as of 2026-05) and XR projects should use WebGL2
- Does NOT silently switch the project's renderer — surfaces the conflict and escalates the renderer decision to `babylonjs-specialist` / `technical-director`
- Uses the provided renderer context explicitly in the recommendation rather than re-asking

---

## Protocol Compliance

- [ ] Stays within declared domain (WebXR sessions, XR input, AR features, XR performance, device quirks)
- [ ] Redirects comfort/accessibility policy to accessibility-specialist and XR mechanics to game-designer
- [ ] Returns structured findings (session config + feature list + fallback path) rather than freeform opinions
- [ ] Requests XR features before session start; never assumes hand tracking or a reference space is available
- [ ] Treats `docs/engine-reference/babylonjs/` as authoritative for post-cutoff WebXR APIs (depth sensing 8.0+)

---

## Coverage Notes
- Case 3 (Vision Pro AR) and Case 5 (WebGPU on Quest) depend on platform facts dated 2026-05 in the agent file; re-verify when `docs/engine-reference/babylonjs/VERSION.md` is re-pinned
- Case 4 (XR frame budget) is a high-impact failure mode — sub-90 FPS in a headset causes motion sickness; prioritize this test case
- Real device behavior (tracking loss, latency) cannot be verified by spec review; requires hardware playtest
- No automated runner; review manually or via `/skill-test`
