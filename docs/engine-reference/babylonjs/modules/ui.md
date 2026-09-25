# Babylon.js UI — Quick Reference

Last verified: 2026-05-03 | Engine: Babylon.js 9.5

> **Status: STUB** — overview of UI options. Detailed patterns live in the
> `babylonjs-gui-specialist` agent definition. This file will be expanded with
> code samples as project UI grows.

## UI Approach Selection

| Approach | Use For | XR Compatible | a11y |
|---|---|---|---|
| **Babylon GUI** | Game HUD, in-scene menus, XR-required UI | ✅ | ❌ Limited (no screen reader) |
| **HTML/CSS Overlay** | Settings, forms, marketing UI | ❌ | ✅ Native browser support |
| **Hybrid (React + Babylon GUI)** | Apps with both rich settings and in-game HUD | Partial | ✅ for HTML parts |

**Default:**
- Game HUD → Babylon GUI
- Settings/Menus on web → HTML overlay
- XR → Babylon GUI 3D variant (only option)

## Babylon GUI Modes

### AdvancedDynamicTexture (ADT) — 2D
- `AdvancedDynamicTexture.CreateFullscreenUI("UI")` — fullscreen overlay
- `AdvancedDynamicTexture.CreateForMesh(plane)` — projected onto a mesh (XR-friendly)
- Requires `idealWidth`/`idealHeight` for resolution-independent layout

### GUI3DManager — 3D In-World UI
- Holographic-style controls (`HolographicButton`, `NearMenu`, `TouchHolographicButton`, `MeshButton3D`, `HolographicSlate`)
- XR controller and hand tracking input route automatically
- For comfortable XR placement: 1.5-2m distance, slight downward angle

### Node GUI (9.0+)
- Visual graph editor at https://gui.babylonjs.com
- Export JSON, load via Node GUI runtime API
- Workflow: faster authoring for designers, awkward to version control

## Accessibility Caveat

Babylon GUI is canvas-rendered, so it provides **no native screen reader
support, no keyboard tab navigation, and no high-contrast integration**. For
any UI critical to non-visual users (settings, forms, content menus), use HTML
overlay with proper semantic markup. Coordinate with the `accessibility-specialist`
agent during design.

For game HUD (which is inherently visual), document the trade-off in the GDD.

## Layout

- Always set `idealWidth`/`idealHeight` for resolution independence
- Use `useSmallestIdeal = true` for aspect-correct scaling
- Containers: `StackPanel` (linear), `Grid` (cells), `Rectangle` (basic), `ScrollViewer` (scrollable)
- Anchor with `horizontalAlignment` / `verticalAlignment` for corner-pinned controls

## Performance

- ADT uses dirty-region rendering — only changed regions re-paint
- Avoid `markAsDirty()` per frame (defeats the optimization)
- Texture size: 1024² standard, 2048² ceiling
- For toggling popups, prefer `isVisible = false` over create/destroy

## Source Documents

- GUI overview: https://doc.babylonjs.com/features/featuresDeepDive/gui
- GUI 3D: https://doc.babylonjs.com/features/featuresDeepDive/gui/gui3D
- @babylonjs/gui npm: https://www.npmjs.com/package/@babylonjs/gui
