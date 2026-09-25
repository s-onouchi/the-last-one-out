# Agent Test Spec: babylonjs-shader-specialist

## Agent Summary
Domain: Babylon.js rendering customization — NodeMaterial (v2), ShaderMaterial (GLSL/WGSL), PBR/Standard material setup and IBL environments, post-processing pipelines (DefaultRenderingPipeline, custom PostProcess), CPU/GPU particle systems, and rendering performance across WebGL2 and WebGPU.
Does NOT own: art direction (art-director), gameplay logic, scene graph / mesh generation (babylonjs-specialist), shader library dependency approval (technical-director).
Model tier: Sonnet (default).
No gate IDs assigned.

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references NodeMaterial / ShaderMaterial / post-processing / WebGL2 and WebGPU)
- [ ] `allowed-tools:` list includes Read, Write, Edit, Glob, Grep
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Agent definition references `docs/engine-reference/babylonjs/VERSION.md` and `modules/rendering.md` as the authoritative source for rendering API changes

---

## Test Cases

### Case 1: In-domain request — appropriate output
**Input:** "Write a dissolve effect shader for enemy death in Babylon.js."
**Expected behavior:**
- Recommends NodeMaterial first (visual graph, exported `.json` committed to the repo) and offers a ShaderMaterial alternative only if hand-written code is required
- If ShaderMaterial is used: registers code in `Effect.ShadersStore`, declares every uniform in the `uniforms` list, and drives `dissolveAmount` via `setFloat`
- Samples a noise texture for the per-pixel threshold and uses `discard` below it, with optional edge emission
- Pre-compiles the material (`forceCompilationAsync`) so the first death does not stall a frame
- Asks before writing files

### Case 2: Wrong-engine redirect
**Input:** "Write this as a Godot `shader_type spatial;` shader with `hint_range` uniforms."
**Expected behavior:**
- Does NOT produce Godot shading language
- Identifies the request as a Godot pattern, not a Babylon.js one
- Provides the Babylon.js equivalent: a NodeMaterial input block or ShaderMaterial uniform set from TypeScript (`setFloat`), with range clamping handled in code or the NME input block
- Confirms the project is Babylon.js-based

### Case 3: Post-cutoff API risk
**Input:** "Use NodeMaterial v2's new node types to build a triplanar terrain material."
**Expected behavior:**
- Identifies NodeMaterial v2 (9.0) as post-cutoff (training data covers ~Babylon.js 7.x)
- Reads `docs/engine-reference/babylonjs/modules/rendering.md` and `breaking-changes.md` before naming specific node types
- Marks any node name it cannot confirm in the reference as unverified and recommends checking it in the Node Material Editor for the pinned version
- Does NOT invent node or block names from training data

### Case 4: Renderer selection trade-off
**Input:** "Should we switch the whole game to WebGPU so we can use compute shaders for our GPU particles?"
**Expected behavior:**
- Provides a balanced analysis: WebGPU is production-ready on desktop Chrome/Edge (9.0) and required for compute/WGSL; WebGL2 remains the universal default and is required for Quest browser XR and safer on mobile
- Notes `GPUParticleSystem` already runs on WebGL2 and may meet the need without a renderer switch
- Does NOT make the renderer decision unilaterally — escalates to `technical-director` (with `babylonjs-specialist`) as a render-pipeline strategy decision

### Case 5: Context pass — XR frame budget provided
**Input:** Context provided: target is Quest 3 WebXR at 90 FPS, WebGL2. Request: "Add bloom, depth of field, and SSR to make the scene look cinematic."
**Expected behavior:**
- Applies the 11.1 ms (stereo, ~5.5 ms per eye) budget from the provided context
- Flags SSR and depth of field as expensive full-screen passes that are unlikely to fit the XR budget, and checks each effect is stereo-safe (coordinating with `babylonjs-webxr-specialist`)
- Proposes a reduced `DefaultRenderingPipeline` configuration (e.g. bloom only) and states that every additional pass must be profiled on device
- Does not decide the visual look — refers aesthetic trade-offs to `art-director`

---

## Protocol Compliance

- [ ] Stays within declared domain (materials, shaders, post-processing, particles, rendering performance)
- [ ] Redirects art direction to art-director and scene-graph/mesh work to babylonjs-specialist
- [ ] Returns structured findings (material approach + performance cost) rather than unrequested code
- [ ] Treats `docs/engine-reference/babylonjs/` as authoritative over LLM training data
- [ ] Flags post-cutoff rendering APIs (NodeMaterial v2, WebGPU production path, 9.0) with verification requirements
- [ ] Escalates renderer (WebGL2 vs WebGPU) and new shader dependencies to technical-director

---

## Coverage Notes
- Case 1 checks the silent-failure mode unique to ShaderMaterial (undeclared uniforms never update)
- Case 3 confirms the agent does not confidently use node types it cannot verify
- Case 5 verifies the agent weighs post-processing cost against the XR budget instead of adding effects on request
- Visual output quality cannot be verified by spec review; requires a screenshot and lead sign-off
