# @babylonjs/inspector — Package Reference

Last verified: 2026-05-03 | Package: `@babylonjs/inspector` (matched to Babylon.js 9.5)

## Purpose

Runtime debug overlay for Babylon.js scenes. Shows scene graph, materials, meshes, animations, performance metrics, and a live property editor. Inspector v2 (rewritten in 9.0) uses a service-oriented architecture with React-based UI.

**Critical: development tool only — never include in production builds.**

## License

Apache 2.0 (matches Babylon.js core).

## Install

```bash
npm install --save-dev @babylonjs/inspector
```

Note: `--save-dev`, not a runtime dependency.

## Bundle Size

Inspector is approximately **5 MB gzip**, including its peer-dependency graph (`@babylonjs/gui`, `@babylonjs/loaders`, `@babylonjs/materials`, `@babylonjs/serializers`, `@babylonjs/addons`). Including in production multiplies bundle size dramatically.

## Loading Pattern (Dev-Only)

```typescript
if (import.meta.env.DEV) {  // Vite-specific
  await import("@babylonjs/inspector");
  scene.debugLayer.show({ embedMode: true });
}
```

Or via env variable:

```typescript
if (process.env.NODE_ENV !== "production") {
  await import("@babylonjs/inspector");
  scene.debugLayer.show();
}
```

The dynamic `import()` ensures the bundler creates a separate chunk that is tree-shaken from production builds.

## Toggle in Development

Bind to a key for quick toggling:

```typescript
window.addEventListener("keydown", async (e) => {
  if (e.key === "I" && e.ctrlKey && e.shiftKey) {
    if (!scene.debugLayer.isVisible()) {
      await import("@babylonjs/inspector");
      scene.debugLayer.show({ embedMode: true });
    } else {
      scene.debugLayer.hide();
    }
  }
});
```

## Inspector v2 Features (9.0+)

- **Scene Explorer** — tree view of all nodes, lights, cameras, materials, textures
- **Property Editor** — live edit any property; changes apply immediately
- **Statistics** — FPS, frame time breakdown, draw calls, active mesh count
- **Performance Tab** — frame timing graph, GPU breakdown
- **Materials** — node material graph viewer, parameter tweaking
- **Animations** — animation group control, keyframe scrubber
- **GUI** — debug Babylon GUI hierarchies (new in v2)
- **XR** — XR session inspection (new in v2)

## Common Patterns

### Inspect a Specific Mesh
```typescript
scene.debugLayer.select(mesh);
```

### Embed in Custom Layout
```typescript
scene.debugLayer.show({
  embedMode: true,
  globalRoot: document.getElementById("inspector-container"),
});
```

### Production Smoke Test
For QA: enable inspector via URL param `?inspect=1`. Read in app:

```typescript
if (new URL(location.href).searchParams.get("inspect") === "1") {
  await import("@babylonjs/inspector");
  scene.debugLayer.show();
}
```

This ships the inspector chunk only when QA loads with the flag.

## Common Pitfalls

- Including `@babylonjs/inspector` as a regular `dependency` (ships in production — multiplies bundle size by 5x or more)
- Static `import "@babylonjs/inspector"` at top of file — defeats tree-shaking
- Forgetting to `dispose()` the debug layer when switching scenes (lingers and consumes resources)
- Relying on Inspector for production debugging — production should use Sentry/error tracking, not Inspector

## Source Documents

- Inspector v2 docs: https://doc.babylonjs.com/toolsAndResources/inspector
- @babylonjs/inspector npm: https://www.npmjs.com/package/@babylonjs/inspector
- Inspector v2 announcement (9.0): https://blogs.windows.com/windowsdeveloper/2026/03/26/announcing-babylon-js-9-0/
