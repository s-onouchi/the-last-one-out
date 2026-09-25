# Agent Test Spec: babylonjs-gui-specialist

## Agent Summary
- **Domain**: In-scene UI with Babylon GUI — `AdvancedDynamicTexture` (fullscreen and on-mesh), 2D controls and layout containers, 3D GUI (`GUI3DManager`, HolographicButton, NearMenu) for XR, Node GUI workflow, GUI input/focus handling, resolution independence, and GUI performance (dirty regions, texture size); the Babylon GUI vs HTML-overlay split
- **Does NOT own**: UX flow and screen navigation (ux-designer), visual direction (art-director), accessibility strategy (accessibility-specialist), HTML/DOM overlay UI (ui-programmer), gameplay logic in UI handlers (gameplay-programmer)
- **Model tier**: Sonnet
- **Gate IDs**: None; defers UX flow decisions to ux-designer

---

## Static Assertions (Structural)

- [ ] `description:` field is present and domain-specific (references AdvancedDynamicTexture, Babylon GUI controls, 3D GUI)
- [ ] `allowed-tools:` list matches the agent's role (Read/Write for UI TypeScript source; no server or gameplay source tools)
- [ ] Model tier is Sonnet (default for specialists)
- [ ] Agent definition does not claim authority over UX flow, accessibility policy, or gameplay data logic

---

## Test Cases

### Case 1: In-domain request — HUD with health and ammo
**Input**: "Build the combat HUD: health bar top-left, ammo counter bottom-right, updating when the player takes damage or fires."
**Expected behavior**:
- Creates one fullscreen `AdvancedDynamicTexture` (cached, not re-created per frame) with `idealWidth`/`idealHeight` set for resolution independence
- Anchors controls with `horizontalAlignment`/`verticalAlignment` and reserves a safe-area margin for mobile
- Drives updates from gameplay `Observable` events (damage, fire), not by polling or calling `markAsDirty()` every frame
- Output includes the control hierarchy, the binding/update mechanism, and asks before writing files

### Case 2: Out-of-domain request — UX flow design
**Input**: "Design the full navigation flow for the pause menu, settings, and inventory — how the player moves between them and backs out."
**Expected behavior**:
- Does not produce a navigation flow or screen transition architecture
- States that navigation flow is owned by `ux-designer`; offers to implement the Babylon GUI structure once the flow is defined
- Notes that settings screens are usually better as HTML overlay (and therefore `ui-programmer` territory) for accessibility

### Case 3: Domain boundary — accessibility-critical form
**Input**: "Build the account settings form (text fields, dropdowns, toggles) in Babylon GUI so everything stays in the canvas."
**Expected behavior**:
- Flags that Babylon GUI is canvas-rendered: no screen reader support, no default keyboard tab navigation, no default focus ring
- Recommends HTML overlay with semantic markup for the form, and routes the strategy decision to `accessibility-specialist` (and `technical-director` if it changes UI architecture)
- Does NOT silently build an inaccessible form without surfacing the trade-off

### Case 4: GUI performance issue — frame drops from UI updates
**Input**: "Our scoreboard re-creates its AdvancedDynamicTexture and 200 TextBlocks every frame and the game drops to 30 FPS."
**Expected behavior**:
- Identifies the root cause: per-frame ADT/control creation (GC pressure, texture re-allocation) and a full re-render defeating dirty-region rendering
- Recommends creating the ADT and rows once, updating only changed `text` properties, and toggling `isVisible` instead of create/destroy
- Recommends a `ScrollViewer` or paging if 200 rows exceed the visible area, and a bounded texture size (≤ 2048)
- Output is a concrete recommendation, not a vague "optimize it"

### Case 5: Context pass — XR target provided
**Input context**: Project ships a WebXR mode on Quest 3 with hand tracking enabled; the 2D HUD uses a fullscreen ADT.
**Input**: "Make the inventory menu usable in VR."
**Expected behavior**:
- Recognises that a fullscreen ADT does not render in an immersive session and proposes 3D GUI: `GUI3DManager` with `TouchHolographicButton` / `NearMenu`, or `HolographicSlate` / ADT-on-mesh for 2D content
- Places the panel at a comfortable distance (≈1.5–2 m, angled slightly down)
- Coordinates placement and input with `babylonjs-webxr-specialist` rather than reconfiguring the XR session itself
- Uses the provided hand-tracking context explicitly in the control choice

---

## Protocol Compliance

- [ ] Stays within declared domain (Babylon GUI structure, layout, GUI input, 3D GUI, GUI performance)
- [ ] Redirects UX flow to ux-designer, accessibility strategy to accessibility-specialist, and HTML overlay work to ui-programmer
- [ ] Returns structured findings (control hierarchy + update mechanism) rather than freeform opinions
- [ ] Surfaces the canvas-accessibility trade-off whenever a form or settings screen is requested in Babylon GUI
- [ ] Treats `docs/engine-reference/babylonjs/modules/ui.md` as authoritative for post-cutoff GUI APIs (Node GUI, 9.0+)

---

## Coverage Notes
- Case 3 (accessibility boundary) is the most important boundary test — Babylon GUI failing silently for assistive tech is a shipping-blocking issue
- Case 5 requires the project to have a WebXR mode; test is skipped if the project is not XR
- The Node GUI runtime loader API is marked "verify exact API name" in the agent file; no case asserts a specific Node GUI call until the reference confirms it
- No automated runner; review manually or via `/skill-test`
